const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
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
  sector: {
    type: String,
    default: 'القطاع الميداني'
  },
  assignedHalaqat: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah'
  }],
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

module.exports = mongoose.model('Supervisor', supervisorSchema);
