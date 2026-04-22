const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'organization', 'professional', 'super_admin'],
      default: 'student',
      index: true,
    },
    githubUsername: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    subscription: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium', 'pro'],
      default: 'free',
    },
    subscriptionBillingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    freePngCertificatesIssued: {
      type: Number,
      default: 0,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    dashboardMenu: {
      student: { type: String, default: 'overview' },
      organization: { type: String, default: 'overview' },
      professional: { type: String, default: 'overview' },
      instructor: { type: String, default: 'overview' },
    },
    totpEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      cipherText: { type: String, default: '' },
      iv: { type: String, default: '' },
      authTag: { type: String, default: '' },
    },
    totpPendingSecret: {
      cipherText: { type: String, default: '' },
      iv: { type: String, default: '' },
      authTag: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
