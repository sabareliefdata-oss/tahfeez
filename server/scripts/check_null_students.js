const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MonthlyReport = require('../models/MonthlyReport');
const Student = require('../models/Student');

async function checkNullStudents() {
  await mongoose.connect(process.env.MONGO_URI);
  const reports = await MonthlyReport.find().lean();
  let nullStudentCount = 0;
  let totalEntries = 0;

  for (const r of reports) {
    if (r.studentEntries) {
      for (const e of r.studentEntries) {
        totalEntries++;
        if (!e.student) {
          nullStudentCount++;
          console.log(`Found null e.student in report ${r.halaqah} ${r.monthYear}: Name: ${e.studentName}, Code: ${e.studentCode}`);
        }
      }
    }
  }

  console.log(`Checked ${totalEntries} entries across ${reports.length} reports.`);
  console.log(`Null e.student count: ${nullStudentCount}`);

  // Test report-history endpoint logic for all students to see if ANY throw an error!
  const students = await Student.find().limit(20);
  let errorCount = 0;
  for (const st of students) {
    try {
      const mReports = await MonthlyReport.find({
        $or: [
          { 'studentEntries.student': st._id },
          { 'studentEntries.studentCode': st.code }
        ]
      });

      const history = mReports.map(rep => {
        const entry = rep.studentEntries.find(e => {
          const sId = (e.student?._id || e.student)?.toString();
          return sId === st._id.toString() || (st.code && e.studentCode === st.code);
        });
        return entry;
      });
    } catch (err) {
      errorCount++;
      console.error(`Error for student ${st.fullName}:`, err.message);
    }
  }
  console.log(`Tested 20 students for errors, errorCount: ${errorCount}`);

  await mongoose.disconnect();
}

checkNullStudents().catch(console.error);
