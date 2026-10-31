const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Halaqah = require('../models/Halaqah');
const MonthlyReport = require('../models/MonthlyReport');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/students
// @desc    Get all students with advanced filters and role permissions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, halaqahId, housingType, gender, status, minParts, maxParts, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Role-based restrictions
    if (req.user.role === 'teacher') {
      const teacherHalaqat = await Halaqah.find({
        $or: [{ teacher: req.user._id }, { _id: { $in: req.user.assignedHalaqat || [] } }]
      }).select('_id');
      const halaqahIds = teacherHalaqat.map(h => h._id);
      filter.halaqah = { $in: halaqahIds };
      filter.status = 'active'; // Teachers only see active students
    } else if (req.user.role === 'supervisor') {
      const supervisorHalaqat = await Halaqah.find({
        $or: [{ supervisor: req.user._id }, { _id: { $in: req.user.assignedHalaqat || [] } }]
      }).select('_id');
      const halaqahIds = supervisorHalaqat.map(h => h._id);
      filter.halaqah = { $in: halaqahIds };
      filter.status = 'active'; // Supervisors see active students by default
    }

    // Apply explicit halaqahId filter
    if (halaqahId) {
      filter.halaqah = halaqahId;
    }

    // Search by student name, code, guardian name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { code: searchRegex },
        { guardianName: searchRegex },
        { address: searchRegex }
      ];
    }

    if (housingType) filter.housingType = housingType;
    if (gender) filter.gender = gender;
    if (status) filter.status = status;

    if (minParts !== undefined || maxParts !== undefined) {
      filter.memorizedParts = {};
      if (minParts !== undefined && minParts !== '') filter.memorizedParts.$gte = Number(minParts);
      if (maxParts !== undefined && maxParts !== '') filter.memorizedParts.$lte = Number(maxParts);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('halaqah', 'name mosque location')
      .sort({ serialNumber: 1, fullName: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      students
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الطلاب', error: error.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'halaqah',
        populate: [
          { path: 'teacher', select: 'fullName phone' },
          { path: 'supervisor', select: 'fullName phone' }
        ]
      });

    if (!student) {
      return res.status(404).json({ message: 'بيانات الطالب غير موجودة' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الطالب', error: error.message });
  }
});

// @route   POST /api/students
// @desc    Add new student
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      fullName,
      code,
      halaqah,
      birthYear,
      gender,
      housingType,
      address,
      guardianName,
      guardianRelation,
      languages,
      hobbies,
      memorizedParts,
      notes
    } = req.body;

    if (!fullName || !halaqah) {
      return res.status(400).json({ message: 'اسم الطالب والحلقة مطلوبان' });
    }

    // Generate unique code if not provided
    let studentCode = code;
    if (!studentCode) {
      const count = await Student.countDocuments();
      studentCode = `HF${10000 + count + 1}`;
    }

    const newStudent = await Student.create({
      fullName: fullName.trim(),
      code: studentCode.trim(),
      halaqah,
      birthYear: birthYear || '',
      gender: gender || 'ذكر',
      housingType: housingType || 'إيجار',
      address: address || 'تعز',
      guardianName: guardianName || '',
      guardianRelation: guardianRelation || 'أب',
      languages: languages || 'العربية',
      hobbies: hobbies || '',
      memorizedParts: Number(memorizedParts) || 0,
      notes: notes || '',
      status: 'active'
    });

    res.status(201).json({ message: 'تمت إضافة الطالب بنجاح', student: newStudent });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة الطالب', error: error.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student details
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }

    const fields = [
      'fullName', 'code', 'birthYear', 'gender', 'housingType',
      'address', 'guardianName', 'guardianRelation', 'languages',
      'hobbies', 'memorizedParts', 'status', 'notes'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        student[f] = req.body[f];
      }
    });

    await student.save();
    res.json({ message: 'تم تحديث بيانات الطالب بنجاح', student });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث بيانات الطالب', error: error.message });
  }
});

// @route   PATCH /api/students/:id/toggle-status
// @desc    Toggle student status between active and inactive
// @access  Private (Admin only)
router.patch('/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }

    student.status = student.status === 'inactive' ? 'active' : 'inactive';
    await student.save();

    res.json({
      message: student.status === 'active' ? 'تم تفعيل الطالب بنجاح' : 'تم إيقاف الطالب بنجاح',
      student
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تغيير حالة الطالب', error: error.message });
  }
});

