const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const quizzesRouter = require('./routes/quizzes'); // Ensure file is named correctly
const ProgressRouter=require('./routes/progress');
const paymentRoutes = require("./routes/payments");
const instructorRoutes = require("./routes/instructor");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// Debug logger (optional)
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizzesRouter); // Frontend: /api/quizzes
app.use("/api/progress",ProgressRouter);
app.use("/api/payments", paymentRoutes);
app.use('/api/instructor',instructorRoutes);
// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
