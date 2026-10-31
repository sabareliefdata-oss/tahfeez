const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'teacher'],
    default: 'teacher'
  },
  password: {
    type: String,
    required: true
  },
  // If supervisor, halaqat they supervise. If teacher, halaqat they teach.
  assignedHalaqat: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah'
  }],
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