// @route   GET /api/students/:id/report-history
// @desc    Get detailed report and progress history for a student across months
// @access  Private
router.get('/:id/report-history', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'halaqah',
        populate: [
          { path: 'teacher', select: 'fullName phone' },
          { path: 'supervisor', select: 'fullName phone' }
        ]
      })
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }

    const halaqahId = student.halaqah?._id || student.halaqah;

    // Fetch all monthly reports where this student is entered or belongs to their halaqah
    const monthlyReports = await MonthlyReport.find({
      $or: [
        { 'studentEntries.student': student._id },
        { 'studentEntries.studentCode': student.code },
        { halaqah: halaqahId }
      ]
    }).sort({ monthYear: 1 }).lean();

    const history = [];

    for (const rep of monthlyReports) {
      if (!Array.isArray(rep.studentEntries)) continue;

      const matchedEntry = rep.studentEntries.find(e => {
        const eStudentId = (e.student?._id || e.student)?.toString();
        const targetId = student._id.toString();
        if (eStudentId && eStudentId === targetId) return true;
        if (student.code && e.studentCode && e.studentCode.trim().toUpperCase() === student.code.trim().toUpperCase()) return true;
        if (student.fullName && e.studentName && e.studentName.trim() === student.fullName.trim()) return true;
        return false;
      });

      if (matchedEntry) {
        const openParts = matchedEntry.openingMemorizedParts !== undefined 
          ? Number(matchedEntry.openingMemorizedParts) 
          : (student.openingMemorizedParts || 0);
        const currParts = matchedEntry.currentMemorizedParts !== undefined 
          ? Number(matchedEntry.currentMemorizedParts) 
          : (student.memorizedParts || openParts);
        const progress = matchedEntry.progressParts !== undefined 
          ? Number(matchedEntry.progressParts) 
          : Math.max(0, currParts - openParts);

        history.push({
          reportId: rep._id,
          monthYear: rep.monthYear,
          studentName: matchedEntry.studentName || student.fullName,
          studentCode: matchedEntry.studentCode || student.code,
          openingMemorizedParts: openParts,
          currentMemorizedParts: currParts,
          progressParts: progress,
          absenceExcused: matchedEntry.absenceExcused || 0,
          absenceUnexcused: matchedEntry.absenceUnexcused || 0,
          planMemorization: matchedEntry.planMemorization || {},
          actualMemorization: matchedEntry.actualMemorization || {},
          actualRevision: matchedEntry.actualRevision || {},
          scientificCurriculum: matchedEntry.scientificCurriculum || {},
          testScores: matchedEntry.testScores || {
            memorization: 45, recitation: 20, performance: 10, lessons: 10, attendance: 10, behavior: 5
          },
          totalScore: matchedEntry.totalScore || 100,
          finalRating: matchedEntry.finalRating || 'ممتاز',
          teacherNotes: matchedEntry.notes || ''
        });
      }
    }

    res.json({
      student,
      history
    });
  } catch (error) {
    console.error('Error in student report-history endpoint:', error);
    res.status(500).json({ message: 'خطأ في جلب السجل الأكاديمي للطالب', error: error.message });
  }
});

// @route   PUT /api/students/:id/transfer
// @desc    Transfer student to another halaqah
// @access  Private (Admin only)
router.put('/:id/transfer', protect, authorize('admin'), async (req, res) => {
  try {
    const { targetHalaqahId, reason } = req.body;
    if (!targetHalaqahId) {
      return res.status(400).json({ message: 'يرجى اختيار الحلقة المراد النقل إليها' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }

    const targetHalaqah = await Halaqah.findById(targetHalaqahId);
    if (!targetHalaqah) {
      return res.status(404).json({ message: 'الحلقة المستهدفة غير موجودة' });
    }

    const oldHalaqahId = student.halaqah;
    student.halaqah = targetHalaqah._id;
    student.notes = `${student.notes ? student.notes + ' | ' : ''}تم النقل في ${new Date().toLocaleDateString('ar-EG')}${reason ? ' بسبب: ' + reason : ''}`;
    
    await student.save();

    res.json({
      message: `تم نقل الطالب ${student.fullName} بنجاح إلى حلقة ${targetHalaqah.name}`,
      student
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء نقل الطالب', error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الطالب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الطالب', error: error.message });
  }
});

module.exports = router;
