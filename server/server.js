const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const halaqahRoutes = require('./routes/halaqahRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');
const supervisorEvaluationRoutes = require('./routes/supervisorEvaluationRoutes');
const annualReportRoutes = require('./routes/annualReportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Tahfeez Backend API is active and running',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/halaqat', halaqahRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/supervisor-evaluations', supervisorEvaluationRoutes);
app.use('/api/annual-reports', annualReportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Serve static frontend assets if built
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Express 5 catch-all handler for SPA
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Database Connection & Server Start
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is missing in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected successfully.');
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Tahfeez System running on http://localhost:${PORT}`);
      console.log(` API Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
