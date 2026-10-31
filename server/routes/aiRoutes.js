const express = require('express');
const router = express.Router();
const Halaqah = require('../models/Halaqah');
const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const { analyzeWithGemini, chatWithGemini } = require('../services/geminiService');
const { protect, authorize } = require('../middleware/auth');

// In-memory cache to prevent accidental double-spending of Gemini quota within 10 minutes
const analysisCache = new Map();

// @route   POST /api/ai/analyze-halaqah
// @desc    On-demand AI analysis for a specific halaqah (Admin only)
// @access  Private (Admin only)
router.post('/analyze-halaqah', protect, authorize('admin'), async (req, res) => {
  try {
    const { halaqahId, forceRefresh } = req.body;
    if (!halaqahId) {
      return res.status(400).json({ message: 'معرف الحلقة مطلوب' });
    }

    const cacheKey = `halaqah_${halaqahId}`;
    if (!forceRefresh && analysisCache.has(cacheKey)) {
      const cached = analysisCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return res.json({ ...cached.data, fromCache: true });
      }
    }

    const halaqah = await Halaqah.findById(halaqahId)
      .populate('teacher', 'fullName phone')
      .populate('supervisor', 'fullName phone');

    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    const [students, latestReport, latestEval] = await Promise.all([
      Student.find({ halaqah: halaqahId, status: 'active' }).select('fullName memorizedParts housingType'),
      MonthlyReport.findOne({ halaqah: halaqahId }).sort({ monthYear: -1 }),
      SupervisorEvaluation.findOne({ halaqah: halaqahId }).sort({ visitDate: -1 })
    ]);

    const promptData = {
      نوع_التقرير: 'تحليل أداء حلقة تحفيظ قرآنية محددة',
      اسم_الحلقة: halaqah.name,
      المسجد_والموقع: `${halaqah.mosque} - ${halaqah.location}`,
      المعلم: halaqah.teacher?.fullName || 'غير محدد',
      المشرف: halaqah.supervisor?.fullName || 'غير محدد',
      عدد_الطلاب: students.length,
      إجمالي_الأجزاء_المحفوظة_للطلاب: students.reduce((acc, s) => acc + (s.memorizedParts || 0), 0),
      عينات_مستويات_الطلاب: students.slice(0, 10).map(s => ({
        الاسم: s.fullName,
        الأجزاء_المحفوظة: s.memorizedParts
      })),
      آخر_تقرير_شهري_للمعلم: latestReport ? {
        الشهر: latestReport.monthYear,
        ملاحظات_عامة: latestReport.generalNotes,
        عدد_الطلاب_المسجلين: latestReport.studentEntries?.length
      } : 'لا يوجد تقرير شهري مسجل بعد',
      آخر_تقييم_ميداني_للمشرف: latestEval ? {
        درجة_التقييم_من_100: latestEval.totalScore,
        التقييم_الإداري_من_34: latestEval.adminTotal,
        التقييم_العلمي_من_33: latestEval.scientificTotal,
        التقييم_المهني_من_33: latestEval.professionalTotal,
        الإيجابيات: latestEval.positives,
        السلبيات_ونقاط_القصور: latestEval.negatives,
        توصيات_المشرف: latestEval.recommendations
      } : 'لا يوجد تقييم مشرف مسجل بعد'
    };

    const aiResult = await analyzeWithGemini(promptData);

    analysisCache.set(cacheKey, {
      timestamp: Date.now(),
      data: aiResult
    });

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء استدعاء الذكاء الاصطناعي', error: error.message });
  }
});

