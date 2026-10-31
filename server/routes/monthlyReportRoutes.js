const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const MonthlyReport = require('../models/MonthlyReport');
const Halaqah = require('../models/Halaqah');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// Helper to calculate rating from total score
function calculateRating(score) {
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جداً';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'ضعيف';
}

// @route   GET /api/monthly-reports
// @desc    Get monthly reports list (Teachers see theirs, Supervisors see theirs, Admin sees all)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { halaqahId, monthYear, teacherId } = req.query;
    const filter = {};

    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    } else if (req.user.role === 'supervisor') {
      const supervisorHalaqat = await Halaqah.find({
        $or: [{ supervisor: req.user._id }, { _id: { $in: req.user.assignedHalaqat || [] } }]
      }).select('_id').lean();
      filter.halaqah = { $in: supervisorHalaqat.map(h => h._id) };
    }

    if (halaqahId) filter.halaqah = halaqahId;
    if (monthYear) filter.monthYear = monthYear;
    if (teacherId && req.user.role === 'admin') filter.teacher = teacherId;

    const reports = await MonthlyReport.find(filter)
      .populate('halaqah', 'name mosque location')
      .populate('teacher', 'fullName phone')
      .sort({ monthYear: -1, createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب التقارير الشهرية', error: error.message });
  }
});

// @route   GET /api/monthly-reports/submission-status
// @desc    Get tracking of who submitted and who hasn't for a specific month
// @access  Private (Admin & Supervisor)
router.get('/submission-status', protect, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { monthYear = '2026-10' } = req.query;
    let halaqahFilter = {};

    if (req.user.role === 'supervisor') {
      halaqahFilter = {
        $or: [
          { supervisor: req.user._id },
          { _id: { $in: req.user.assignedHalaqat || [] } }
        ]
      };
    }

    const halaqat = await Halaqah.find(halaqahFilter)
      .populate('teacher', 'fullName phone username')
      .populate('supervisor', 'fullName phone username')
      .sort({ name: 1 })
      .lean();

    const submittedReports = await MonthlyReport.find({
      monthYear,
      halaqah: { $in: halaqat.map(h => h._id) }
    }).select('halaqah monthYear createdAt status').lean();

    const submittedHalaqahIds = new Set(submittedReports.map(r => r.halaqah.toString()));

    const submitted = [];
    const pending = [];

    halaqat.forEach(h => {
      const isSub = submittedHalaqahIds.has(h._id.toString());
      const item = {
        halaqahId: h._id,
        halaqahName: h.name,
        mosque: h.mosque,
        location: h.location,
        teacherName: h.teacher?.fullName || 'غير معين',
        teacherPhone: h.teacher?.phone || '',
        supervisorName: h.supervisor?.fullName || 'غير معين',
        supervisorPhone: h.supervisor?.phone || '',
        isSubmitted: isSub,
        monthYear
      };
      if (isSub) {
        submitted.push(item);
      } else {
        pending.push(item);
      }
    });

    res.json({
      monthYear,
      totalHalaqat: halaqat.length,
      submittedCount: submitted.length,
      pendingCount: pending.length,
      submittedRate: halaqat.length > 0 ? Math.round((submitted.length / halaqat.length) * 100) : 0,
      submitted,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب حالة رفع التقارير', error: error.message });
  }
});

