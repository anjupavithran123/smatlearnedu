const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  instructor: { type: String }, // saved display name
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoLinks: [{ type: String }],
  price: { type: Number, default: 0 },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
