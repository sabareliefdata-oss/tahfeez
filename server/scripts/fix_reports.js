const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MonthlyReport = require('../models/MonthlyReport');
const Student = require('../models/Student');
const Halaqah = require('../models/Halaqah');

async function fixReports() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to DB');

  const reports = await MonthlyReport.find().populate('halaqah', 'name');
  console.log(`Found ${reports.length} monthly reports`);

  for (const rep of reports) {
    if (!rep.halaqah) continue;
    const students = await Student.find({ halaqah: rep.halaqah._id, status: 'active' }).sort({ serialNumber: 1 });
    console.log(`Report for ${rep.halaqah.name} (${rep.monthYear}): currently has ${rep.studentEntries?.length || 0} entries. Halaqah has ${students.length} students.`);
    
    // Map existing
    const existingMap = new Map();
    if (rep.studentEntries && Array.isArray(rep.studentEntries)) {
      rep.studentEntries.forEach(e => {
        const sId = (e.student?._id || e.student)?.toString();
        if (sId) existingMap.set(sId, e);
      });
    }

    const fullEntries = students.map((s, idx) => {
      const ex = existingMap.get(s._id.toString());
      return {
        student: s._id,
        studentName: s.fullName,
        studentCode: s.code || `STU-${idx + 1}`,
        absenceExcused: ex?.absenceExcused || 0,
        absenceUnexcused: ex?.absenceUnexcused || 0,
        previousSurah: ex?.previousSurah || '',
        previousAyah: ex?.previousAyah || '',
        planMemorization: ex?.planMemorization || { expectedSurah: '', ayah: '', pagesCount: 0 },
        actualMemorization: ex?.actualMemorization || { surah: '', ayah: '', pagesCount: 0 },
        actualRevision: ex?.actualRevision || { surah: '', pagesCount: 0 },
        scientificCurriculum: ex?.scientificCurriculum || { plan: '', actual: '' },
        memorizationEvaluation: ex?.memorizationEvaluation || 'ممتاز',
        testScores: ex?.testScores || {
          memorization: 45,
          recitation: 20,
          performance: 10,
          lessons: 10,
          attendance: 10,
          behavior: 5
        },
        totalScore: ex?.totalScore || 100,
        finalRating: ex?.finalRating || 'ممتاز',
        notes: ex?.notes || ''
      };
    });

    rep.studentEntries = fullEntries;
    await rep.save();
    console.log(`Fixed report for ${rep.halaqah.name}: now has ${fullEntries.length} complete students with valid names!`);
  }

  await mongoose.disconnect();
  console.log('All monthly reports synchronized successfully!');
}

fixReports().catch(console.error);
