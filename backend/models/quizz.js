// backend/models/Quiz.js
const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  text: { type: String, required: true },
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: {
    type: [OptionSchema],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length >= 2,
      message: "A question must have at least 2 options",
    },
  },
  // ensure correctOptionId is an ObjectId and will be validated against options in pre-save
  correctOptionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  explanation: { type: String },
  points: { type: Number, default: 1 },
});

// Ensure correctOptionId refers to one of options' _id
QuestionSchema.pre("validate", function (next) {
  try {
    const optIds = (this.options || []).map((o) => o._id && o._id.toString());
    if (!optIds.includes(String(this.correctOptionId))) {
      return next(new Error("correctOptionId must reference one of the option ids"));
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    description: { type: String, default: "" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    questions: { type: [QuestionSchema], default: [] },
    timeLimitMinutes: { type: Number, default: null },

    // default to true for new quizzes
    published: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Force published true on creation (prevents client from setting published:false on create)
QuizSchema.pre("save", function (next) {
  if (this.isNew) {
    this.published = true;
  }
  next();
});

// Ensure updates via findOneAndUpdate / updateOne / updateMany cannot unset published
QuizSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  // If using $set or direct update, enforce published:true
  if (update.$set) {
    update.$set.published = true;
  } else {
    update.$set = { ...(update || {}), published: true };
    // Remove top-level fields to avoid accidentally overwriting other operators
    Object.keys(this.getUpdate()).forEach((k) => {
      if (k !== "$set" && k !== "$unset" && k !== "$inc" && k !== "$push") {
        delete update[k];
      }
    });
  }
  this.setUpdate(update);
  next();
});

// Also enforce for updateMany / updateOne if you use them:
["updateOne", "updateMany"].forEach((hook) => {
  QuizSchema.pre(hook, function (next) {
    const update = this.getUpdate();
    if (!update) return next();
    if (update.$set) {
      update.$set.published = true;
    } else {
      update.$set = { ...(update || {}), published: true };
    }
    this.setUpdate(update);
    next();
  });
});

// Helpful index: keep slug unique but sparse to allow multiple docs without slug
QuizSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Export using safe pattern to avoid OverwriteModelError
module.exports = mongoose.models && mongoose.models.Quiz
  ? mongoose.models.Quiz
  : mongoose.model("Quiz", QuizSchema);
