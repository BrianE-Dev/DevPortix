const mongoose = require('mongoose');

const { Schema } = mongoose;

const communityMessageSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
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

module.exports =
  mongoose.models.CommunityMessage ||
  mongoose.model('CommunityMessage', communityMessageSchema);
