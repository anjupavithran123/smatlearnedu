// routes/progress.js
const express = require("express");
const router = express.Router();
const CourseProgress = require("../models/CourseProgress");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course"); // to compute total lessons
const auth = require("../middleware/authmiddleware");

// Get progress for a user for a particular course
router.get("/course/:courseId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;
    let progress = await CourseProgress.findOne({ user: userId, course: courseId });
    if (!progress) {
      // initialize if not present
      progress = await CourseProgress.create({ user: userId, course: courseId, percentComplete: 0, completedItems: [] });
    }
    // also return number of quizzes attempted for this course
    const quizzesAttempted = await QuizAttempt.countDocuments({ user: userId, course: courseId });
    res.json({ progress, quizzesAttempted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark a lesson/module as completed (id can be lessonId or slug)
router.post("/course/:courseId/complete", auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    // compute total items (you should adapt based on your course model)
    // Example: assume course.lessons is an array
    const totalItems = (course.lessons && course.lessons.length) || 0;

    let progress = await CourseProgress.findOne({ user: userId, course: courseId });
    if (!progress) {
      progress = new CourseProgress({ user: userId, course: courseId, completedItems: [] });
    }

    if (!progress.completedItems.includes(itemId)) {
      progress.completedItems.push(itemId);
    }

    // guard division by zero
    progress.percentComplete = totalItems > 0 ? Math.round((progress.completedItems.length / totalItems) * 100) : 0;
    await progress.save();

    res.json({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Record a quiz attempt (called when quiz finished)
router.post("/quiz-attempt", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, courseId, correct, total, score } = req.body;

    const attempt = await QuizAttempt.create({
      user: userId,
      quiz: quizId,
      course: courseId || null,
      correct: correct || 0,
      total: total || 0,
      score: typeof score === "number" ? score : (total > 0 ? Math.round((correct / total) * 100) : 0)
    });

    res.json({ attempt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
