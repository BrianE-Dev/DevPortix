const express = require('express');
const validateUser = require('../middleware/validate_user');
const requireRole = require('../middleware/requireRole');
const { listUsers, updateUserRole } = require('../controllers/adminController');

const router = express.Router();

router.get('/users', validateUser, requireRole(['super_admin']), listUsers);
router.patch('/users/:id/role', validateUser, requireRole(['super_admin']), updateUserRole);

module.exports = router;

