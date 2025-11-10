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

// Connect to MongoDB early so startup fails fast if DB is unreachable
connectDB().catch(err => {
  console.error("Failed to connect to DB on startup:", err);
  // optional: process.exit(1);
});

// Middlewares
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.originalUrl}`);
  next();
});

// API routes (mount before static/spa fallback)
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
 *
 * Production build usually lands in frontend/dist (Vite) or frontend/build (CRA).
 * Adjust FRONTEND_BUILD_DIR accordingly.
 */
const FRONTEND_BUILD_DIR = path.join(__dirname, '..', 'frontend', 'dist');
// const FRONTEND_BUILD_DIR = path.join(__dirname, '..', 'frontend', 'build'); // use if CRA

// Serve static files if the build directory exists
app.use(express.static(FRONTEND_BUILD_DIR));

// SPA fallback: return index.html for any non-API route.
// This must come after mounting API routes so /api/* still work.
app.get(/.*/, (req, res, next) => {
  // If request is for API, skip this handler so API 404s work correctly
  if (req.path.startsWith('/api')) return next();

  const indexPath = path.join(FRONTEND_BUILD_DIR, 'index.html');

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);

      // If index.html is missing, respond with helpful message instead of generic 404
      return res.status(500).send('Frontend build not found. Did you run the frontend build?');
    }
  });
});

// Generic 404 for API routes or if static files not found
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
