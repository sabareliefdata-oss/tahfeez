const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');

const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');

async function migrateOpeningBalances() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // Find Excel file
  const rootDir = path.join(__dirname, '../../');
  const files = fs.readdirSync(rootDir).filter(f => f.includes('بيانات الطلاب') && f.endsWith('.xlsx'));
  if (files.length === 0) {
    throw new Error('لم يتم العثور على ملف إكسل بيانات الطلاب في المجلد الرئيسي');
  }

  const excelFilePath = path.join(rootDir, files[0]);
  console.log('Reading Excel file:', excelFilePath);

  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`Total student records in Excel: ${rows.length}`);

  const allDbStudents = await Student.find().lean();
  console.log(`Total students in MongoDB: ${allDbStudents.length}`);

  const studentMapByCode = new Map();
  const studentMapByName = new Map();

  allDbStudents.forEach(s => {
    if (s.code) studentMapByCode.set(s.code.trim().toUpperCase(), s);
    if (s.fullName) studentMapByName.set(s.fullName.trim(), s);
  });

  const bulkOps = [];
  let matchedCount = 0;
  let totalOpeningParts = 0;

  for (const row of rows) {
    const studentName = (row['اسم الطالب'] || '').toString().trim();
    const code = (row['الكود بالموقع'] || '').toString().trim().toUpperCase();
    const partsFromExcel = Number(row['عدد الأجزاء التي يحفظها']) || 0;

    let targetStudent = studentMapByCode.get(code) || studentMapByName.get(studentName);

    if (targetStudent) {
      matchedCount++;
      totalOpeningParts += partsFromExcel;

      // Ensure memorizedParts is at least the opening balance
      const currentParts = (targetStudent.memorizedParts !== undefined && targetStudent.memorizedParts >= partsFromExcel)
        ? targetStudent.memorizedParts
        : partsFromExcel;

      bulkOps.push({
        updateOne: {
          filter: { _id: targetStudent._id },
          update: {
            $set: {
              openingMemorizedParts: partsFromExcel,
              memorizedParts: currentParts
            }
          }
        }
      });
    } else {
      console.warn(`[NOT FOUND] Student: ${studentName} (Code: ${code})`);
    }
  }

  if (bulkOps.length > 0) {
    console.log(`Updating ${bulkOps.length} students with opening memorized parts...`);
    const res = await Student.bulkWrite(bulkOps);
    console.log(`Bulk write finished! Modified: ${res.modifiedCount}, Matched: ${matchedCount}`);
  }

  // Update existing MonthlyReports so their entries contain openingMemorizedParts and progressParts
  console.log('\nUpdating existing MonthlyReports with opening balance & progress...');
  const reports = await MonthlyReport.find();
  const refreshedStudents = await Student.find().lean();
  const studentDbMap = new Map(refreshedStudents.map(s => [s._id.toString(), s]));

  for (const rep of reports) {
    let repModified = false;
    if (Array.isArray(rep.studentEntries)) {
      rep.studentEntries.forEach(entry => {
        const sId = (entry.student?._id || entry.student)?.toString();
        const sDoc = studentDbMap.get(sId);
        if (sDoc) {
          const openParts = sDoc.openingMemorizedParts || 0;
          const currParts = entry.currentMemorizedParts !== undefined ? entry.currentMemorizedParts : (sDoc.memorizedParts || openParts);
          const progress = Math.max(0, currParts - openParts);

          entry.openingMemorizedParts = openParts;
          entry.currentMemorizedParts = currParts;
          entry.progressParts = progress;
          repModified = true;
        }
      });
    }
    if (repModified) {
      await rep.save();
    }
  }
  console.log(`Updated ${reports.length} monthly reports.`);

  console.log('\n======================================================');
  console.log(` SUCCESS: Migrated Opening Balances for ${matchedCount} Students!`);
  console.log(` Total Opening Parts: ${totalOpeningParts} parts across system.`);
  console.log('======================================================');

  await mongoose.disconnect();
}

migrateOpeningBalances().catch(err => {
  console.error('Migration Error:', err);
  process.exit(1);
});
