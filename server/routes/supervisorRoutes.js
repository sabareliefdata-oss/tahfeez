const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Supervisor = require('../models/Supervisor');
const User = require('../models/User');
const Halaqah = require('../models/Halaqah');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/supervisors
// @desc    Get all supervisors
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const supervisors = await Supervisor.find()
      .populate('user', 'username fullName phone isActive')
      .populate('assignedHalaqat', 'name mosque location');

    res.json(supervisors);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المشرفين', error: error.message });
  }
});

// @route   POST /api/supervisors
// @desc    Add new supervisor
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, username, password, phone, sector, assignedHalaqat, notes } = req.body;

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
      role: 'supervisor',
      password: hashedPassword,
      assignedHalaqat: assignedHalaqat || [],
      notes: notes || ''
    });

    const supervisorDoc = await Supervisor.create({
      user: userDoc._id,
      fullName: fullName.trim(),
      phone: phone || '',
      sector: sector || 'القطاع الميداني',
      assignedHalaqat: assignedHalaqat || [],
      notes: notes || '',
      status: 'active'
    });

    // Update supervisor link in Halaqat
    if (assignedHalaqat && assignedHalaqat.length > 0) {
      await Halaqah.updateMany(
        { _id: { $in: assignedHalaqat } },
        { supervisor: userDoc._id }
      );
    }

    res.status(201).json({ message: 'تمت إضافة المشرف بنجاح', supervisor: supervisorDoc });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة المشرف', error: error.message });
  }
});

// @route   PUT /api/supervisors/:id
// @desc    Update supervisor and assign group of halaqat
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, phone, sector, assignedHalaqat, password, status, notes } = req.body;

    const supervisorDoc = await Supervisor.findById(req.params.id);
    if (!supervisorDoc) {
      return res.status(404).json({ message: 'المشرف غير موجود' });
    }

    const userDoc = await User.findById(supervisorDoc.user);

    if (fullName) {
      supervisorDoc.fullName = fullName.trim();
      if (userDoc) userDoc.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      supervisorDoc.phone = phone;
      if (userDoc) userDoc.phone = phone;
    }
    if (sector !== undefined) supervisorDoc.sector = sector;
    if (notes !== undefined) supervisorDoc.notes = notes;
    if (status !== undefined) {
      supervisorDoc.status = status;
      if (userDoc) userDoc.isActive = status === 'active';
    }

    if (password && password.trim().length > 0 && userDoc) {
      userDoc.password = await bcrypt.hash(password, 10);
    }

    if (assignedHalaqat !== undefined) {
      // Unassign halaqat previously assigned to this supervisor
      await Halaqah.updateMany(
        { supervisor: userDoc._id },
        { supervisor: null }
      );

      // Assign new halaqat
      await Halaqah.updateMany(
        { _id: { $in: assignedHalaqat } },
        { supervisor: userDoc._id }
      );

      supervisorDoc.assignedHalaqat = assignedHalaqat;
      if (userDoc) userDoc.assignedHalaqat = assignedHalaqat;
    }

    await supervisorDoc.save();
    if (userDoc) await userDoc.save();

    res.json({ message: 'تم تحديث بيانات المشرف وتوزيع الحلقات بنجاح', supervisor: supervisorDoc });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المشرف', error: error.message });
  }
});

// @route   DELETE /api/supervisors/:id
// @desc    Delete supervisor
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const supervisorDoc = await Supervisor.findById(req.params.id);
    if (!supervisorDoc) {
      return res.status(404).json({ message: 'المشرف غير موجود' });
    }

    await Halaqah.updateMany(
      { supervisor: supervisorDoc.user },
      { supervisor: null }
    );

    if (supervisorDoc.user) {
      await User.findByIdAndDelete(supervisorDoc.user);
    }

    await Supervisor.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف المشرف بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المشرف', error: error.message });
  }
});

module.exports = router;
