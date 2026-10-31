const express = require('express');
const router = express.Router();
const Halaqah = require('../models/Halaqah');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/halaqat
// @desc    Get halaqat accessible to user (Admin sees all, Supervisor sees theirs, Teacher sees theirs)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'supervisor') {
      filter = {
        status: { $ne: 'inactive' },
        $or: [
          { supervisor: req.user._id },
          { _id: { $in: req.user.assignedHalaqat || [] } }
        ]
      };
    } else if (req.user.role === 'teacher') {
      filter = {
        status: { $ne: 'inactive' },
        $or: [
          { teacher: req.user._id },
          { _id: { $in: req.user.assignedHalaqat || [] } }
        ]
      };
    }

    const halaqat = await Halaqah.find(filter)
      .populate('teacher', 'fullName phone username')
      .populate('supervisor', 'fullName phone username')
      .sort({ name: 1 })
      .lean();

    // Attach student count for each halaqah using a single fast aggregation
    const halaqahIds = halaqat.map(h => h._id);
    const counts = await Student.aggregate([
      { $match: { halaqah: { $in: halaqahIds }, status: 'active' } },
      { $group: { _id: '$halaqah', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));

    const halaqatWithCounts = halaqat.map(h => ({
      ...h,
      studentCount: countMap.get(h._id.toString()) || 0
    }));

    res.json(halaqatWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الحلقات', error: error.message });
  }
});

// @route   GET /api/halaqat/:id
// @desc    Get single halaqah details with student list
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const halaqah = await Halaqah.findById(req.params.id)
      .populate('teacher', 'fullName phone username')
      .populate('supervisor', 'fullName phone username');

    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    // Role security check
    if (req.user.role === 'teacher' && halaqah.teacher && halaqah.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح بالوصول إلى هذه الحلقة' });
    }
    if (req.user.role === 'supervisor' && halaqah.supervisor && halaqah.supervisor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح بالوصول إلى هذه الحلقة' });
    }

    const students = await Student.find({ halaqah: halaqah._id }).sort({ serialNumber: 1, fullName: 1 });

    res.json({
      halaqah,
      students
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الحلقة', error: error.message });
  }
});

// @route   POST /api/halaqat
// @desc    Create new halaqah
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, mosque, location, teacher, supervisor, timeSlot, targetCapacity, notes } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'اسم الحلقة مطلوب' });
    }

    const newHalaqah = await Halaqah.create({
      name,
      mosque: mosque || `مسجد ${name}`,
      location: location || 'تعز',
      teacher: teacher || null,
      supervisor: supervisor || null,
      timeSlot: timeSlot || 'بعد صلاة العصر',
      targetCapacity: targetCapacity || 20,
      notes: notes || ''
    });

    // Update teacher assignedHalaqat
    if (teacher) {
      await User.findByIdAndUpdate(teacher, { $addToSet: { assignedHalaqat: newHalaqah._id } });
    }
    // Update supervisor assignedHalaqat
    if (supervisor) {
      await User.findByIdAndUpdate(supervisor, { $addToSet: { assignedHalaqat: newHalaqah._id } });
    }

    res.status(201).json({ message: 'تم إنشاء الحلقة بنجاح', halaqah: newHalaqah });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء الحلقة', error: error.message });
  }
});

// @route   PUT /api/halaqat/:id
// @desc    Update halaqah
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, mosque, location, teacher, supervisor, timeSlot, targetCapacity, status, notes } = req.body;
    const halaqah = await Halaqah.findById(req.params.id);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    if (name) halaqah.name = name;
    if (mosque) halaqah.mosque = mosque;
    if (location) halaqah.location = location;
    if (timeSlot) halaqah.timeSlot = timeSlot;
    if (targetCapacity) halaqah.targetCapacity = targetCapacity;
    if (status) halaqah.status = status;
    if (notes !== undefined) halaqah.notes = notes;

    // Handle teacher reassignment
    if (teacher !== undefined && teacher !== (halaqah.teacher ? halaqah.teacher.toString() : null)) {
      if (halaqah.teacher) {
        await User.findByIdAndUpdate(halaqah.teacher, { $pull: { assignedHalaqat: halaqah._id } });
      }
      halaqah.teacher = teacher || null;
      if (teacher) {
        await User.findByIdAndUpdate(teacher, { $addToSet: { assignedHalaqat: halaqah._id } });
      }
    }

    // Handle supervisor reassignment
    if (supervisor !== undefined && supervisor !== (halaqah.supervisor ? halaqah.supervisor.toString() : null)) {
      if (halaqah.supervisor) {
        await User.findByIdAndUpdate(halaqah.supervisor, { $pull: { assignedHalaqat: halaqah._id } });
      }
      halaqah.supervisor = supervisor || null;
      if (supervisor) {
        await User.findByIdAndUpdate(supervisor, { $addToSet: { assignedHalaqat: halaqah._id } });
      }
    }

    await halaqah.save();
    res.json({ message: 'تم تحديث بيانات الحلقة بنجاح', halaqah });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الحلقة', error: error.message });
  }
});

// @route   PATCH /api/halaqat/:id/toggle-status
// @desc    Toggle halaqah status between active and inactive
// @access  Private (Admin only)
router.patch('/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const halaqah = await Halaqah.findById(req.params.id);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    halaqah.status = halaqah.status === 'inactive' ? 'active' : 'inactive';
    await halaqah.save();

    res.json({
      message: halaqah.status === 'active' ? 'تم تفعيل الحلقة بنجاح' : 'تم إيقاف الحلقة بنجاح',
      halaqah
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تغيير حالة الحلقة', error: error.message });
  }
});

// @route   DELETE /api/halaqat/:id
// @desc    Delete halaqah
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const halaqah = await Halaqah.findById(req.params.id);
    if (!halaqah) {
      return res.status(404).json({ message: 'الحلقة غير موجودة' });
    }

    // Check if students exist
    const studentCount = await Student.countDocuments({ halaqah: halaqah._id });
    if (studentCount > 0) {
      return res.status(400).json({
        message: `لا يمكن حذف الحلقة لأنها تحتوي على ${studentCount} طالب. يمكنك نقل الطلاب أولاً أو أرشفة الحلقة.`
      });
    }

    await Halaqah.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الحلقة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الحلقة', error: error.message });
  }
});

module.exports = router;
