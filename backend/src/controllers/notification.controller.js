const Notification = require("../models/Notification.model");
const Feedback = require("../models/Feedback.model");
const Swap = require("../models/Swap.model");
const Item = require("../models/Item.model");
const User = require("../models/User.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asynchandler");

// Helper function to create notification
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user's notifications
const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  let filter = { recipient: req.user._id };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  const notifications = await Notification.find(filter)
    .populate('sender', 'username fullName profilePicture')
    .populate('itemOffered', 'title images category pointsCost')
    .populate('itemRequested', 'title images category pointsCost')
    .populate('relatedItem', 'title images category pointsCost')
    .populate('relatedUser', 'username fullName profilePicture')
    .populate('swapId', 'status')
    .populate('relatedSwap', 'status')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Check for existing feedback for each notification
  const notificationsWithFeedback = await Promise.all(
    notifications.map(async (notification) => {
      const notificationObj = notification.toObject();
      
      try {
        // For swap-related notifications, check feedback based on swap rather than notification
        if (['swap_accepted', 'swap_completed', 'feedback_received', 'feedback_request'].includes(notification.type) && notification.relatedSwap) {
          // Check if current user has given feedback for this swap
          const existingFeedback = await Feedback.findOne({
            fromUser: req.user._id,
            relatedSwap: notification.relatedSwap
          });
          
          notificationObj.feedbackGiven = !!existingFeedback;
          
          if (existingFeedback) {
            notificationObj.feedbackDate = existingFeedback.feedbackDate;
            notificationObj.feedbackCondition = existingFeedback.condition;
            notificationObj.pointsAwarded = existingFeedback.pointsAwarded;
          }
          
          // Determine who the other user is
          let otherUserId;
          if (notification.recipient.toString() === req.user._id.toString()) {
            otherUserId = notification.sender._id;
          } else if (notification.sender._id.toString() === req.user._id.toString()) {
            otherUserId = notification.recipient;
          }
          
          if (otherUserId) {
            // Check if other user has given feedback for this swap
            const counterFeedback = await Feedback.findOne({
              fromUser: otherUserId,
              relatedSwap: notification.relatedSwap
            });
            notificationObj.counterFeedbackGiven = !!counterFeedback;
            
            // Check swap completion status
            if (existingFeedback && counterFeedback) {
              const swap = await Swap.findById(notification.relatedSwap);
              notificationObj.swapCompleted = swap?.status === 'completed';
            }
          }
        } else {
          // For non-swap notifications, use the original logic
          const existingFeedback = await Feedback.findOne({
            fromUser: req.user._id,
            notification: notification._id
          });
          
          notificationObj.feedbackGiven = !!existingFeedback;
          
          if (existingFeedback) {
            notificationObj.feedbackDate = existingFeedback.feedbackDate;
            notificationObj.feedbackCondition = existingFeedback.condition;
            notificationObj.pointsAwarded = existingFeedback.pointsAwarded;
          }
        }
        
        console.log(`Notification ${notification._id} (${notification.type}): feedbackGiven = ${notificationObj.feedbackGiven}, counterFeedbackGiven = ${notificationObj.counterFeedbackGiven || false}, swapCompleted = ${notificationObj.swapCompleted || false}`);
      } catch (error) {
        console.error(`Error checking feedback for notification ${notification._id}:`, error);
        // Default to false if there's an error
        notificationObj.feedbackGiven = false;
        notificationObj.counterFeedbackGiven = false;
        notificationObj.swapCompleted = false;
      }
      
      return notificationObj;
    })
  );

  const totalNotifications = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user._id, 
    isRead: false 
  });

  res.status(200).json(
    new ApiResponse(200, {
      notifications: notificationsWithFeedback,
      totalNotifications,
      unreadCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalNotifications / limit)
    }, "Notifications retrieved successfully")
  );
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user._id, 
    isRead: false 
  });

  res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully")
  );
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json(
    new ApiResponse(200, {}, "All notifications marked as read")
  );
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: req.user._id
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Notification deleted successfully")
  );
});

// Get notification by ID with full details
const getNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user._id
  })
    .populate('sender', 'username fullName profilePicture email phoneNumber')
    .populate('itemOffered', 'title description images category subCategory size condition pointsCost status listedBy')
    .populate('itemRequested', 'title description images category subCategory size condition pointsCost status listedBy')
    .populate('swapId', 'status createdAt')
    .populate({
      path: 'itemOffered',
      populate: {
        path: 'listedBy',
        select: 'username fullName'
      }
    })
    .populate({
      path: 'itemRequested',
      populate: {
        path: 'listedBy',
        select: 'username fullName'
      }
    });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Mark as read when viewing details
  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  res.status(200).json(
    new ApiResponse(200, notification, "Notification details retrieved successfully")
  );
});

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationById,
};
