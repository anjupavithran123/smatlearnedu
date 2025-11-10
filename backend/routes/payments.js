// routes/payments.js
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const router = express.Router();

const Course = require("../models/Course");
const Payment = require("../models/payment");
const User = require("../models/user"); // optional, for lookups

// Replace with your real auth middleware which sets req.user = { id: ... }
const authMiddleware = require("../middleware/authmiddleware"); // ensure this exists

console.log("🔔 payments router loaded");

// Initialize Razorpay if keys are present
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
  } catch (e) {
    console.error("❌ Razorpay init error:", e && e.message);
    razorpay = null;
  }
} else {
  console.warn("⚠️ Razorpay keys missing. Using stub order responses for development.");
}

/**
 * Create order for a course
 * POST /api/payments/courses/:id/create-order
 */
router.post("/courses/:id/create-order", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    console.log("📩 create-order request for course:", id, "by user:", req.user && req.user.id);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!course.price || course.price <= 0) {
      return res.status(400).json({ message: "Course has no price set" });
    }

    const options = {
      amount: course.price, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        courseId: course._id.toString(),
        userId: req.user.id.toString(),
      },
    };

    // Dev fallback: if Razorpay not configured, return a stub order
    if (!razorpay) {
      console.log("🧪 Returning stub order (Razorpay not configured)");
      const stub = {
        id: `order_stub_${Date.now()}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        status: "created",
      };
      return res.json({ order: stub });
    }

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);
    return res.json({ order });
  } catch (err) {
    console.error("❌ create-order error:", err && err.message, err && err.stack);
    return res.status(500).json({ message: "Could not create order", details: err?.message });
  }
});

/**
 * Verify payment signature and record payment + enroll user
 * POST /api/payments/verify-payment
 * Body: { paymentId, orderId, signature, courseId }
 */
router.post("/verify-payment", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    console.log("📩 verify-payment called with body:", { ...req.body });
    const { paymentId, orderId, signature, courseId } = req.body;

    if (!paymentId || !orderId || !signature || !courseId) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Prevent duplicate processing: check if paymentId already exists
    const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (existingPayment) {
      console.warn("⚠️ Payment already processed:", paymentId);
      return res.json({ success: true, message: "Payment already processed", payment: existingPayment });
    }

    // Fetch course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ success: false, message: "Course not found" });
    }

    // Verify signature server-side (if key exists)
    if (process.env.RAZORPAY_KEY_SECRET) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if (generatedSignature !== signature) {
        console.warn("⚠️ Signature mismatch", { orderId, paymentId, generatedSignature, signature });
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } else {
      console.warn("⚠️ RAZORPAY_KEY_SECRET missing; skipping signature verification (dev stub).");
      // If you want stronger dev checks, you can require NODE_ENV === 'development' to allow this
    }

    // Optional: fetch order from Razorpay to confirm amount and status (only when Razorpay initialized)
    let providerOrder = null;
    if (razorpay) {
      try {
        providerOrder = await razorpay.orders.fetch(orderId);
        // providerOrder.amount is in paise
        console.log("ℹ️ Fetched order from Razorpay:", orderId, "amount:", providerOrder.amount);
      } catch (fetchErr) {
        // if order fetch fails, log and continue — but be cautious trusting client amount
        console.error("⚠️ Failed to fetch order from Razorpay:", fetchErr && fetchErr.message);
      }
    }

    // Decide the authoritative amount:
    // Prefer providerOrder.amount, otherwise the course.price (safer than trusting client).
    const authoritativeAmount = (providerOrder && providerOrder.amount) || course.price || 0;

    // IMPORTANT: Start transaction so payment + enrollment are atomic
    session.startTransaction();
    try {
      // Create Payment record
      const paymentDoc = new Payment({
        user: userId,
        course: course._id,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        amount: authoritativeAmount,
        currency: "INR",
        status: "paid",
        raw: req.body,
        receipt: `rcpt_${Date.now()}`,
      });

      await paymentDoc.save({ session });

      // Enroll user (example: Course.students array)
      course.students = course.students || [];
      const alreadyEnrolled = course.students.some((s) => s.toString() === userId.toString());
      if (!alreadyEnrolled) {
        course.students.push(userId);
        await course.save({ session });
      } else {
        console.log("ℹ️ User already enrolled in course:", userId);
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log("✅ Payment saved and user enrolled:", paymentDoc._id);
      return res.json({ success: true, message: "Payment verified, recorded and user enrolled", payment: paymentDoc });
    } catch (txErr) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      console.error("❌ Transaction error while recording payment/enrolling:", txErr && txErr.message);
      return res.status(500).json({ success: false, message: "Transaction failed", details: txErr?.message });
    }
  } catch (err) {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (e) {
        console.error("⚠️ abortTransaction failed:", e && e.message);
      }
    }
    session.endSession();
    console.error("❌ verify-payment error:", err && err.message, err && err.stack);
    return res.status(500).json({ success: false, message: "Server error", details: err?.message });
  }
});

module.exports = router;
