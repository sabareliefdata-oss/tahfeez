const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح: يجب تسجيل الدخول أولاً' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'المستخدم غير موجود أو تم تعطيل حسابه' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'جلسة العمل منتهية أو غير صالحة', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'ليس لديك الصلاحية الكافية للوصول إلى هذا الإجراء' });
    }
    next();
  };
};

module.exports = { protect, authorize };
