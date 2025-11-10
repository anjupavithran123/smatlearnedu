// models/QuizAttempt.js
const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: false },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  score: { type: Number, required: true }, // percent or raw
  correct: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  attemptedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
