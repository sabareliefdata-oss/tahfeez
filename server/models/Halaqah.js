const mongoose = require('mongoose');

const halaqahSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mosque: {
    type: String,
    trim: true,
    default: 'المسجد التابع للحلقة'
  },
  location: {
    type: String,
    trim: true,
    default: 'تعز'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timeSlot: {
    type: String,
    default: 'بعد صلاة العصر'
  },
  targetCapacity: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Fast query indexes
halaqahSchema.index({ supervisor: 1, status: 1 });
halaqahSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model('Halaqah', halaqahSchema);
