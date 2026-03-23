const mongoose = require('mongoose');

const { Schema } = mongoose;

const otpTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'registration',
    },
    codeHash: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpTokenSchema.index({ email: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.models.OtpToken || mongoose.model('OtpToken', otpTokenSchema);
