const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const validateUser = require('../middleware/validate_user');
const optionalUser = require('../middleware/optional_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');
const {
  listUsers,
  sendFriendRequest,
  listFriendRequests,
  respondToFriendRequest,
  cancelFriendRequest,
  listFriendMessages,
  createFriendMessage,
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
router.post('/friends/requests/:userId', validateUser, requireVerifiedUser, sendFriendRequest);
router.patch('/friends/requests/:requestId', validateUser, requireVerifiedUser, respondToFriendRequest);
router.delete('/friends/requests/:requestId', validateUser, requireVerifiedUser, cancelFriendRequest);
router.get('/friends/messages/:friendId', validateUser, listFriendMessages);
router.post('/friends/messages/:friendId', validateUser, requireVerifiedUser, createFriendMessage);

router.get('/posts', optionalUser, listPosts);
router.post('/posts', validateUser, requireVerifiedUser, upload.single('media'), createPost);
router.patch('/posts/:id', validateUser, requireVerifiedUser, upload.single('media'), updatePost);
router.delete('/posts/:id', validateUser, requireVerifiedUser, deletePost);

router.get('/posts/:postId/comments', optionalUser, listComments);
router.post('/posts/:postId/comments', validateUser, requireVerifiedUser, createComment);
router.patch('/posts/:postId/comments/:commentId', validateUser, requireVerifiedUser, updateComment);
router.delete('/posts/:postId/comments/:commentId', validateUser, requireVerifiedUser, deleteComment);

router.post('/posts/:postId/likes/toggle', validateUser, requireVerifiedUser, toggleLike);
router.post('/posts/:postId/upvotes/toggle', validateUser, requireVerifiedUser, toggleLike);

module.exports = router;
