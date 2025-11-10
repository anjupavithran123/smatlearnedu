// models/Payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true, unique: true, sparse: true },
    razorpaySignature: { type: String },

    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },

    raw: { type: mongoose.Schema.Types.Mixed },
    receipt: { type: String },
  },
  {
    timestamps: true,
  }
);

// helpful indexes
PaymentSchema.index({ user: 1, course: 1 });

// Use existing model if already compiled (prevents OverwriteModelError)
module.exports =
  mongoose.models && mongoose.models.Payment
    ? mongoose.models.Payment
    : mongoose.model("Payment", PaymentSchema);
