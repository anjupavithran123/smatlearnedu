const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const requireRole = require('../middleware/requireRole');
const { listUsers } = require('../controller/userController');


// GET /user (admin only)
router.get('/', auth, requireRole('admin'), listUsers);


module.exports = router;