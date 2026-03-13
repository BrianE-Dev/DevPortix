const mongoose = require('mongoose');

const { Schema } = mongoose;

const friendRequestSchema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

module.exports =
  mongoose.models.FriendRequest ||
  mongoose.model('FriendRequest', friendRequestSchema);
