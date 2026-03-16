const mongoose = require('mongoose');

const { Schema } = mongoose;

const otpSchema = new Schema(
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
      enum: ['registration'],
      default: 'registration',
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
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
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.EmailOtp || mongoose.model('EmailOtp', otpSchema);
