const mongoose = require('mongoose');

const { Schema } = mongoose;

const scoreItemSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    detail: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const scoreCategorySchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    items: { type: [scoreItemSchema], default: [] },
  },
  { _id: false }
);

const portfolioScoreSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['Elite', 'Strong', 'Promising', 'Developing', 'Needs Work'],
      required: true,
    },
    scoringVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    pillars: {
      projectQuality: { type: scoreCategorySchema, required: true },
      technicalEvidence: { type: scoreCategorySchema, required: true },
      professionalReadiness: { type: scoreCategorySchema, required: true },
      consistencyGrowth: { type: scoreCategorySchema, required: true },
      trustCompleteness: { type: scoreCategorySchema, required: true },
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    signals: {
      projectCount: { type: Number, default: 0, min: 0 },
      deployedProjectCount: { type: Number, default: 0, min: 0 },
      githubProjectCount: { type: Number, default: 0, min: 0 },
      featuredProjectCount: { type: Number, default: 0, min: 0 },
      portfolioProjectCount: { type: Number, default: 0, min: 0 },
      portfolioSkillCount: { type: Number, default: 0, min: 0 },
      quizTrackCount: { type: Number, default: 0, min: 0 },
      passedQuizTrackCount: { type: Number, default: 0, min: 0 },
      averageQuizPercentage: { type: Number, default: 0, min: 0, max: 100 },
      mentorshipReviewCount: { type: Number, default: 0, min: 0 },
      averageMentorshipScore: { type: Number, default: null, min: 0, max: 100 },
      lastActivityAt: { type: Date, default: null },
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PortfolioScore || mongoose.model('PortfolioScore', portfolioScoreSchema);
