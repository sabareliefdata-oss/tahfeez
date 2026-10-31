const mongoose = require('mongoose');

const supervisorEvaluationSchema = new mongoose.Schema({
  halaqah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Halaqah',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  monthYear: {
    type: String, // e.g. "2026-10"
    required: true
  },
  visitDate: {
    type: Date,
    default: Date.now
  },

  // 1. التقييم الإداري (34 درجة)
  adminScores: {
    attendancePunctuality: { type: Number, min: 0, max: 5, default: 5 }, // الالتزام بدوام الحلقة
    dailyRecordActivation: { type: Number, min: 0, max: 6, default: 6 }, // تفعيل سجل الحلقات
    disciplineAndManagement: { type: Number, min: 0, max: 6, default: 6 }, // ضبط الحلقة
    studentsRetention: { type: Number, min: 0, max: 6, default: 6 }, // انضباط الطلاب وعدم تسربهم
    teacherCompliance: { type: Number, min: 0, max: 6, default: 6 }, // تجاوب المعلم
    timelyReporting: { type: Number, min: 0, max: 5, default: 5 } // رفع التقارير في موعدها
  },
  adminTotal: { type: Number, default: 34 },

  // 2. التقييم العلمي (33 درجة)
  scientificScores: {
    recitationMastery: { type: Number, min: 0, max: 6, default: 6 }, // التمكن والإتقان
    shariaKnowledge: { type: Number, min: 0, max: 5, default: 5 }, // الإلمام بالعلوم الشرعية
    continuousDevelopment: { type: Number, min: 0, max: 5, default: 5 }, // الحرص على التطور
    studentsAcademicLevel: { type: Number, min: 0, max: 5, default: 5 }, // المستوى العلمي لطلاب الحلقة
    tajweedRulesApplication: { type: Number, min: 0, max: 6, default: 6 }, // الإلمام بالأحكام التجويدية
    planAchievement: { type: Number, min: 0, max: 6, default: 6 } // إنجاز خطة الحفظ والمراجعة
  },
  scientificTotal: { type: Number, default: 33 },

  // 3. التقييم المهني (33 درجة)
  professionalScores: {
    recitationCoverage: { type: Number, min: 0, max: 6, default: 6 }, // استيفاء التسميع لمعظم الطلاب
    dailyRevisionFocus: { type: Number, min: 0, max: 6, default: 6 }, // الاهتمام بالمراجعة اليومية
    individualReading: { type: Number, min: 0, max: 5, default: 5 }, // القراءة الفردية وتصحيح الأخطاء
    errorCorrection: { type: Number, min: 0, max: 5, default: 5 }, // اكتشاف الأخطاء وتصويبها
    meaningClarification: { type: Number, min: 0, max: 6, default: 6 }, // توضيح المعاني الغامضة
    timeManagement: { type: Number, min: 0, max: 5, default: 5 } // حسن إدارة وقت الحلقة
  },
  professionalTotal: { type: Number, default: 33 },

  totalScore: { type: Number, default: 100 }, // المجموع النهائي من 100

  positives: { type: String, default: '' }, // إيجابيات
  negatives: { type: String, default: '' }, // سلبيات
  recommendations: { type: String, default: '' }, // توصيات ومقترحات
  supervisorSignature: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupervisorEvaluation', supervisorEvaluationSchema);
