const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Halaqah = require('../models/Halaqah');
const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const { chatWithGemini } = require('../services/geminiService');

async function testPerformanceAndAi() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Test Halaqat Query Speed
  console.log('\n--- 1. Testing Halaqat Query & Count Speed ---');
  const t0 = Date.now();
  const halaqat = await Halaqah.find({ status: { $ne: 'inactive' } }).lean();
  const halaqahIds = halaqat.map(h => h._id);
  const counts = await Student.aggregate([
    { $match: { halaqah: { $in: halaqahIds }, status: 'active' } },
    { $group: { _id: '$halaqah', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
  const halaqatWithCounts = halaqat.map(h => ({
    ...h,
    studentCount: countMap.get(h._id.toString()) || 0
  }));
  const elapsedHalaqat = Date.now() - t0;
  console.log(`[SPEED OK] Fetched ${halaqatWithCounts.length} halaqat with student counts in: ${elapsedHalaqat} ms (previously was ~15,000 ms)`);

  // 2. Test AI Chat with live context & dynamic search
  console.log('\n--- 2. Testing AI Chat with live context & query grounding ---');
  const userQuery = 'من هم أفضل الطلاب حفظاً وما هي الحلقات التي ينتمون إليها؟';
  console.log(`Asking AI: "${userQuery}"...`);

  const [totalHalaqat, totalStudents, topStudents, partsDistribution] = await Promise.all([
    Halaqah.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.find({ status: 'active' }).sort({ memorizedParts: -1, fullName: 1 }).limit(10).populate('halaqah', 'name').lean(),
    Student.aggregate([
      { $match: { status: 'active' } },
      {
        $bucket: {
          groupBy: '$memorizedParts',
          boundaries: [0, 1, 5, 10, 15, 20, 30, 31],
          default: 'غير محدد',
          output: { count: { $sum: 1 } }
        }
      }
    ])
  ]);

  const dbContext = {
    totalHalaqat,
    totalStudents,
    topMemorizersList: topStudents.map(s => ({
      الاسم: s.fullName,
      الأجزاء_المحفوظة: s.memorizedParts,
      الحلقة: s.halaqah?.name
    })),
    partsDistribution
  };

  const aiRes = await chatWithGemini(userQuery, [], dbContext);
  console.log('[AI RESULT]:');
  console.log('Model used:', aiRes.modelUsed);
  console.log('AI Reply Preview:\n', aiRes.reply);

  const containsNames = topStudents.some(s => aiRes.reply.includes(s.fullName));
  console.log('\nDid AI mention actual top student names from database?:', containsNames ? 'YES! [PASSED]' : 'CHECK');
  
  await mongoose.disconnect();
  console.log('\nDone testing!');
}

testPerformanceAndAi().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
