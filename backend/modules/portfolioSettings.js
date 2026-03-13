const mongoose = require('mongoose');

const { Schema } = mongoose;

const portfolioSettingsSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      default: 'minimal-dark',
      trim: true,
    },
    layout: {
      type: String,
      default: 'grid',
      trim: true,
    },
    visibleSections: {
      type: [String],
      default: ['hero', 'projects', 'skills', 'contact'],
    },
    customCSS: {
      type: String,
      default: '',
    },
    seoTitle: {
      type: String,
      default: 'My Developer Portfolio',
      trim: true,
      maxlength: 160,
    },
    seoDescription: {
      type: String,
      default: 'A portfolio built with DEVPORTIX',
      trim: true,
      maxlength: 320,
    },
    customDomain: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PortfolioSettings ||
  mongoose.model('PortfolioSettings', portfolioSettingsSchema);
