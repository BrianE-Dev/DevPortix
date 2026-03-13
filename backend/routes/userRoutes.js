const express = require('express');
const { me, updateProfile } = require('../controllers/userController');
const validateUser = require('../middleware/validate_user');

const router = express.Router();

router.get('/me', validateUser, me);
router.patch('/profile', validateUser, updateProfile);

module.exports = router;
