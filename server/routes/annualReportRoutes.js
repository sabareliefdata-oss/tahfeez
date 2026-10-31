const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const AnnualStudentReport = require('../models/AnnualStudentReport');
const Halaqah = require('../models/Halaqah');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/annual-reports/halaqah/:halaqahId/year/:year
// @desc    Get annual report rows for a halaqah and year, pre-populating with student base info
// @access  Private
router.get('/halaqah/:halaqahId/year/:year', protect, async (req, res) => {
  try {
    const { halaqahId, year } = req.params;

    const halaqah = await Halaqah.findById(halaqahId)
      .populate('teacher', 'fullName phone')
      .populate('supervisor', 'fullName phone');

    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    const students = await Student.find({ halaqah: halaqahId, status: 'active' })
      .sort({ serialNumber: 1, fullName: 1 });

    // Fetch existing annual reports for this halaqah and year
    const existingReports = await AnnualStudentReport.find({
      halaqah: halaqahId,
      year
    });

    const reportMap = new Map();
    existingReports.forEach(r => {
      reportMap.set(r.student.toString(), r);
    });

    // Merge student base data with report data
    const rows = students.map((s, index) => {
      const existing = reportMap.get(s._id.toString());
      return {
        serial: index + 1,
        studentId: s._id,
        fullName: s.fullName,
        code: s.code,
        halaqahName: halaqah.name,
        teacherName: halaqah.teacher?.fullName || '',
        birthYear: s.birthYear,
        gender: s.gender,
        housingType: s.housingType,
        address: s.address,
        guardianName: s.guardianName,
        guardianRelation: s.guardianRelation,
        languages: s.languages,
        hobbies: s.hobbies,
        memorizedParts: existing?.memorizedParts !== undefined ? existing.memorizedParts : s.memorizedParts,
        attendanceRating: existing?.attendanceRating || 'ممتاز',
        participationRating: existing?.participationRating || 'ممتاز',
        tajweedRating: existing?.tajweedRating || 'ممتاز',
        curriculumRating: existing?.curriculumRating || 'ممتاز',
        overallRating: existing?.overallRating || 'ممتاز',
        studentMessage: existing?.studentMessage || '',
        teacherMessage: existing?.teacherMessage || '',
        projectImpact: existing?.projectImpact || '',
        videoUrl: existing?.videoUrl || '',
        reportId: existing?._id || null
      };
    });

    res.json({
      halaqah,
      year,
      rows
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات التقرير السنوي', error: error.message });
  }
});

// @route   POST /api/annual-reports/bulk-save
// @desc    Teacher saves/updates annual report rows for their halaqah
// @access  Private (Teacher only)
router.post('/bulk-save', protect, authorize('teacher'), async (req, res) => {
  try {
    const { halaqahId, year, rows } = req.body;
    if (!halaqahId || !year || !Array.isArray(rows)) {
      return res.status(400).json({ message: 'بيانات الحفظ غير مكتملة' });
    }

    const halaqah = await Halaqah.findById(halaqahId);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    for (const item of rows) {
      if (!item.studentId) continue;

      const reportData = {
        student: item.studentId,
        halaqah: halaqahId,
        teacher: halaqah.teacher || null,
        year,
        memorizedParts: Number(item.memorizedParts) || 0,
        attendanceRating: item.attendanceRating || 'ممتاز',
        participationRating: item.participationRating || 'ممتاز',
        tajweedRating: item.tajweedRating || 'ممتاز',
        curriculumRating: item.curriculumRating || 'ممتاز',
        overallRating: item.overallRating || 'ممتاز',
        studentMessage: item.studentMessage || '',
        teacherMessage: item.teacherMessage || '',
        projectImpact: item.projectImpact || '',
        videoUrl: item.videoUrl || ''
      };

      await AnnualStudentReport.findOneAndUpdate(
        { student: item.studentId, year },
        reportData,
        { upsert: true, new: true }
      );

      // Also update student's memorizedParts if changed
      if (item.memorizedParts !== undefined) {
        await Student.findByIdAndUpdate(item.studentId, {
          memorizedParts: Number(item.memorizedParts) || 0
        });
      }
    }

    res.json({ message: 'تم حفظ التقرير السنوي للحلقة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حفظ التقرير السنوي', error: error.message });
  }
});

// @route   GET /api/annual-reports/export-excel/:halaqahId/:year
// @desc    Export annual report as Excel matching the template 1:1
// @access  Private
router.get('/export-excel/:halaqahId/:year', protect, async (req, res) => {
  try {
    const { halaqahId, year } = req.params;

    const halaqah = await Halaqah.findById(halaqahId)
      .populate('teacher', 'fullName phone');

    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    const students = await Student.find({ halaqah: halaqahId, status: 'active' })
      .sort({ serialNumber: 1, fullName: 1 });

    const existingReports = await AnnualStudentReport.find({ halaqah: halaqahId, year });
    const reportMap = new Map();
    existingReports.forEach(r => reportMap.set(r.student.toString(), r));

    // Headers exactly matching "قالب التقرير السنوي للحلقات.xlsx"
    const rows = [
      [
        'القسم الأول : بيانات الطالب الأساسية',
        '', '', '', '', '', '', '', '', '', '', '', '',
        'القسم الثاني عدد الأجزاء : اكتبها بالأرقام و التقييم ( اكتب : ممتاز - جيد جدا جيد - مقبول - ضعيف)',
        '', '', '', '', '',
        'القسم الثالث رسائل المدرس والطالب',
        '', '', ''
      ],
      [
        'م',
        'اسم الطالب',
        'الكود بالموقع',
        'اسم الحلقة',
        'اسم المدرس',
        'تاريخ الميلاد',
        'الجنس',
        'نوع السكن( ايجار)',
        'العنوان ابتداء من المحافظة',
        'اسم ولي الامر',
        'علاقة ولي الامر بالطالب',
        'اللغات',
        'الهوايات',
        'عدد الأجزاء التي يحفظها',
        'الحضور',
        'المشاركة',
        'التجويد',
        'المنهج',
        'الإجمالي',
        'رسالة الطالب التي في الورقة اليدوية تكتب كما هي',
        'رسالة المدرس عن الطالب',
        'كيف ساعد المشروع  الطالب (بشقيه التعليمي والمالي)',
        'رابط الفيديو'
      ]
    ];

    students.forEach((s, idx) => {
      const rep = reportMap.get(s._id.toString());
      rows.push([
        idx + 1,
        s.fullName || '',
        s.code || '',
        halaqah.name || '',
        halaqah.teacher?.fullName || '',
        s.birthYear || '',
        s.gender || 'ذكر',
        s.housingType || 'إيجار',
        s.address || 'تعز',
        s.guardianName || '',
        s.guardianRelation || 'أب',
        s.languages || 'العربية',
        s.hobbies || '',
        rep?.memorizedParts !== undefined ? rep.memorizedParts : (s.memorizedParts || 0),
        rep?.attendanceRating || 'ممتاز',
        rep?.participationRating || 'ممتاز',
        rep?.tajweedRating || 'ممتاز',
        rep?.curriculumRating || 'ممتاز',
        rep?.overallRating || 'ممتاز',
        rep?.studentMessage || '',
        rep?.teacherMessage || '',
        rep?.projectImpact || '',
        rep?.videoUrl || ''
      ]);
    });

    const ws = xlsx.utils.aoa_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'التقرير السنوي');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const safeHalaqahName = encodeURIComponent(halaqah.name || 'halaqah');
    res.setHeader('Content-Disposition', `attachment; filename="annual_report_${safeHalaqahName}_${year}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير التقرير السنوي', error: error.message });
  }
});

module.exports = router;
