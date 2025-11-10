const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const requireRole = require('../middleware/requireRole');
const {
  createCourse, listCourses, getCourse, updateCourse, deleteCourse, enroll
} = require('../controller/CourseController');

router.get('/', listCourses);
router.get('/:id', getCourse);

// instructor-only create
router.post('/', auth, requireRole('instructor','admin'), createCourse);

// update/delete require auth; controllers check ownership/admin
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);

// enroll (students only)
router.post('/:id/enroll', auth, requireRole('student','admin'), enroll);

module.exports = router;
