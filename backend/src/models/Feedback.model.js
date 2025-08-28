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
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['swap', 'order'],
      required: true
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'worn'],
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    pointsAwarded: {
      type: Number,
      required: true
    },
    feedbackDate: {
      type: Date,
      default: Date.now
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
