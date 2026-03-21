const mongoose = require('mongoose');

const { Schema } = mongoose;

const mentorshipLinkSchema = new Schema(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const mentorshipAssignmentSchema = new Schema(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['assignment', 'project'],
      default: 'assignment',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    attachment: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      mimeType: {
        type: String,
        default: '',
        trim: true,
      },
      originalName: {
        type: String,
        default: '',
        trim: true,
      },
      size: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    remark: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    submission: {
      answer: {
        type: String,
        default: '',
        trim: true,
        maxlength: 5000,
      },
      attachment: {
        url: {
          type: String,
          default: '',
          trim: true,
        },
        mimeType: {
          type: String,
          default: '',
          trim: true,
        },
        originalName: {
          type: String,
          default: '',
          trim: true,
        },
        size: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

mentorshipAssignmentSchema.index({ instructorId: 1, studentId: 1, createdAt: -1 });
mentorshipAssignmentSchema.index({ studentId: 1, type: 1, updatedAt: -1 });

const MentorshipLink =
  mongoose.models.MentorshipLink || mongoose.model('MentorshipLink', mentorshipLinkSchema);

const MentorshipAssignment =
  mongoose.models.MentorshipAssignment ||
  mongoose.model('MentorshipAssignment', mentorshipAssignmentSchema);

module.exports = {
  MentorshipLink,
  MentorshipAssignment,
};
