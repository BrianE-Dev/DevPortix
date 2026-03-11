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
