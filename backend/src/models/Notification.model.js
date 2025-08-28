const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'feedback_received', 'feedback_request', 'points_purchase_request', 'points_purchase_accepted', 'points_purchase_rejected', 'item_received_confirmation'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap',
    },
    itemOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
    itemRequested: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Additional fields for better notification handling
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedSwap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap',
    },
    relatedPointsPurchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PointRedemption',
    },
    relatedNotification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
    },
    // Feedback tracking
    feedbackGiven: {
      type: Boolean,
      default: false,
    },
    feedbackDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
