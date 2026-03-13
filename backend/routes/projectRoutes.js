const express = require('express');
const validateUser = require('../middleware/validate_user');
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

router.get('/', validateUser, listProjects);
router.post('/', validateUser, createProject);
router.patch('/:id', validateUser, updateProject);
router.delete('/:id', validateUser, deleteProject);

module.exports = router;
