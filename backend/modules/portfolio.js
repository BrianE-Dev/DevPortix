const mongoose = require('mongoose');

const { Schema } = mongoose;

const assetSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: '', trim: true },
    size: { type: Number, default: 0 },
    dataUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const codeSnippetSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: 'Untitled snippet', trim: true },
    language: { type: String, default: 'javascript', trim: true },
    code: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const portfolioProjectSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    stack: { type: [String], default: [] },
  },
  { _id: false }
);

const timelineSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    organization: { type: String, default: '', trim: true },
    startDate: { type: String, default: '', trim: true },
    endDate: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, default: '', trim: true },
    issuer: { type: String, default: '', trim: true },
    issueDate: { type: String, default: '', trim: true },
    credentialUrl: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const portfolioSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    heroIntro: {
      title: { type: String, default: '', trim: true, maxlength: 160 },
      subtitle: { type: String, default: '', trim: true, maxlength: 240 },
      summary: { type: String, default: '', trim: true, maxlength: 1200 },
    },
    projects: {
      type: [portfolioProjectSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    timeline: {
      type: [timelineSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    contact: {
      email: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      location: { type: String, default: '', trim: true },
      website: { type: String, default: '', trim: true },
    },
    experienceLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    accent: {
      type: String,
      enum: ['blue', 'emerald', 'rose', 'amber', 'violet'],
      default: 'blue',
    },
    screenshots: {
      type: [assetSchema],
      default: [],
    },
    documents: {
      type: [assetSchema],
      default: [],
    },
    codeSnippets: {
      type: [codeSnippetSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
