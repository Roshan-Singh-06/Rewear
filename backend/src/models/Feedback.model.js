const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedSwap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap',
      default: null
    },
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null
    },
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'worn'],
      required: true
    },
    pointsAwarded: {
      type: Number,
      required: true
    },
    feedbackDate: {
      type: Date,
      default: Date.now
    },
    // Track what type of transaction this feedback is for
    feedbackType: {
      type: String,
      enum: ['swap', 'purchase'],
      default: 'swap'
    }
  },
  { timestamps: true }
);

// Create compound index to ensure one feedback per fromUser-toUser-notification combination
FeedbackSchema.index({ fromUser: 1, toUser: 1, notification: 1 }, { unique: true });

// Index for efficient queries
FeedbackSchema.index({ fromUser: 1 });
FeedbackSchema.index({ toUser: 1 });
FeedbackSchema.index({ relatedItem: 1 });
FeedbackSchema.index({ relatedSwap: 1 });
FeedbackSchema.index({ notification: 1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
