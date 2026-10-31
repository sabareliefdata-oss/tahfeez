const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MonthlyReport = require('../models/MonthlyReport');
const Student = require('../models/Student');
const Halaqah = require('../models/Halaqah');

async function checkRecentReports() {
  await mongoose.connect(process.env.MONGO_URI);
  const reports = await MonthlyReport.find().sort({ updatedAt: -1 }).limit(5).populate('halaqah', 'name').lean();
  console.log('Most recently updated reports count:', reports.length);
  for (const r of reports) {
    console.log(`Report: ${r.halaqah?.name} - Month: ${r.monthYear} - UpdatedAt: ${r.updatedAt}`);
    console.log('  Entries count:', r.studentEntries?.length);
    if (r.studentEntries?.length > 0) {
      const e0 = r.studentEntries[0];
      console.log('  First entry student field:', e0.student);
      console.log('  First entry studentName:', e0.studentName);
      console.log('  First entry studentCode:', e0.studentCode);
      const sDoc = await Student.findById(e0.student);
      console.log('  Student exists in DB with that ID?', !!sDoc, sDoc?._id, sDoc?.fullName);
    }
  }
  await mongoose.disconnect();
}
checkRecentReports().catch(console.error);
