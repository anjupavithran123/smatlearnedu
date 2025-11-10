const express = require('express');
const router = express.Router();
const { signup, login, profile } = require('../controller/authcontroller');
const auth = require('../middleware/authmiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', auth, profile);

module.exports = router;