// @route   POST /api/ai/chat
// @desc    Interactive AI Chat with full database live context for Admin
// @access  Private (Admin only)
router.post('/chat', protect, authorize('admin'), async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'الرسالة مطلوبة' });
    }

    // 1. Build comprehensive live database context in parallel
    const [
      totalHalaqat,
      totalStudents,
      supervisorsList,
      halaqatDocs,
      studentCountsByHalaqah,
      topStudents,
      partsDistribution,
      recentReports,
      evalsDocs
    ] = await Promise.all([
      Halaqah.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Halaqah.distinct('supervisor'),
      Halaqah.find()
        .populate('teacher', 'fullName phone')
        .populate('supervisor', 'fullName phone')
        .sort({ name: 1 })
        .lean(),
      Student.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$halaqah', count: { $sum: 1 } } }
      ]),
      // Top 20 memorizers across all halaqat
      Student.find({ status: 'active' })
        .sort({ memorizedParts: -1, fullName: 1 })
        .limit(20)
        .populate('halaqah', 'name')
        .select('fullName memorizedParts halaqah code')
        .lean(),
      // Distribution of memorized parts
      Student.aggregate([
        { $match: { status: 'active' } },
        {
          $bucket: {
            groupBy: '$memorizedParts',
            boundaries: [0, 1, 5, 10, 15, 20, 30, 31],
            default: 'غير محدد',
            output: { count: { $sum: 1 } }
          }
        }
      ]),
      // Recent monthly reports with rich entries
      MonthlyReport.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('halaqah', 'name')
        .populate('teacher', 'fullName')
        .lean(),
      // Recent supervisor evaluations
      SupervisorEvaluation.find()
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('halaqah', 'name')
        .populate('supervisor', 'fullName')
        .lean()
    ]);

    // Map student counts to halaqat
    const studentCountMap = new Map(studentCountsByHalaqah.map(c => [c._id.toString(), c.count]));

    const halaqatSummary = halaqatDocs.map(h => ({
      id: h._id,
      name: h.name,
      mosque: h.mosque,
      location: h.location,
      teacher: h.teacher?.fullName || 'غير معين',
      teacherPhone: h.teacher?.phone || '',
      supervisor: h.supervisor?.fullName || 'غير معين',
      studentCount: studentCountMap.get(h._id.toString()) || 0,
      status: h.status || 'active'
    }));

    // 2. Dynamic Smart Search: Did the user ask about a specific halaqah, student, or teacher?
    let targetedContext = null;
    const cleanMsg = message.trim();

    // Check if any halaqah name is mentioned in the user message
    const matchedHalaqah = halaqatDocs.find(h => cleanMsg.includes(h.name) || cleanMsg.includes(h.name.replace('حلقة ', '')));
    if (matchedHalaqah) {
      const [hStudents, hReport, hEval] = await Promise.all([
        Student.find({ halaqah: matchedHalaqah._id, status: 'active' })
          .sort({ memorizedParts: -1, fullName: 1 })
          .select('fullName code memorizedParts gender notes')
          .lean(),
        MonthlyReport.findOne({ halaqah: matchedHalaqah._id }).sort({ monthYear: -1 }).lean(),
        SupervisorEvaluation.findOne({ halaqah: matchedHalaqah._id }).sort({ createdAt: -1 }).lean()
      ]);

      targetedContext = {
        نوع_البيانات_المستهدفة: `بيانات تفصيلية خاصة بالحلقة: ${matchedHalaqah.name}`,
        المسجد: matchedHalaqah.mosque,
        المعلم: matchedHalaqah.teacher?.fullName,
        هاتف_المعلم: matchedHalaqah.teacher?.phone,
        المشرف: matchedHalaqah.supervisor?.fullName,
        إجمالي_الطلاب: hStudents.length,
        قائمة_طلاب_الحلقة_كاملة_مع_أجزاء_الحفظ: hStudents.map(s => ({
          الاسم: s.fullName,
          الكود: s.code,
          الأجزاء_المحفوظة: s.memorizedParts || 0
        })),
        آخر_تقرير_شهري_للحلقة: hReport ? {
          الشهر: hReport.monthYear,
          ملاحظات_المعلم: hReport.generalNotes,
          عينات_تقييمات_الطلاب: hReport.studentEntries?.slice(0, 10).map(e => ({
            الطالب: e.studentName,
            المجموع: e.totalScore,
            التقدير: e.finalRating,
            الأجزاء_الحالية: e.currentMemorizedParts
          }))
        } : 'لا يوجد تقرير شهري مسجل بعد',
        آخر_تقييم_ميداني_للمشرف: hEval ? {
          الدرجة_الكلية: `${hEval.totalScore}/100`,
          الإداري: `${hEval.adminTotal}/34`,
          العلمي: `${hEval.scientificTotal}/33`,
          المهني: `${hEval.professionalTotal}/33`,
          الإيجابيات: hEval.positives,
          الملاحظات_والسلبيات: hEval.negatives,
          التوصيات: hEval.recommendations
        } : 'لا يوجد تقييم مشرف مسجل'
      };
    } else {
      // Check if user asked about a student name (search words in message)
      const words = cleanMsg.split(/\s+/).filter(w => w.length >= 3 && !['كم', 'من', 'ما', 'هل', 'أين', 'كيف', 'طالب', 'الطلاب', 'حلقة', 'تقرير', 'أداء'].includes(w));
      if (words.length > 0) {
        const regexPatterns = words.map(w => ({ fullName: { $regex: w, $options: 'i' } }));
        const matchedStudents = await Student.find({ $or: regexPatterns, status: 'active' })
          .populate('halaqah', 'name mosque')
          .limit(10)
          .lean();

        if (matchedStudents.length > 0) {
          targetedContext = {
            نوع_البيانات_المستهدفة: 'بيانات طلاب مطابقين لاسم البحث في الاستفسار',
            النتائج: matchedStudents.map(s => ({
              اسم_الطالب: s.fullName,
              الكود: s.code,
              الحلقة: s.halaqah?.name,
              المسجد: s.halaqah?.mosque,
              الأجزاء_المحفوظة: s.memorizedParts || 0
            }))
          };
        }
      }
    }

    const recentStats = {
      recentMonthlyReportsCount: recentReports.length,
      recentReportsSamples: recentReports.map(r => ({
        halaqah: r.halaqah?.name,
        monthYear: r.monthYear,
        teacher: r.teacher?.fullName,
        studentsCount: r.studentEntries?.length || 0,
        averageTotalScore: r.studentEntries?.length > 0
          ? Math.round(r.studentEntries.reduce((a, b) => a + (b.totalScore || 0), 0) / r.studentEntries.length)
          : 0
      })),
      recentEvaluationsSamples: evalsDocs.map(e => ({
        halaqah: e.halaqah?.name,
        supervisor: e.supervisor?.fullName,
        score: `${e.totalScore}/100`,
        positives: e.positives,
        negatives: e.negatives,
        recommendations: e.recommendations
      }))
    };

    const topMemorizersList = topStudents.map(s => ({
      الاسم: s.fullName,
      الأجزاء_المحفوظة: s.memorizedParts || 0,
      الحلقة: s.halaqah?.name || '—'
    }));

    const dbContext = {
      totalHalaqat,
      totalStudents,
      totalSupervisors: supervisorsList.length,
      halaqatSummary,
      topMemorizersList,
      partsDistribution,
      recentStats,
      targetedContext
    };

    const result = await chatWithGemini(message, conversationHistory, dbContext);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء محادثة المساعد الذكي', error: error.message });
  }
});

