const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');

async function testHistory() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find a student who is in a monthly report
  const report = await MonthlyReport.findOne({ 'studentEntries.0': { $exists: true } });
  console.log('Report halaqah:', report.halaqah, 'monthYear:', report.monthYear);
  const entry = report.studentEntries[0];
  console.log('Entry student:', entry.student);
  
  const student = await Student.findById(entry.student);
  console.log('Found student:', student?.fullName, 'ID:', student?._id);

  // Now simulate the query in studentRoutes.js:
  const monthlyReports = await MonthlyReport.find({
    'studentEntries.student': student._id
  }).sort({ monthYear: 1 });

  console.log('monthlyReports count found with student._id:', monthlyReports.length);

  // What about if student is stored as a string or ObjectId?
  const stringReports = await MonthlyReport.find({
    $or: [
      { 'studentEntries.student': student._id },
      { 'studentEntries.student': student._id.toString() },
      { 'studentEntries.studentCode': student.code }
    ]
  });
  console.log('monthlyReports count found with $or fallback:', stringReports.length);

  const history = monthlyReports.map(rep => {
    const matchedEntry = rep.studentEntries.find(e => {
      const eStudentId = (e.student?._id || e.student)?.toString();
      const targetId = student._id.toString();
      return eStudentId === targetId || (student.code && e.studentCode === student.code);
    });
    return {
      monthYear: rep.monthYear,
      hasEntry: !!matchedEntry,
      studentName: matchedEntry?.studentName,
      totalScore: matchedEntry?.totalScore
    };
  });

  console.log('History mapped:', history);

  await mongoose.disconnect();
}
testHistory().catch(console.error);
