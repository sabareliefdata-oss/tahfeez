const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Halaqah = require('../models/Halaqah');
const MonthlyReport = require('../models/MonthlyReport');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');

async function applyUpdatesAndClean() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected successfully.');

  // 1. Update Admin credentials: username: sabarelief, password: saba123$
  console.log('\n--- 1. Updating Admin Credentials ---');
  let admin = await User.findOne({ role: 'admin' });
  const newPasswordHash = await bcrypt.hash('saba123$', 10);

  if (admin) {
    admin.username = 'sabarelief';
    admin.password = newPasswordHash;
    admin.fullName = 'مؤسسة سبأ للإغاثة والتنمية - الإدارة';
    await admin.save();
    console.log(`[OK] Updated existing Admin user:`);
    console.log(`     Username: sabarelief`);
    console.log(`     Password: saba123$`);
  } else {
    admin = await User.create({
      fullName: 'مؤسسة سبأ للإغاثة والتنمية - الإدارة',
      username: 'sabarelief',
      phone: '777000001',
      role: 'admin',
      password: newPasswordHash,
      notes: 'الحساب الرئيسي لمدير النظام'
    });
    console.log(`[OK] Created Admin user: username: sabarelief / password: saba123$`);
  }

  // 2. Clean only Monthly Reports and Supervisor Evaluations
  console.log('\n--- 2. Cleaning Reports & Evaluations to Start Fresh ---');
  const deletedMonthly = await MonthlyReport.deleteMany({});
  const deletedEvals = await SupervisorEvaluation.deleteMany({});
  console.log(`[OK] Deleted Monthly Reports: ${deletedMonthly.deletedCount}`);
  console.log(`[OK] Deleted Supervisor Evaluations: ${deletedEvals.deletedCount}`);

  // 3. Reset students' memorizedParts to openingMemorizedParts (Clean baseline)
  console.log('\n--- 3. Verifying Student Baseline Memorization ---');
  const students = await Student.find();
  const studentBulk = [];
  for (const s of students) {
    const open = s.openingMemorizedParts || 0;
    studentBulk.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { memorizedParts: open } }
      }
    });
  }
  if (studentBulk.length > 0) {
    await Student.bulkWrite(studentBulk);
  }
  console.log(`[OK] Reset ${studentBulk.length} students to clean opening memorized parts.`);

  // 4. Verify system counts
  console.log('\n--- 4. Final Database Integrity Check ---');
  const halaqatCount = await Halaqah.countDocuments();
  const studentsCount = await Student.countDocuments();
  const usersCount = await User.countDocuments();
  const teachersCount = await User.countDocuments({ role: 'teacher' });
  const supervisorsCount = await User.countDocuments({ role: 'supervisor' });
  const adminsCount = await User.countDocuments({ role: 'admin' });
  const monthlyCount = await MonthlyReport.countDocuments();
  const evalCount = await SupervisorEvaluation.countDocuments();

  console.log(`Halaqat:               ${halaqatCount} (Target: 31)`);
  console.log(`Students:              ${studentsCount} (Target: 400)`);
  console.log(`Total Users:           ${usersCount} (1 Admin + 2 Supervisors + 31 Teachers)`);
  console.log(`  - Admins:            ${adminsCount}`);
  console.log(`  - Supervisors:       ${supervisorsCount}`);
  console.log(`  - Teachers:          ${teachersCount}`);
  console.log(`Monthly Reports:       ${monthlyCount} (Clean starting slate!)`);
  console.log(`Supervisor Evaluations:${evalCount} (Clean starting slate!)`);

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log(' DATABASE CLEANED & ADMIN CREDENTIALS UPDATED 100%!');
  console.log('======================================================');
}

applyUpdatesAndClean().catch(err => {
  console.error('Error applying updates:', err);
  process.exit(1);
});
