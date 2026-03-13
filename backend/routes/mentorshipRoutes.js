const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const validateUser = require('../middleware/validate_user');
const requireRole = require('../middleware/requireRole');
const {
  listInstructors,
  selectInstructor,
  getMyMentorship,
  listMyStudents,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitMyAssignment,
} = require('../controllers/mentorshipController');

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.get('/instructors', validateUser, requireRole(['student']), listInstructors);
router.post('/select-instructor', validateUser, requireRole(['student']), selectInstructor);
router.get('/my-mentorship', validateUser, requireRole(['student']), getMyMentorship);

router.get('/my-students', validateUser, requireRole(['instructor']), listMyStudents);
router.post(
  '/my-students/:studentId/assignments',
  validateUser,
  requireRole(['instructor']),
  upload.single('attachment'),
  createAssignment
);
router.patch(
  '/assignments/:assignmentId',
  validateUser,
  requireRole(['instructor']),
  upload.single('attachment'),
  updateAssignment
);
router.delete('/assignments/:assignmentId', validateUser, requireRole(['instructor']), deleteAssignment);
router.patch(
  '/my-assignments/:assignmentId/submit',
  validateUser,
  requireRole(['student']),
  upload.single('submissionAttachment'),
  submitMyAssignment
);

module.exports = router;
