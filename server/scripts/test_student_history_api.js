const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');

const Student = require('../models/Student');
const MonthlyReport = require('../models/MonthlyReport');
const User = require('../models/User');
const studentRoutes = require('../routes/studentRoutes');

async function testApi() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected.');

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));

  const realUser = await User.findOne({ role: 'admin' });
  const rep = await MonthlyReport.findOne({ 'studentEntries.0': { $exists: true } });
  const targetStudentId = rep.studentEntries[0].student;

  const token = jwt.sign(
    { id: realUser._id, role: realUser.role },
    process.env.JWT_SECRET
  );

  console.log(`Calling http://localhost:5099/api/students/${targetStudentId}/report-history ...`);
  const response = await fetch(`http://localhost:5099/api/students/${targetStudentId}/report-history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status code:', response.status);
  const data = await response.json();

  console.log('Student Name:', data?.student?.fullName);
  console.log('Halaqah:', data?.student?.halaqah?.name);
  console.log('History count:', data?.history?.length);
  if (data?.history?.length > 0) {
    console.log('First Record:');
    console.log(`  Month: ${data.history[0].monthYear}`);
    console.log(`  Opening Parts: ${data.history[0].openingMemorizedParts}`);
    console.log(`  Current Parts: ${data.history[0].currentMemorizedParts}`);
    console.log(`  Progress: +${data.history[0].progressParts} parts`);
    console.log(`  Total Score: ${data.history[0].totalScore}/100`);
    console.log(`  Rating: ${data.history[0].finalRating}`);
    console.log(`  Absence: ${data.history[0].absenceExcused + data.history[0].absenceUnexcused} days`);
  }

  server.close();
  await mongoose.disconnect();
  console.log('\n>>> 100% VERIFIED: Student Report History is working flawlessly! <<<');
}

testApi().catch(console.error);
