const mongoose = require('mongoose');

const { Schema } = mongoose;

const quizAnswerSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    selectedIndex: {
      type: Number,
      required: true,
      min: -1,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    track: {
      type: String,
      enum: ['html', 'css', 'javascript', 'react'],
      required: true,
      index: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    answers: {
      type: [quizAnswerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

quizAttemptSchema.index({ ownerId: 1, track: 1, createdAt: -1 });

module.exports =
  mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);
