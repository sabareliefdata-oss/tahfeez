const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const Halaqah = require('../models/Halaqah');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/supervisor-evaluations
// @desc    Get supervisor evaluations list
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { halaqahId, monthYear, supervisorId } = req.query;
    const filter = {};

    if (req.user.role === 'supervisor') {
      filter.supervisor = req.user._id;
    } else if (req.user.role === 'teacher') {
      const teacherHalaqat = await Halaqah.find({
        $or: [{ teacher: req.user._id }, { _id: { $in: req.user.assignedHalaqat || [] } }]
      }).select('_id');
      filter.halaqah = { $in: teacherHalaqat.map(h => h._id) };
    }

    if (halaqahId) filter.halaqah = halaqahId;
    if (monthYear) filter.monthYear = monthYear;
    if (supervisorId && req.user.role === 'admin') filter.supervisor = supervisorId;

    const evaluations = await SupervisorEvaluation.find(filter)
      .populate('halaqah', 'name mosque location')
      .populate('supervisor', 'fullName phone')
      .populate('teacher', 'fullName phone')
      .sort({ visitDate: -1, createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب تقييمات المشرفين', error: error.message });
  }
});

// @route   GET /api/supervisor-evaluations/:id
// @desc    Get single evaluation details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const evaluation = await SupervisorEvaluation.findById(req.params.id)
      .populate('halaqah', 'name mosque location')
      .populate('supervisor', 'fullName phone')
      .populate('teacher', 'fullName phone');

    if (!evaluation) {
      return res.status(404).json({ message: 'التقييم غير موجود' });
    }

    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب تفاصيل التقييم', error: error.message });
  }
});

// @route   POST /api/supervisor-evaluations
// @desc    Supervisor records 100-point visit evaluation (Supervisors only)
// @access  Private (Supervisor only)
router.post('/', protect, authorize('supervisor'), async (req, res) => {
  try {
    const {
      halaqahId,
      monthYear,
      visitDate,
      adminScores = {},
      scientificScores = {},
      professionalScores = {},
      positives,
      negatives,
      recommendations,
      supervisorSignature
    } = req.body;

    if (!halaqahId || !monthYear) {
      return res.status(400).json({ message: 'الحلقة والشهر مطلوبان' });
    }

    const halaqah = await Halaqah.findById(halaqahId);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    // Calculate section totals
    const adminTotal = Object.values(adminScores).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const scientificTotal = Object.values(scientificScores).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const professionalTotal = Object.values(professionalScores).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const totalScore = adminTotal + scientificTotal + professionalTotal;

    const evaluationData = {
      halaqah: halaqahId,
      supervisor: req.user._id,
      teacher: halaqah.teacher || null,
      monthYear,
      visitDate: visitDate || new Date(),
      adminScores,
      adminTotal,
      scientificScores,
      scientificTotal,
      professionalScores,
      professionalTotal,
      totalScore,
      positives: positives || '',
      negatives: negatives || '',
      recommendations: recommendations || '',
      supervisorSignature: supervisorSignature || req.user.fullName
    };

    // Check if evaluation exists for this halaqah and month
    let evaluation = await SupervisorEvaluation.findOne({ halaqah: halaqahId, monthYear });
    if (evaluation) {
      Object.assign(evaluation, evaluationData);
      await evaluation.save();
    } else {
      evaluation = await SupervisorEvaluation.create(evaluationData);
    }

    res.status(201).json({ message: 'تم حفظ تقييم المشرف بنجاح', evaluation });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حفظ تقييم المشرف', error: error.message });
  }
});

