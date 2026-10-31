const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  serialNumber: {
    type: Number
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    index: true
  },
  halaqah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah',
    required: true
  },
  birthYear: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: 'ذكر'
  },
  housingType: {
    type: String,
    default: 'إيجار'
  },
  address: {
    type: String,
    default: ''
  },
  guardianName: {
    type: String,
    default: ''
  },
  guardianRelation: {
    type: String,
    default: 'أب'
  },
  languages: {
    type: String,
    default: 'العربية'
  },
  hobbies: {
    type: String,
    default: ''
  },
  openingMemorizedParts: {
    type: Number,
    default: 0
  },
  memorizedParts: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred'],
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

// Fast query indexes to speed up filtering and avoid collection scans
studentSchema.index({ halaqah: 1, status: 1 });
studentSchema.index({ fullName: 1 });
studentSchema.index({ memorizedParts: -1 });

module.exports = mongoose.model('Student', studentSchema);
