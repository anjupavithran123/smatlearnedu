// backend/routes/instructor.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/user");
const Course = require("../models/Course");
const Payment = require("../models/payment");

const authMiddleware = require("../middleware/authmiddleware");

// Helper: acceptable paid statuses (adjust if your app uses other values)
const PAID_STATUSES = ["paid", "success", "completed"];

/**
 * GET /api/instructor/dashboard
 * Returns counts scoped to the currently authenticated instructor
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const instructorId = req.user && (req.user._id || req.user.id);
    if (!instructorId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 1) Find courses that belong to this instructor (createdBy is the ObjectId)
    const courses = await Course.find({ createdBy: instructorId }).select("_id title createdBy");
    const courseIds = courses.map((c) => c._id);

    // 2) Counts
    const usersCount = await User.countDocuments(); // total users in platform (optional)
    const coursesCount = courses.length;

    // If no courses, return zeroes early (avoids unnecessary aggregation)
    if (!courseIds.length) {
      return res.json({
        usersCount,
        coursesCount,
        salesCount: 0,
        revenueTotal: 0,
      });
    }

    // 3) Sales count: payments that are for these courses and have a paid status
    const salesCount = await Payment.countDocuments({
      course: { $in: courseIds },
      status: { $in: PAID_STATUSES },
    });

    // 4) Revenue total (sum of amount) for these courses
    const revenueAgg = await Payment.aggregate([
      { $match: { course: { $in: courseIds }, status: { $in: PAID_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueTotal = (revenueAgg[0] && revenueAgg[0].total) || 0;

    return res.json({ usersCount, coursesCount, salesCount, revenueTotal });
  } catch (err) {
    console.error("Instructor dashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/**
 * GET /api/instructor/stats?range=30
 * Returns daily labels, sales counts and revenue numbers for last `range` days, scoped to instructor
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const instructorId = req.user && (req.user._id || req.user.id);
    if (!instructorId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const range = Math.max(1, parseInt(req.query.range || "30", 10));
    const from = new Date();
    from.setDate(from.getDate() - range + 1);

    // Get instructor's course IDs
    const courses = await Course.find({ createdBy: instructorId }).select("_id");
    const courseIds = courses.map((c) => c._id);

    if (!courseIds.length) {
      // return empty arrays but with labels for the requested range
      const labels = [];
      const sales = [];
      const revenue = [];
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toISOString().slice(0, 10);
        labels.push(label);
        sales.push(0);
        revenue.push(0);
      }
      return res.json({ labels, sales, revenue });
    }

    // Aggregate payments per day for the instructor's courses
    const agg = await Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: { $in: PAID_STATUSES },
          createdAt: { $gte: from },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const labels = [];
    const sales = [];
    const revenue = [];

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      labels.push(label);
      const found = agg.find((a) => a._id === label);
      sales.push(found ? found.sales : 0);
      revenue.push(found ? found.revenue : 0);
    }

    return res.json({ labels, sales, revenue });
  } catch (err) {
    console.error("Instructor stats error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

module.exports = router;
