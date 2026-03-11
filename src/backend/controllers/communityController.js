const path = require('path');
const {
  CommunityPost,
  CommunityComment,
  CommunityPostLike,
} = require('../modules/community');
const User = require('../modules/userSchema');
const FriendRequest = require('../modules/friendRequest');

const VALID_TYPES = new Set(['blog', 'chat']);
const VALID_SORTS = new Set(['newest', 'oldest', 'mostLiked', 'mostCommented']);

const normalizeType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_TYPES.has(normalized) ? normalized : null;
};

const normalizeSort = (value) => {
  const normalized = String(value || '').trim();
  return VALID_SORTS.has(normalized) ? normalized : 'newest';
};

const parsePositiveInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sameId = (a, b) => String(a) === String(b);

const toAuthorPayload = (ownerDoc) => {
  if (!ownerDoc) return null;

  return {
    id: String(ownerDoc._id),
    fullName: ownerDoc.fullName,
    email: ownerDoc.email,
    role: ownerDoc.role,
    avatar: ownerDoc.avatar,
  };
};

const toMediaPayload = (postDoc) => {
  if (!postDoc?.media?.url) return null;
  return {
    url: postDoc.media.url,
    mimeType: postDoc.media.mimeType || '',
    originalName: postDoc.media.originalName || '',
    size: Number(postDoc.media.size || 0),
  };
};

const toPostPayload = (postDoc, currentUserId, likedIds = new Set()) => {
  const postId = String(postDoc._id);
  const ownerId = String(postDoc.ownerId?._id || postDoc.ownerId);
  const upvoteCount = Number(postDoc.likeCount || 0);

  return {
    id: postId,
    type: postDoc.type,
    title: postDoc.title || '',
    content: postDoc.content,
    media: toMediaPayload(postDoc),
    ownerId,
    author: toAuthorPayload(postDoc.ownerId),
    isOwner: ownerId === String(currentUserId),
    isLiked: likedIds.has(postId),
    isUpvoted: likedIds.has(postId),
    commentCount: Number(postDoc.commentCount || 0),
    likeCount: upvoteCount,
    upvoteCount,
    createdAt: postDoc.createdAt,
    updatedAt: postDoc.updatedAt,
  };
};

const toCommentPayload = (commentDoc, currentUserId) => {
  const ownerId = String(commentDoc.ownerId?._id || commentDoc.ownerId);

  return {
    id: String(commentDoc._id),
    postId: String(commentDoc.postId),
    content: commentDoc.content,
    ownerId,
    author: toAuthorPayload(commentDoc.ownerId),
    isOwner: ownerId === String(currentUserId),
    createdAt: commentDoc.createdAt,
    updatedAt: commentDoc.updatedAt,
  };
};

const toFriendUserPayload = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername || '',
  avatar: userDoc.avatar || null,
});

const toFriendRequestPayload = (requestDoc, currentUserId) => ({
  id: String(requestDoc._id),
  requester: toFriendUserPayload(requestDoc.requesterId),
  recipient: toFriendUserPayload(requestDoc.recipientId),
  status: requestDoc.status,
  isIncoming: sameId(requestDoc.recipientId?._id, currentUserId),
  isOutgoing: sameId(requestDoc.requesterId?._id, currentUserId),
  createdAt: requestDoc.createdAt,
  updatedAt: requestDoc.updatedAt,
});

const buildFriendStatusMap = (friendRequests, currentUserId) => {
  const map = new Map();

  for (const request of friendRequests) {
    const otherId = sameId(request.requesterId, currentUserId)
      ? String(request.recipientId)
      : String(request.requesterId);

    let status = 'none';
    if (request.status === 'accepted') {
      status = 'friends';
    } else if (request.status === 'pending') {
      status = sameId(request.requesterId, currentUserId)
        ? 'outgoing_pending'
        : 'incoming_pending';
    }

    map.set(otherId, {
      requestId: String(request._id),
      friendshipStatus: status,
    });
  }

  return map;
};