// @route   POST /api/ai/analyze-executive
// @desc    On-demand overall executive strategic analysis for the administration
// @access  Private (Admin only)
router.post('/analyze-executive', protect, authorize('admin'), async (req, res) => {
  try {
    const { forceRefresh } = req.body;
    const cacheKey = 'executive_overall';

    if (!forceRefresh && analysisCache.has(cacheKey)) {
      const cached = analysisCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return res.json({ ...cached.data, fromCache: true });
      }
    }

    const [totalHalaqat, totalStudents, evals, partsAgg] = await Promise.all([
      Halaqah.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      SupervisorEvaluation.find().sort({ createdAt: -1 }).limit(15).populate('halaqah', 'name'),
      Student.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$memorizedParts' } } }])
    ]);

    const supervisorFeedbackSamples = evals.map(e => ({
      الحلقة: e.halaqah?.name,
      الدرجة_الكلية: e.totalScore,
      الإيجابيات: e.positives,
      السلبيات_والملاحظات: e.negatives,
      التوصيات: e.recommendations
    }));

    const promptData = {
      نوع_التقرير: 'تقرير استراتيجي تنفيذي شامل لإدارة مشاريع حلقات القرآن الكريم',
      إجمالي_الحلقات: totalHalaqat,
      إجمالي_الطلاب_النشطين: totalStudents,
      إجمالي_الأجزاء_المحفوظة: partsAgg[0]?.total || 0,
      متوسط_درجات_تقييم_الحلقات: evals.length > 0 ? (evals.reduce((a, b) => a + (b.totalScore || 0), 0) / evals.length).toFixed(1) : 'لا توجد تقييمات كافية',
      عينات_ملاحظات_المشرفين_الميدانيين: supervisorFeedbackSamples
    };

    const aiResult = await analyzeWithGemini(promptData);

    analysisCache.set(cacheKey, {
      timestamp: Date.now(),
      data: aiResult
    });

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء استدعاء الذكاء الاصطناعي', error: error.message });
  }
});

module.exports = router;
