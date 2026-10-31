const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');

async function sync() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');
  const students = await Student.find();
  const bulk = [];
  for (const s of students) {
    const open = s.openingMemorizedParts || 0;
    const curr = (s.memorizedParts !== undefined && s.memorizedParts >= open) ? s.memorizedParts : open;
    bulk.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { memorizedParts: curr } }
      }
    });
  }
  if (bulk.length > 0) await Student.bulkWrite(bulk);
  console.log(`Synced ${bulk.length} students: memorizedParts initialized to at least openingMemorizedParts.`);

  // Sync MonthlyReports entries
  const reports = await MonthlyReport.find();
  const stMap = new Map((await Student.find().lean()).map(s => [s._id.toString(), s]));
  for (const r of reports) {
    if (r.studentEntries) {
      r.studentEntries.forEach(e => {
        const sDoc = stMap.get((e.student?._id || e.student)?.toString());
        if (sDoc) {
          const open = sDoc.openingMemorizedParts || 0;
          e.openingMemorizedParts = open;
          if (!e.currentMemorizedParts || e.currentMemorizedParts < open) {
            e.currentMemorizedParts = open;
          }
          e.progressParts = Math.max(0, e.currentMemorizedParts - open);
        }
      });
      r.markModified('studentEntries');
      await r.save();
    }
  }
  console.log(`Synced ${reports.length} monthly reports.`);
  await mongoose.disconnect();
}

sync().catch(console.error);
