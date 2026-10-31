const mongoose = require('mongoose');

const studentMonthlyEntrySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: String,
  studentCode: String,
  absenceExcused: { type: Number, default: 0 },
  absenceUnexcused: { type: Number, default: 0 },
  previousSurah: { type: String, default: '' },
  previousAyah: { type: String, default: '' },
  
  // خطة الحفظ
  planMemorization: {
    expectedSurah: { type: String, default: '' },
    ayah: { type: String, default: '' },
    pagesCount: { type: Number, default: 0 }
  },

  // الحفظ المنفذ
  actualMemorization: {
    surah: { type: String, default: '' },
    ayah: { type: String, default: '' },
    pagesCount: { type: Number, default: 0 }
  },

  // المراجعة المنفذة
  actualRevision: {
    surah: { type: String, default: '' },
    pagesCount: { type: Number, default: 0 }
  },

  // خطة المنهج العلمي
  scientificCurriculum: {
    plan: { type: String, default: '' },
    actual: { type: String, default: '' }
  },

  // تقييم خطة الحفظ
  memorizationEvaluation: { type: String, default: 'ممتاز' },

  // درجات الاختبارات الشهرية (مطابقة لملف الإكسل: الحفظ، التلاوة، الأداء، الدروس، الحضور، السلوك)
  testScores: {
    memorization: { type: Number, default: 0 }, // الحفظ
    recitation: { type: Number, default: 0 },   // التلاوة
    performance: { type: Number, default: 0 },  // الأداء
    lessons: { type: Number, default: 0 },      // الدروس
    attendance: { type: Number, default: 0 },    // الحضور
    behavior: { type: Number, default: 10 }     // السلوك (مضاف بناءً على ملف الإكسل المعتمد)
  },
  totalScore: { type: Number, default: 0 }, // المجموع
  finalRating: { type: String, default: 'ممتاز' }, // التقدير النهائي (ممتاز / جيد جداً / جيد / مقبول / ضعيف)
  openingMemorizedParts: { type: Number, default: 0 }, // الرصيد الافتتاحي للطالب (من كشف الطلاب الأساسي)
  currentMemorizedParts: { type: Number, default: 0 }, // عدد الأجزاء الحالية بعد مضي الشهر
  progressParts: { type: Number, default: 0 }, // مقدار التقدم عن الرصيد الافتتاحي (الحالي - الافتتاحي)
  notes: { type: String, default: '' }
});

const monthlyReportSchema = new mongoose.Schema({
  halaqah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthYear: {
    type: String, // e.g. "2026-10"
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved'],
    default: 'submitted'
  },
  generalNotes: {
    type: String,
    default: ''
  },
  studentEntries: [studentMonthlyEntrySchema]
}, {
  timestamps: true
});

// Unique compound index so there is at most one report per halaqah per month
monthlyReportSchema.index({ halaqah: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
