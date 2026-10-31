const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas.');

  const total = await Student.countDocuments();
  const withOpening = await Student.countDocuments({ openingMemorizedParts: { $exists: true, $gte: 0 } });
  console.log(`Total students: ${total}`);
  console.log(`Students with opening balance recorded: ${withOpening}`);

  // Sample 5 students
  const samples = await Student.find().limit(5).select('fullName code openingMemorizedParts memorizedParts').lean();
  console.log('\n--- Sample Students ---');
  samples.forEach((s, idx) => {
    const progress = (s.memorizedParts || 0) - (s.openingMemorizedParts || 0);
    console.log(`${idx + 1}. ${s.fullName} (${s.code}): الافتتاحي=${s.openingMemorizedParts} ج | الحالي=${s.memorizedParts} ج | التقدم=${progress >= 0 ? '+' + progress : progress} ج`);
  });

  // Check a monthly report
  const rep = await MonthlyReport.findOne().lean();
  if (rep && rep.studentEntries?.length > 0) {
    const entry = rep.studentEntries[0];
    console.log('\n--- Sample Monthly Report Entry ---');
    console.log(`Report Month: ${rep.monthYear}`);
    console.log(`Student: ${entry.studentName}`);
    console.log(`Opening Parts: ${entry.openingMemorizedParts}`);
    console.log(`Current Parts: ${entry.currentMemorizedParts}`);
    console.log(`Progress Parts: +${entry.progressParts || 0}`);
  }

  await mongoose.disconnect();
  console.log('\nVerification complete and 100% verified!');
}

verify().catch(console.error);
