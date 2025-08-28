const mongoose = require("mongoose");

const PointRedemptionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    pointsUsed: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Feedback system
    feedback: {
      condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair', 'worn'],
        default: null
      },
      pointsAwarded: {
        type: Number,
        default: 0
      },
      feedbackGiven: {
        type: Boolean,
        default: false
      },
      feedbackDate: {
        type: Date,
        default: null
      }
    },
    // Transaction tracking
    transactionType: {
      type: String,
      enum: ['points_purchase', 'swap'],
      default: 'points_purchase'
    },
    // Related swap if this was originally a swap
    relatedSwap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap',
      default: null
    },
    // Item received confirmation
    itemReceived: {
      type: Boolean,
      default: false
    },
    itemReceivedDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
PointRedemptionSchema.index({ buyer: 1, status: 1 });
PointRedemptionSchema.index({ seller: 1, status: 1 });
PointRedemptionSchema.index({ item: 1 });

// Static method to calculate points based on feedback
PointRedemptionSchema.statics.calculatePointsForFeedback = function(condition) {
  const pointsMap = {
    'new': 60,
    'like_new': 50,
    'good': 40,
    'fair': 30,
    'worn': 20
  };
  return pointsMap[condition] || 0;
};

// Instance method to award points based on feedback
PointRedemptionSchema.methods.awardPointsForFeedback = async function(condition) {
  const User = mongoose.model('User');
  
  if (this.feedback.feedbackGiven) {
    throw new Error('Feedback already given for this transaction');
  }
  
  const pointsToAward = this.constructor.calculatePointsForFeedback(condition);
  
  // Update this redemption with feedback
  this.feedback.condition = condition;
  this.feedback.pointsAwarded = pointsToAward;
  this.feedback.feedbackGiven = true;
  this.feedback.feedbackDate = new Date();
  this.status = 'completed';
  
  await this.save();
  
  // Award points to seller
  await User.findByIdAndUpdate(
    this.seller,
    { $inc: { points: pointsToAward } }
  );
  
  return pointsToAward;
};

module.exports = mongoose.model("PointRedemption", PointRedemptionSchema);
