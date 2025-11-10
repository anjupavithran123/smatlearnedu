const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment'); // optional (see below)

/**
 * Simple slugify helper
 * - lowercases
 * - removes non-alphanumeric (except space & -)
 * - collapses spaces -> hyphen
 * - trims leading/trailing hyphens
 */
function makeSlug(text = '') {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars
    .trim()
    .replace(/\s+/g, '-')      // spaces -> -
    .replace(/-+/g, '-')       // collapse dashes
    .replace(/(^-|-$)/g, '');  // trim leading/trailing -
}

const createCourse = async (req, res) => {
  try {
    const { title, description, videoLinks, price, tags } = req.body;
    const slugBase = makeSlug(title || '');
    // attempt to ensure slug uniqueness by appending short suffix if collision
    let slug = slugBase || `course-${Date.now().toString(36)}`;
    // check collisions (rare) and add suffix if necessary
    const exists = await Course.findOne({ slug });
    if (exists) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const course = await Course.create({
      title,
      description,
      videoLinks: videoLinks || [],
      price: price || 0,
      tags: tags || [],
      instructor: req.user.name,
      createdBy: req.user.id,
      slug
    });
    return res.status(201).json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const listCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('createdBy', 'name email');
    return res.json({ courses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getCourse = async (req, res) => {
  try {
    const rawId = req.params.id; // your route uses :id
    let course = null;

    // If looks like ObjectId, try findById first
    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
      course = await Course.findById(rawId).populate('createdBy', 'name email');
    }

    // If not found by id (or rawId isn't an ObjectId), try slug
    if (!course) {
      course = await Course.findOne({ slug: rawId }).populate('createdBy', 'name email');
    }

    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // only owner or admin can update
    if (String(course.createdBy) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // if title is updated, optionally update slug (be careful: changing slugs breaks existing links)
    if (req.body.title && req.body.title !== course.title) {
      const newSlug = makeSlug(req.body.title);
      if (newSlug !== course.slug) {
        // ensure uniqueness
        let candidate = newSlug;
        const collision = await Course.findOne({ slug: candidate, _id: { $ne: course._id } });
        if (collision) {
          candidate = `${candidate}-${Date.now().toString(36).slice(-4)}`;
        }
        req.body.slug = candidate;
      }
    }

    Object.assign(course, req.body);
    await course.save();
    return res.json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (String(course.createdBy) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await course.remove();
    return res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// optional enroll — creates Enrollment doc or array entry
const enroll = async (req, res) => {
  try {
    const courseId = req.params.id;
    // simple implementation: create Enrollment collection
    await Enrollment.create({ course: courseId, student: req.user.id });
    return res.json({ message: 'Enrolled' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createCourse, listCourses, getCourse, updateCourse, deleteCourse, enroll };