// @route   GET /api/monthly-reports/init/:halaqahId/:monthYear
// @desc    Get or initialize a monthly report for a halaqah and month
// @access  Private
router.get('/init/:halaqahId/:monthYear', protect, async (req, res) => {
  try {
    const { halaqahId, monthYear } = req.params;

    // Fetch halaqah, report, and students in parallel for maximum speed
    const [halaqah, report, students] = await Promise.all([
      Halaqah.findById(halaqahId)
        .populate('teacher', 'fullName phone')
        .populate('supervisor', 'fullName phone')
        .lean(),
      MonthlyReport.findOne({ halaqah: halaqahId, monthYear })
        .populate('teacher', 'fullName phone')
        .lean(),
      Student.find({ halaqah: halaqahId, status: 'active' })
        .sort({ serialNumber: 1, fullName: 1 })
        .lean()
    ]);

    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    const existingMap = new Map();
    if (report && Array.isArray(report.studentEntries)) {
      report.studentEntries.forEach(entry => {
        const sId = (entry.student?._id || entry.student)?.toString();
        if (sId) existingMap.set(sId, entry);
      });
    }

    // Always guarantee that EVERY active student of the halaqah is included with accurate name & code
    const mergedStudentEntries = students.map((s, idx) => {
      const existing = existingMap.get(s._id.toString());
      const openParts = s.openingMemorizedParts !== undefined ? Number(s.openingMemorizedParts) : 0;

      if (existing) {
        const entryObj = existing.toObject ? existing.toObject() : existing;
        const currParts = entryObj.currentMemorizedParts !== undefined 
          ? Number(entryObj.currentMemorizedParts) 
          : (s.memorizedParts !== undefined ? Number(s.memorizedParts) : openParts);
        const progress = Math.max(0, currParts - openParts);

        return {
          ...entryObj,
          student: s._id,
          studentName: s.fullName,
          studentCode: s.code || entryObj.studentCode || `STU-${idx + 1}`,
          openingMemorizedParts: openParts,
          currentMemorizedParts: currParts,
          progressParts: progress
        };
      }

      const initialCurrParts = s.memorizedParts !== undefined ? Number(s.memorizedParts) : openParts;
      return {
        student: s._id,
        studentName: s.fullName,
        studentCode: s.code || `STU-${idx + 1}`,
        openingMemorizedParts: openParts,
        currentMemorizedParts: initialCurrParts,
        progressParts: Math.max(0, initialCurrParts - openParts),
        absenceExcused: 0,
        absenceUnexcused: 0,
        previousSurah: '',
        previousAyah: '',
        planMemorization: { expectedSurah: '', ayah: '', pagesCount: 0 },
        actualMemorization: { surah: '', ayah: '', pagesCount: 0 },
        actualRevision: { surah: '', pagesCount: 0 },
        scientificCurriculum: { plan: '', actual: '' },
        memorizationEvaluation: 'ممتاز',
        testScores: {
          memorization: 45,
          recitation: 20,
          performance: 10,
          lessons: 10,
          attendance: 10,
          behavior: 5
        },
        totalScore: 100,
        finalRating: 'ممتاز',
        notes: ''
      };
    });

    const reportObj = report ? (report.toObject ? report.toObject() : report) : null;
    if (reportObj) {
      reportObj.studentEntries = mergedStudentEntries;
    }

    return res.json({
      isNew: !report,
      report: reportObj,
      studentEntries: mergedStudentEntries,
      generalNotes: report?.generalNotes || '',
      halaqah
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تهيئة التقرير الشهري', error: error.message });
  }
});

// @route   POST /api/monthly-reports
// @desc    Teacher saves or submits their monthly report (Teachers only)
// @access  Private (Teacher only)
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { halaqahId, monthYear, studentEntries, generalNotes, status } = req.body;
    if (!halaqahId || !monthYear || !studentEntries) {
      return res.status(400).json({ message: 'بيانات التقرير غير مكتملة' });
    }

    const halaqah = await Halaqah.findById(halaqahId);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    // Lookup students to always guarantee fullName, code, and opening balance
    const studentIds = studentEntries.map(e => e.student).filter(Boolean);
    const studentsDb = await Student.find({ _id: { $in: studentIds } }).select('fullName code openingMemorizedParts memorizedParts').lean();
    const studentMap = new Map(studentsDb.map(s => [s._id.toString(), s]));

    // Ensure scores and finalRating are calculated accurately
    const formattedEntries = studentEntries.map(entry => {
      const sId = (entry.student?._id || entry.student)?.toString();
      const sDoc = studentMap.get(sId);
      const studentName = entry.studentName || sDoc?.fullName || 'طالب';
      const studentCode = entry.studentCode || sDoc?.code || '';
      
      const openParts = entry.openingMemorizedParts !== undefined 
        ? Number(entry.openingMemorizedParts) 
        : (sDoc?.openingMemorizedParts !== undefined ? Number(sDoc.openingMemorizedParts) : 0);
      const currParts = entry.currentMemorizedParts !== undefined 
        ? Number(entry.currentMemorizedParts) 
        : (sDoc?.memorizedParts !== undefined ? Number(sDoc.memorizedParts) : openParts);
      const progress = Math.max(0, currParts - openParts);

      const scores = entry.testScores || {};
      const total = (Number(scores.memorization) || 0) +
                    (Number(scores.recitation) || 0) +
                    (Number(scores.performance) || 0) +
                    (Number(scores.lessons) || 0) +
                    (Number(scores.attendance) || 0) +
                    (Number(scores.behavior) || 0);

      return {
        ...entry,
        student: sId,
        studentName,
        studentCode,
        openingMemorizedParts: openParts,
        currentMemorizedParts: currParts,
        progressParts: progress,
        totalScore: total,
        finalRating: entry.finalRating || calculateRating(total)
      };
    });

    let report = await MonthlyReport.findOne({ halaqah: halaqahId, monthYear });
    if (report) {
      report.studentEntries = formattedEntries;
      report.generalNotes = generalNotes || '';
      report.status = status || 'submitted';
      await report.save();
    } else {
      report = await MonthlyReport.create({
        halaqah: halaqahId,
        teacher: halaqah.teacher || req.user._id,
        monthYear,
        studentEntries: formattedEntries,
        generalNotes: generalNotes || '',
        status: status || 'submitted'
      });
    }

    // Automatically update student's memorizedParts in Student model in a SINGLE bulk write (ultra fast)
    const bulkOps = formattedEntries
      .filter(entry => entry.student && entry.currentMemorizedParts !== undefined)
      .map(entry => ({
        updateOne: {
          filter: { _id: entry.student },
          update: { $set: { memorizedParts: Number(entry.currentMemorizedParts) || 0 } }
        }
      }));

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    res.json({ message: 'تم حفظ التقرير الشهري وتحديث أجزاء الحفظ للطلاب بنجاح', report });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حفظ التقرير الشهري', error: error.message });
  }
});

