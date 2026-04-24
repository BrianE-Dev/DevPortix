const express = require('express');
const validateUser = require('../middleware/validate_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

router.get('/', validateUser, listProjects);
router.post('/', validateUser, requireVerifiedUser, createProject);
router.patch('/:id', validateUser, requireVerifiedUser, updateProject);
router.delete('/:id', validateUser, requireVerifiedUser, deleteProject);

module.exports = router;
