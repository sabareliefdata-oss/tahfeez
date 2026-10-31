const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Halaqah = require('../models/Halaqah');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/teachers
// @desc    Get all teachers with profile details, assigned halaqah, and user account info
// @access  Private (Admin or Supervisor)
router.get('/', protect, async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'username fullName phone role isActive')
      .populate('halaqah', 'name mosque location')
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المعلمين', error: error.message });
  }
});

// @route   POST /api/teachers
// @desc    Admin adds a new teacher (creates User account + Teacher profile + assigns Halaqah)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, username, password, phone, qualification, experienceYears, halaqahId, city, notes } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ message: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'اسم المستخدم مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = await User.create({
      fullName: fullName.trim(),
      username: username.toLowerCase().trim(),
      phone: phone || '',
      role: 'teacher',
      password: hashedPassword,
      assignedHalaqat: halaqahId ? [halaqahId] : [],
      notes: notes || ''
    });

    const teacherDoc = await Teacher.create({
      user: userDoc._id,
      fullName: fullName.trim(),
      phone: phone || '',
      qualification: qualification || 'إجازة في القرآن الكريم بالسند المتصل',
      experienceYears: Number(experienceYears) || 1,
      halaqah: halaqahId || null,
      city: city || 'تعز',
      notes: notes || '',
      status: 'active'
    });

    if (halaqahId) {
      await Halaqah.findByIdAndUpdate(halaqahId, { teacher: userDoc._id });
    }

    res.status(201).json({
      message: 'تمت إضافة المعلم بنجاح',
      teacher: teacherDoc
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة المعلم', error: error.message });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Admin updates teacher (and re-assigns halaqah or resets password)
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, phone, qualification, experienceYears, halaqahId, city, status, password, notes } = req.body;
    
    const teacherDoc = await Teacher.findById(req.params.id);
    if (!teacherDoc) {
      return res.status(404).json({ message: 'المعلم غير موجود' });
    }

    const userDoc = await User.findById(teacherDoc.user);

    if (fullName) {
      teacherDoc.fullName = fullName.trim();
      if (userDoc) userDoc.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      teacherDoc.phone = phone;
      if (userDoc) userDoc.phone = phone;
    }
    if (qualification !== undefined) teacherDoc.qualification = qualification;
    if (experienceYears !== undefined) teacherDoc.experienceYears = Number(experienceYears) || 0;
    if (city !== undefined) teacherDoc.city = city;
    if (status !== undefined) {
      teacherDoc.status = status;
      if (userDoc) userDoc.isActive = status === 'active';
    }
    if (notes !== undefined) teacherDoc.notes = notes;

    // Password reset if provided
    if (password && password.trim().length > 0 && userDoc) {
      userDoc.password = await bcrypt.hash(password, 10);
    }

    // Handle halaqah re-assignment
    if (halaqahId !== undefined && halaqahId !== (teacherDoc.halaqah ? teacherDoc.halaqah.toString() : null)) {
      // Remove old halaqah's teacher link
      if (teacherDoc.halaqah) {
        await Halaqah.findByIdAndUpdate(teacherDoc.halaqah, { teacher: null });
      }

      teacherDoc.halaqah = halaqahId || null;

      if (userDoc) {
        userDoc.assignedHalaqat = halaqahId ? [halaqahId] : [];
      }

      if (halaqahId) {
        await Halaqah.findByIdAndUpdate(halaqahId, { teacher: userDoc ? userDoc._id : null });
      }
    }

    await teacherDoc.save();
    if (userDoc) await userDoc.save();

    res.json({ message: 'تم تحديث بيانات المعلم بنجاح', teacher: teacherDoc });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث بيانات المعلم', error: error.message });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Admin deletes teacher
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const teacherDoc = await Teacher.findById(req.params.id);
    if (!teacherDoc) {
      return res.status(404).json({ message: 'المعلم غير موجود' });
    }

    if (teacherDoc.halaqah) {
      await Halaqah.findByIdAndUpdate(teacherDoc.halaqah, { teacher: null });
    }

    if (teacherDoc.user) {
      await User.findByIdAndDelete(teacherDoc.user);
    }

    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف المعلم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المعلم', error: error.message });
  }
});

module.exports = router;