const createMediaFromFile = (file) => {
  if (!file) return undefined;
  return {
    url: path.posix.join('/uploads/community', file.filename),
    mimeType: file.mimetype || '',
    originalName: file.originalname || '',
    size: Number(file.size || 0),
  };
};

const listUsers = async (req, res) => {
  try {
    const q = String(req.query?.q || '').trim();
    const role = String(req.query?.role || '').trim().toLowerCase();
    const page = parsePositiveInt(req.query?.page, 1, 1, 5000);
    const limit = parsePositiveInt(req.query?.limit, 10, 1, 50);

    const userQuery = {
      _id: { $ne: req.userId },
    };

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      userQuery.$or = [{ fullName: regex }, { email: regex }, { githubUsername: regex }];
    }

    if (role) {
      userQuery.role = role;
    }

    const total = await User.countDocuments(userQuery);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const users = await User.find(userQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('fullName email role githubUsername avatar');

    const userIds = users.map((user) => user._id);

    const friendRequests = userIds.length
      ? await FriendRequest.find({
          $or: [
            { requesterId: req.userId, recipientId: { $in: userIds } },
            { recipientId: req.userId, requesterId: { $in: userIds } },
          ],
        }).sort({ updatedAt: -1 })
      : [];

    const statusMap = buildFriendStatusMap(friendRequests, req.userId);

    const payloadUsers = users.map((user) => {
      const status = statusMap.get(String(user._id)) || {
        requestId: null,
        friendshipStatus: 'none',
      };

      return {
        ...toFriendUserPayload(user),
        requestId: status.requestId,
        friendshipStatus: status.friendshipStatus,
      };
    });

    return res.status(200).json({
      users: payloadUsers,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: {
        q,
        role: role || 'all',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const recipientId = String(req.params.userId || '').trim();
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient user id is required' });
    }

    if (sameId(recipientId, req.userId)) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    const recipient = await User.findById(recipientId).select(
      'fullName email role githubUsername avatar'
    );

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const sameDirection = await FriendRequest.findOne({
      requesterId: req.userId,
      recipientId,
    });

    if (sameDirection) {
      if (sameDirection.status === 'pending') {
        const hydrated = await sameDirection.populate([
          { path: 'requesterId', select: 'fullName email role githubUsername avatar' },
          { path: 'recipientId', select: 'fullName email role githubUsername avatar' },
        ]);
        return res.status(200).json({
          message: 'Friend request already sent',
          request: toFriendRequestPayload(hydrated, req.userId),
        });
      }

      if (sameDirection.status === 'accepted') {
        return res.status(409).json({ message: 'You are already friends' });
      }

      sameDirection.status = 'pending';
      await sameDirection.save();
      const hydrated = await sameDirection.populate([
        { path: 'requesterId', select: 'fullName email role githubUsername avatar' },
        { path: 'recipientId', select: 'fullName email role githubUsername avatar' },
      ]);
      return res.status(200).json({
        message: 'Friend request sent',
        request: toFriendRequestPayload(hydrated, req.userId),
      });
    }

    const inverse = await FriendRequest.findOne({
      requesterId: recipientId,
      recipientId: req.userId,
    });

    if (inverse) {
      if (inverse.status === 'pending') {
        return res.status(409).json({
          message: 'This user already sent you a friend request. Accept it from your requests list.',
        });
      }
      if (inverse.status === 'accepted') {
        return res.status(409).json({ message: 'You are already friends' });
      }
    }

    const created = await FriendRequest.create({
      requesterId: req.userId,
      recipientId,
      status: 'pending',
    });

    const hydrated = await created.populate([
      { path: 'requesterId', select: 'fullName email role githubUsername avatar' },
      { path: 'recipientId', select: 'fullName email role githubUsername avatar' },
    ]);

    return res.status(201).json({
      message: 'Friend request sent',
      request: toFriendRequestPayload(hydrated, req.userId),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to send friend request', error: error.message });
  }
};

const listFriendRequests = async (req, res) => {
  try {
    const incoming = await FriendRequest.find({
      recipientId: req.userId,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('requesterId', 'fullName email role githubUsername avatar')
      .populate('recipientId', 'fullName email role githubUsername avatar');

    const outgoing = await FriendRequest.find({
      requesterId: req.userId,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('requesterId', 'fullName email role githubUsername avatar')
      .populate('recipientId', 'fullName email role githubUsername avatar');

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ requesterId: req.userId }, { recipientId: req.userId }],
    })
      .sort({ updatedAt: -1 })
      .populate('requesterId', 'fullName email role githubUsername avatar')
      .populate('recipientId', 'fullName email role githubUsername avatar');

    const friends = accepted.map((requestDoc) => {
      const friendUser = sameId(requestDoc.requesterId?._id, req.userId)
        ? requestDoc.recipientId
        : requestDoc.requesterId;

      return {
        requestId: String(requestDoc._id),
        ...toFriendUserPayload(friendUser),
        since: requestDoc.updatedAt,
      };
    });

    return res.status(200).json({
      incoming: incoming.map((item) => toFriendRequestPayload(item, req.userId)),
      outgoing: outgoing.map((item) => toFriendRequestPayload(item, req.userId)),
      friends,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to load friend requests', error: error.message });
  }
};

const respondToFriendRequest = async (req, res) => {
  try {
    const action = String(req.body?.action || '').trim().toLowerCase();
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or reject' });
    }

    const requestDoc = await FriendRequest.findOne({
      _id: req.params.requestId,
      recipientId: req.userId,
      status: 'pending',
    });

    if (!requestDoc) {
      return res.status(404).json({ message: 'Pending friend request not found' });
    }

    requestDoc.status = action === 'accept' ? 'accepted' : 'rejected';
    await requestDoc.save();

    const hydrated = await requestDoc.populate([
      { path: 'requesterId', select: 'fullName email role githubUsername avatar' },
      { path: 'recipientId', select: 'fullName email role githubUsername avatar' },
    ]);

    return res.status(200).json({
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected',
      request: toFriendRequestPayload(hydrated, req.userId),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to respond to friend request', error: error.message });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const deleted = await FriendRequest.findOneAndDelete({
      _id: req.params.requestId,
      requesterId: req.userId,
      status: 'pending',
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Pending outgoing friend request not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to cancel friend request', error: error.message });
  }
};

const listPosts = async (req, res) => {
  try {
    const type = normalizeType(req.query?.type);
    const q = String(req.query?.q || '').trim();
    const page = parsePositiveInt(req.query?.page, 1, 1, 5000);
    const limit = parsePositiveInt(req.query?.limit, 10, 1, 50);
    const sort = normalizeSort(req.query?.sort);
    const scope = String(req.query?.scope || '').trim().toLowerCase();

    const query = {};
    if (type) query.type = type;
    if (scope === 'mine') query.ownerId = req.userId;

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      query.$or = [{ title: regex }, { content: regex }];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };
    if (sort === 'mostLiked') sortQuery = { likeCount: -1, createdAt: -1 };
    if (sort === 'mostCommented') sortQuery = { commentCount: -1, createdAt: -1 };

    const total = await CommunityPost.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const posts = await CommunityPost.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'fullName email role avatar');

    const postIds = posts.map((post) => post._id);
    const likes = postIds.length
      ? await CommunityPostLike.find({
          postId: { $in: postIds },
          ownerId: req.userId,
        }).select('postId')
      : [];

    const likedIds = new Set(likes.map((like) => String(like.postId)));

    return res.status(200).json({
      posts: posts.map((post) => toPostPayload(post, req.userId, likedIds)),
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: {
        type: type || null,
        q,
        scope: scope === 'mine' ? 'mine' : 'all',
        sort,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load posts', error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const type = normalizeType(req.body?.type);
    const content = String(req.body?.content || '').trim();
    const title = String(req.body?.title || '').trim();

    if (!type) {
      return res.status(400).json({ message: 'Post type must be blog or chat' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    if (type === 'blog' && !title) {
      return res.status(400).json({ message: 'Blog title is required' });
    }

    if (req.file && type !== 'blog') {
      return res.status(400).json({ message: 'Media upload is only supported for blog posts' });
    }

    const created = await CommunityPost.create({
      ownerId: req.userId,
      type,
      title,
      content,
      media: createMediaFromFile(req.file),
    });

    const hydrated = await created.populate('ownerId', 'fullName email role avatar');

    return res.status(201).json({
      post: toPostPayload(hydrated, req.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const updates = {};

    if (req.body?.title !== undefined) {
      updates.title = String(req.body.title || '').trim();
    }

    if (req.body?.content !== undefined) {
      updates.content = String(req.body.content || '').trim();
      if (!updates.content) {
        return res.status(400).json({ message: 'Post content is required' });
      }
    }

    const existing = await CommunityPost.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!existing) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if ((updates.title !== undefined || existing.type === 'blog') && existing.type === 'blog') {
      const nextTitle = updates.title !== undefined ? updates.title : existing.title;
      if (!String(nextTitle || '').trim()) {
        return res.status(400).json({ message: 'Blog title is required' });
      }
    }

    if (req.file) {
      if (existing.type !== 'blog') {
        return res.status(400).json({ message: 'Media upload is only supported for blog posts' });
      }
      updates.media = createMediaFromFile(req.file);
    }

    const removeMedia = String(req.body?.removeMedia || '').trim().toLowerCase() === 'true';
    if (removeMedia) {
      updates.media = {
        url: '',
        mimeType: '',
        originalName: '',
        size: 0,
      };
    }

    const updated = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      updates,
      { returnDocument: 'after', runValidators: true }
    ).populate('ownerId', 'fullName email role avatar');

    return res.status(200).json({
      post: toPostPayload(updated, req.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const deleted = await CommunityPost.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Promise.all([
      CommunityComment.deleteMany({ postId: deleted._id }),
      CommunityPostLike.deleteMany({ postId: deleted._id }),
    ]);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

const listComments = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId).select('_id');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await CommunityComment.find({ postId: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('ownerId', 'fullName email role avatar');

    return res.status(200).json({
      comments: comments.map((comment) => toCommentPayload(comment, req.userId)),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load comments', error: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId).select('_id');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const content = String(req.body?.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const created = await CommunityComment.create({
      postId: req.params.postId,
      ownerId: req.userId,
      content,
    });

    await CommunityPost.updateOne({ _id: req.params.postId }, { $inc: { commentCount: 1 } });

    const hydrated = await created.populate('ownerId', 'fullName email role avatar');

    return res.status(201).json({
      comment: toCommentPayload(hydrated, req.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const content = String(req.body?.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const updated = await CommunityComment.findOneAndUpdate(
      { _id: req.params.commentId, postId: req.params.postId, ownerId: req.userId },
      { content },
      { returnDocument: 'after', runValidators: true }
    ).populate('ownerId', 'fullName email role avatar');

    if (!updated) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    return res.status(200).json({
      comment: toCommentPayload(updated, req.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const deleted = await CommunityComment.findOneAndDelete({
      _id: req.params.commentId,
      postId: req.params.postId,
      ownerId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await CommunityPost.updateOne({ _id: req.params.postId }, { $inc: { commentCount: -1 } });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId).select('_id');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await CommunityPostLike.findOne({
      postId: req.params.postId,
      ownerId: req.userId,
    });

    let liked;
    if (existing) {
      await CommunityPostLike.deleteOne({ _id: existing._id });
      await CommunityPost.updateOne({ _id: req.params.postId }, { $inc: { likeCount: -1 } });
      liked = false;
    } else {
      await CommunityPostLike.create({
        postId: req.params.postId,
        ownerId: req.userId,
      });
      await CommunityPost.updateOne({ _id: req.params.postId }, { $inc: { likeCount: 1 } });
      liked = true;
    }

    const updatedPost = await CommunityPost.findById(req.params.postId).select('likeCount');
    const upvoteCount = Number(updatedPost?.likeCount || 0);

    return res.status(200).json({
      liked,
      isUpvoted: liked,
      likeCount: upvoteCount,
      upvoteCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

module.exports = {
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
};