// @route   GET /api/supervisor-evaluations/:id/export-excel
// @desc    Export evaluation matching supervisor template
// @access  Private
router.get('/:id/export-excel', protect, async (req, res) => {
  try {
    const evaluation = await SupervisorEvaluation.findById(req.params.id)
      .populate('halaqah', 'name mosque location')
      .populate('supervisor', 'fullName phone')
      .populate('teacher', 'fullName phone');

    if (!evaluation) {
      return res.status(404).json({ message: 'التقييم غير موجود' });
    }

    const rows = [
      [`تقرير متابعة وتقييم حلقة: ${evaluation.halaqah?.name || ''} - لشهر: ${evaluation.monthYear}`],
      [`المعلم: ${evaluation.teacher?.fullName || ''} | المشرف: ${evaluation.supervisor?.fullName || ''} | تاريخ الزيارة: ${evaluation.visitDate ? new Date(evaluation.visitDate).toLocaleDateString('ar-EG') : ''}`],
      [],
      ['القسم', 'م', 'عنصر التقييم', 'الدرجة العظمى', 'الدرجة الممنوحة'],
      ['التقييم الإداري', '1', 'الالتزام بدوام الحلقة (حضور - انصراف)', '5', evaluation.adminScores?.attendancePunctuality || 0],
      ['التقييم الإداري', '2', 'تفعيل سجل الحلقات يومياً', '6', evaluation.adminScores?.dailyRecordActivation || 0],
      ['التقييم الإداري', '3', 'ضبط الحلقة وحسن إدارتها', '6', evaluation.adminScores?.disciplineAndManagement || 0],
      ['التقييم الإداري', '4', 'انضباط الطلاب وعدم تسربهم من الحلقة', '6', evaluation.adminScores?.studentsRetention || 0],
      ['التقييم الإداري', '5', 'تجاوب المعلم مع التوجيهات الإدارية', '6', evaluation.adminScores?.teacherCompliance || 0],
      ['التقييم الإداري', '6', 'رفع التقارير والحوافظ في موعدها', '5', evaluation.adminScores?.timelyReporting || 0],
      ['إجمالي التقييم الإداري', '', '', '34', evaluation.adminTotal || 0],
      [],
      ['التقييم العلمي', '1', 'التمكن والإتقان في الحفظ والتلاوة', '6', evaluation.scientificScores?.recitationMastery || 0],
      ['التقييم العلمي', '2', 'الإلمام بالعلوم الشرعية', '5', evaluation.scientificScores?.shariaKnowledge || 0],
      ['التقييم العلمي', '3', 'الحرص على التطور المستمر', '5', evaluation.scientificScores?.continuousDevelopment || 0],
      ['التقييم العلمي', '4', 'المستوى العلمي لطلاب الحلقة', '5', evaluation.scientificScores?.studentsAcademicLevel || 0],
      ['التقييم العلمي', '5', 'الإلمام بالأحكام التجويدية وتطبيقها', '6', evaluation.scientificScores?.tajweedRulesApplication || 0],
      ['التقييم العلمي', '6', 'إنجاز خطة الحفظ والمراجعة', '6', evaluation.scientificScores?.planAchievement || 0],
      ['إجمالي التقييم العلمي', '', '', '33', evaluation.scientificTotal || 0],
      [],
      ['التقييم المهني', '1', 'استيفاء التسميع لمعظم الطلاب', '6', evaluation.professionalScores?.recitationCoverage || 0],
      ['التقييم المهني', '2', 'الاهتمام بالمراجعة اليومية', '6', evaluation.professionalScores?.dailyRevisionFocus || 0],
      ['التقييم المهني', '3', 'القراءة الفردية وتصحيح الأخطاء', '5', evaluation.professionalScores?.individualReading || 0],
      ['التقييم المهني', '4', 'اكتشاف الأخطاء وتصويبها', '5', evaluation.professionalScores?.errorCorrection || 0],
      ['التقييم المهني', '5', 'توضيح المعاني الغامضة للطلاب', '6', evaluation.professionalScores?.meaningClarification || 0],
      ['التقييم المهني', '6', 'حسن إدارة وقت الحلقة', '5', evaluation.professionalScores?.timeManagement || 0],
      ['إجمالي التقييم المهني', '', '', '33', evaluation.professionalTotal || 0],
      [],
      ['المجموع الكلي من 100', '', '', '100', evaluation.totalScore || 0],
      [],
      ['الإيجابيات:', evaluation.positives || ''],
      ['السلبيات:', evaluation.negatives || ''],
      ['التوصيات والمقترحات:', evaluation.recommendations || ''],
      ['اسم المشرف والتوقيع:', evaluation.supervisorSignature || evaluation.supervisor?.fullName || '']
    ];

    const ws = xlsx.utils.aoa_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'تقييم المشرف');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const safeHalaqahName = encodeURIComponent(evaluation.halaqah?.name || 'halaqah');
    res.setHeader('Content-Disposition', `attachment; filename="supervisor_evaluation_${safeHalaqahName}_${evaluation.monthYear}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير التقييم', error: error.message });
  }
});

module.exports = router;
