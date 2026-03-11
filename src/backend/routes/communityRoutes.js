const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const validateUser = require('../middleware/validate_user');
const {
  listUsers,
  sendFriendRequest,
  listFriendRequests,
  respondToFriendRequest,
  cancelFriendRequest,
  listPosts,
  createPost,
  updatePost,
  deletePost,
  listComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
} = require('../controllers/communityController');

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'community');
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

router.get('/users', validateUser, listUsers);
router.get('/friends/requests', validateUser, listFriendRequests);
router.post('/friends/requests/:userId', validateUser, sendFriendRequest);
router.patch('/friends/requests/:requestId', validateUser, respondToFriendRequest);
router.delete('/friends/requests/:requestId', validateUser, cancelFriendRequest);

router.get('/posts', validateUser, listPosts);
router.post('/posts', validateUser, upload.single('media'), createPost);
router.patch('/posts/:id', validateUser, upload.single('media'), updatePost);
router.delete('/posts/:id', validateUser, deletePost);

router.get('/posts/:postId/comments', validateUser, listComments);
router.post('/posts/:postId/comments', validateUser, createComment);
router.patch('/posts/:postId/comments/:commentId', validateUser, updateComment);
router.delete('/posts/:postId/comments/:commentId', validateUser, deleteComment);

router.post('/posts/:postId/likes/toggle', validateUser, toggleLike);
router.post('/posts/:postId/upvotes/toggle', validateUser, toggleLike);

module.exports = router;
