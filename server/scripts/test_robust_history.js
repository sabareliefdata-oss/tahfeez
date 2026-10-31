const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');

async function testRobustHistory() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Pick any active student
  const student = await Student.findOne({ status: 'active' }).populate('halaqah');
  console.log('Testing with student:', student.fullName, 'Code:', student.code, 'Halaqah:', student.halaqah?.name);

  const halaqahId = student.halaqah?._id || student.halaqah;

  const monthlyReports = await MonthlyReport.find({
    $or: [
      { 'studentEntries.student': student._id },
      { 'studentEntries.studentCode': student.code },
      { halaqah: halaqahId }
    ]
  }).sort({ monthYear: 1 }).lean();

  console.log('Found monthly reports for halaqah/student:', monthlyReports.length);

  const history = [];

  for (const rep of monthlyReports) {
    if (!Array.isArray(rep.studentEntries)) continue;

    const matchedEntry = rep.studentEntries.find(e => {
      const eStudentId = (e.student?._id || e.student)?.toString();
      const targetId = student._id.toString();
      if (eStudentId && eStudentId === targetId) return true;
      if (student.code && e.studentCode && e.studentCode.trim().toUpperCase() === student.code.trim().toUpperCase()) return true;
      if (student.fullName && e.studentName && e.studentName.trim() === student.fullName.trim()) return true;
      return false;
    });

    if (matchedEntry) {
      history.push({
        monthYear: rep.monthYear,
        studentName: matchedEntry.studentName,
        studentCode: matchedEntry.studentCode,
        openingMemorizedParts: matchedEntry.openingMemorizedParts !== undefined ? matchedEntry.openingMemorizedParts : (student.openingMemorizedParts || 0),
        currentMemorizedParts: matchedEntry.currentMemorizedParts !== undefined ? matchedEntry.currentMemorizedParts : (student.memorizedParts || 0),
        progressParts: matchedEntry.progressParts !== undefined ? matchedEntry.progressParts : Math.max(0, (matchedEntry.currentMemorizedParts || 0) - (student.openingMemorizedParts || 0)),
        absenceExcused: matchedEntry.absenceExcused || 0,
        absenceUnexcused: matchedEntry.absenceUnexcused || 0,
        planMemorization: matchedEntry.planMemorization || {},
        actualMemorization: matchedEntry.actualMemorization || {},
        actualRevision: matchedEntry.actualRevision || {},
        scientificCurriculum: matchedEntry.scientificCurriculum || {},
        testScores: matchedEntry.testScores || {
          memorization: 45, recitation: 20, performance: 10, lessons: 10, attendance: 10, behavior: 5
        },
        totalScore: matchedEntry.totalScore || 100,
        finalRating: matchedEntry.finalRating || 'ممتاز',
        teacherNotes: matchedEntry.notes || ''
      });
    }
  }

  console.log('Successfully mapped history records:', history.length);
  if (history.length > 0) {
    console.log('Sample history item:', history[0]);
  }

  await mongoose.disconnect();
}

testRobustHistory().catch(console.error);
