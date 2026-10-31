const mongoose = require('mongoose');

const annualStudentReportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  halaqah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  year: {
    type: String,
    required: true,
    default: '2026'
  },

  // القسم الثاني : عدد الأجزاء والتقييمات
  memorizedParts: {
    type: Number,
    default: 0
  },
  attendanceRating: {
    type: String,
    enum: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    default: 'ممتاز'
  },
  participationRating: {
    type: String,
    enum: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    default: 'ممتاز'
  },
  tajweedRating: {
    type: String,
    enum: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    default: 'ممتاز'
  },
  curriculumRating: {
    type: String,
    enum: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    default: 'ممتاز'
  },
  overallRating: {
    type: String,
    enum: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    default: 'ممتاز'
  },

  // القسم الثالث : رسائل المدرس والطالب والأثر
  studentMessage: {
    type: String,
    default: ''
  },
  teacherMessage: {
    type: String,
    default: ''
  },
  projectImpact: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

annualStudentReportSchema.index({ student: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('AnnualStudentReport', annualStudentReportSchema);
