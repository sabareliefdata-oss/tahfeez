const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() })
      .populate('assignedHalaqat', 'name mosque location');

    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'تم إيقاف هذا الحساب. يرجى التواصل مع الإدارة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        phone: user.phone,
        assignedHalaqat: user.assignedHalaqat
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('assignedHalaqat', 'name mosque location');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (filter by role)
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .populate('assignedHalaqat', 'name mosque')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب قائمة المستخدمين', error: error.message });
  }
});

// @route   POST /api/auth/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, username, phone, role, password, assignedHalaqat, notes } = req.body;
    
    if (!fullName || !username || !password) {
      return res.status(400).json({ message: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'اسم المستخدم مستخدم مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      username: username.toLowerCase().trim(),
      phone,
      role: role || 'teacher',
      password: hashedPassword,
      assignedHalaqat: assignedHalaqat || [],
      notes: notes || ''
    });

    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء المستخدم', error: error.message });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, phone, role, password, assignedHalaqat, isActive, notes } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (assignedHalaqat) user.assignedHalaqat = assignedHalaqat;
    if (notes !== undefined) user.notes = notes;

    if (password && password.trim().length > 0) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'تم تحديث بيانات المستخدم بنجاح', user });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المستخدم', error: error.message });
  }
});

module.exports = router;
