const mongoose = require('mongoose');

const { Schema } = mongoose;

const communityPostSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['blog', 'chat'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    media: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      mimeType: {
        type: String,
        default: '',
        trim: true,
      },
      originalName: {
        type: String,
        default: '',
        trim: true,
      },
      size: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const communityCommentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

const communityPostLikeSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    guestId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

communityPostLikeSchema.index(
  { postId: 1, ownerId: 1 },
  { unique: true, partialFilterExpression: { ownerId: { $type: 'objectId' } } }
);
communityPostLikeSchema.index(
  { postId: 1, guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string', $ne: '' } } }
);

const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model('CommunityPost', communityPostSchema);

const CommunityComment =
  mongoose.models.CommunityComment ||
  mongoose.model('CommunityComment', communityCommentSchema);

const CommunityPostLike =
  mongoose.models.CommunityPostLike ||
  mongoose.model('CommunityPostLike', communityPostLikeSchema);

module.exports = {
  CommunityPost,
  CommunityComment,
  CommunityPostLike,
};