// @route   GET /api/monthly-reports/:id/export-excel
// @desc    Export monthly report as Excel matching the template 1:1
// @access  Private
router.get('/:id/export-excel', protect, async (req, res) => {
  try {
    const report = await MonthlyReport.findById(req.params.id)
      .populate('halaqah', 'name mosque location')
      .populate('teacher', 'fullName phone');

    if (!report) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }

    // Build rows matching the official Excel template headers
    const rows = [
      [`تقرير الأداء لحلقة: ${report.halaqah?.name || ''} - شهر: ${report.monthYear} - المعلم: ${report.teacher?.fullName || ''}`],
      [],
      [
        'م',
        'الاســـــــم',
        'الكود بالموقع',
        'الرصيد الافتتاحي للأجزاء',
        'الأجزاء الحالية',
        'مقدار التقدم والإنجاز',
        'غياب بإذن',
        'غياب بغير إذن',
        'السورة السابقة',
        'رقم الآية',
        'خطة الحفظ (السورة المتوقعة)',
        'خطة الحفظ (آية)',
        'خطة الحفظ (عدد الصفحات)',
        'الحفظ المنفذ (سورة)',
        'الحفظ المنفذ (آية)',
        'الحفظ المنفذ (عدد الصفحات)',
        'المراجعة المنفذة (سورة)',
        'المراجعة المنفذة (عدد الصفحات)',
        'خطة المنهج العلمي (الخطة)',
        'خطة المنهج العلمي (المنفذ)',
        'تقييم خطة الحفظ',
        'الحفظ (45)',
        'التلاوة (20)',
        'الأداء (10)',
        'الدروس (10)',
        'الحضور (10)',
        'السلوك (5)',
        'المجموع (100)',
        'التقدير النهائي',
        'الملاحظات'
      ]
    ];

    (report.studentEntries || []).forEach((entry, idx) => {
      const openParts = entry.openingMemorizedParts !== undefined ? entry.openingMemorizedParts : 0;
      const currParts = entry.currentMemorizedParts !== undefined ? entry.currentMemorizedParts : openParts;
      const progress = entry.progressParts !== undefined ? entry.progressParts : Math.max(0, currParts - openParts);

      rows.push([
        idx + 1,
        entry.studentName || '',
        entry.studentCode || '',
        openParts,
        currParts,
        `+${progress} جزء`,
        entry.absenceExcused || 0,
        entry.absenceUnexcused || 0,
        entry.previousSurah || '',
        entry.previousAyah || '',
        entry.planMemorization?.expectedSurah || '',
        entry.planMemorization?.ayah || '',
        entry.planMemorization?.pagesCount || 0,
        entry.actualMemorization?.surah || '',
        entry.actualMemorization?.ayah || '',
        entry.actualMemorization?.pagesCount || 0,
        entry.actualRevision?.surah || '',
        entry.actualRevision?.pagesCount || 0,
        entry.scientificCurriculum?.plan || '',
        entry.scientificCurriculum?.actual || '',
        entry.memorizationEvaluation || 'ممتاز',
        entry.testScores?.memorization || 0,
        entry.testScores?.recitation || 0,
        entry.testScores?.performance || 0,
        entry.testScores?.lessons || 0,
        entry.testScores?.attendance || 0,
        entry.testScores?.behavior || 0,
        entry.totalScore || 0,
        entry.finalRating || calculateRating(entry.totalScore || 0),
        entry.notes || ''
      ]);
    });

    const ws = xlsx.utils.aoa_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'تقرير الحفظ والمراجعة');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const safeHalaqahName = encodeURIComponent(report.halaqah?.name || 'halaqah');
    res.setHeader('Content-Disposition', `attachment; filename="monthly_report_${safeHalaqahName}_${report.monthYear}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير ملف الإكسل', error: error.message });
  }
});

module.exports = router;
