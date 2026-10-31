const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  qualification: {
    type: String,
    default: 'إجازة في القرآن الكريم بالسند المتصل'
  },
  experienceYears: {
    type: Number,
    default: 3
  },
  halaqah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah',
    default: null
  },
  city: {
    type: String,
    default: 'تعز'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
