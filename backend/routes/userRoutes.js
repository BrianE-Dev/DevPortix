const express = require('express');
const { me, updateProfile, deleteAccount } = require('../controllers/userController');
const validateUser = require('../middleware/validate_user');

const router = express.Router();

router.get('/me', validateUser, me);
router.patch('/profile', validateUser, updateProfile);
router.delete('/me', validateUser, deleteAccount);

module.exports = router;
