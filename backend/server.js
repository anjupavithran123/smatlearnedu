// backend/server.js
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const quizzesRouter = require('./routes/quizzes');
const ProgressRouter = require('./routes/progress');
const paymentRoutes = require('./routes/payments');
const instructorRoutes = require('./routes/instructor');

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB on startup:', err);
  process.exit(1); // Stop server if DB is unreachable
});

// Middlewares
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.originalUrl}`);
  next();
});

// API routes (must come before static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/progress', ProgressRouter);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor', instructorRoutes);

// Health check route
app.get('/health', (req, res) => res.json({ ok: true }));

/**
 * STATIC FRONTEND SERVING
 * Make sure frontend build is copied to backend/public
 */
const FRONTEND_BUILD_DIR = path.join(__dirname, 'public'); // copy dist files here

// Serve static frontend files
app.use(express.static(FRONTEND_BUILD_DIR));

// SPA fallback: return index.html for any non-API route
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next(); // skip API routes

  const indexPath = path.join(FRONTEND_BUILD_DIR, 'index.html');

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      return res
        .status(500)
        .send(
          'Frontend build not found. Did you run "npm run build" and copy it to backend/public?'
        );
    }
  });
});

// Generic 404 for API routes or missing static files
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Serving frontend from ${FRONTEND_BUILD_DIR}`);
});
