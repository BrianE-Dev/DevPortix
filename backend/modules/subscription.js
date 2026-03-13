const mongoose = require('mongoose');

const { Schema } = mongoose;
const PLAN_LIMITS = {
  free: 4,
  basic: 20,
  standard: 100,
  premium: 250,
};

const subscriptionSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium', 'pro'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled'],
      default: 'active',
    },
    projectLimit: {
      type: Number,
      default: PLAN_LIMITS.free,
      min: 0,
    },
    studentLimit: {
      type: Number,
      default: PLAN_LIMITS.free,
      min: 0,
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    providerCustomerId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.pre('save', function setPlanLimit() {
  const normalizedPlan = String(this.plan || 'free').trim().toLowerCase();
  const normalizedAlias = normalizedPlan === 'pro' ? 'premium' : normalizedPlan;
  const limit = PLAN_LIMITS[normalizedAlias] || PLAN_LIMITS.free;
  this.plan = normalizedAlias;
  this.projectLimit = limit;
  this.studentLimit = limit;
});

module.exports =
  mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
