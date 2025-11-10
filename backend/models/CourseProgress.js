// models/CourseProgress.js
const mongoose = require("mongoose");

const CourseProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  // percentage 0 - 100
  percentComplete: { type: Number, default: 0 },
  // track completed lessons/modules by id (or slug)
  completedItems: [{ type: String }], // store lessonId or "module:lesson"
  // timestamps for sorting & UI
}, { timestamps: true });

CourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", CourseProgressSchema);
