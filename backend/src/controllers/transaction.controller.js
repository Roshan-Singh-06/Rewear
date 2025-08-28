const PointRedemption = require("../models/PointRedemption.model");
const User = require("../models/User.model");
const Item = require("../models/Item.model");
const Notification = require("../models/Notification.model");
const Feedback = require("../models/Feedback.model");
const Swap = require("../models/Swap.model");
const apiResponse = require("../utils/apiResponse");
const apiError = require("../utils/apiError");
const asyncHandler = require("../utils/asynchandler");

// Create a points purchase request
const createPointsPurchase = asyncHandler(async (req, res) => {
  const { itemId, pointsOffered } = req.body;
  const buyerId = req.user._id;

  // Validate item exists and is available
  const item = await Item.findById(itemId).populate('user');
  if (!item) {
    throw new apiError(404, "Item not found");
  }

  if (!item.availableForPurchase) {
    throw new apiError(400, "Item is not available for purchase");
  }

  if (item.user._id.toString() === buyerId.toString()) {
    throw new apiError(400, "Cannot purchase your own item");
  }

  // Check if buyer has enough points
  const buyer = await User.findById(buyerId);
  if (buyer.rewardPoints < pointsOffered) {
    throw new apiError(400, "Insufficient points");
  }

  // Create the purchase request
  const purchase = new PointRedemption({
    buyer: buyerId,
    seller: item.user._id,
    item: itemId,
    pointsUsed: pointsOffered,
    status: 'pending',
    transactionType: 'points_purchase'
  });

  await purchase.save();

  // Create notification for seller
  await Notification.create({
    recipient: item.user._id,
    sender: buyerId,
    type: 'points_purchase_request',
    title: 'New Points Purchase Request',
    message: `${buyer.name} wants to purchase your "${item.name}" for ${pointsOffered} points`,
    relatedItem: itemId,
    relatedUser: buyerId,
    relatedPointsPurchase: purchase._id
  });

  res.status(201).json(
    new apiResponse(201, purchase, "Points purchase request created successfully")
  );
});

// Accept or reject points purchase
const respondToPointsPurchase = asyncHandler(async (req, res) => {
  const { purchaseId } = req.params;
  const { action } = req.body; // 'accept' or 'reject'
  const sellerId = req.user._id;

  const purchase = await PointRedemption.findById(purchaseId)
    .populate('buyer', 'name')
    .populate('item', 'name');

  if (!purchase) {
    throw new apiError(404, "Purchase request not found");
  }

  if (purchase.seller.toString() !== sellerId.toString()) {
    throw new apiError(403, "Not authorized to respond to this purchase request");
  }

  if (purchase.status !== 'pending') {
    throw new apiError(400, "Purchase request already processed");
  }

  if (action === 'accept') {
    // Deduct points from buyer
    await User.findByIdAndUpdate(
      purchase.buyer._id,
      { $inc: { rewardPoints: -purchase.pointsUsed } }
    );

    // Mark item as sold
    await Item.findByIdAndUpdate(
      purchase.item._id,
      { 
        availableForSwap: false,
        availableForPurchase: false,
        status: 'sold'
      }
    );

    purchase.status = 'accepted';
    
    // Create notification for buyer
    await Notification.create({
      recipient: purchase.buyer._id,
      sender: sellerId,
      type: 'points_purchase_accepted',
      title: 'Purchase Request Accepted',
      message: `Your purchase request for "${purchase.item.name}" has been accepted! Please confirm when you receive the item.`,
      relatedItem: purchase.item._id,
      relatedUser: sellerId,
      relatedPointsPurchase: purchase._id
    });

  } else if (action === 'reject') {
    purchase.status = 'rejected';
    
    // Create notification for buyer
    await Notification.create({
      recipient: purchase.buyer._id,
      sender: sellerId,
      type: 'points_purchase_rejected',
      title: 'Purchase Request Rejected',
      message: `Your purchase request for "${purchase.item.name}" has been rejected.`,
      relatedItem: purchase.item._id,
      relatedUser: sellerId,
      relatedPointsPurchase: purchase._id
    });
  }

  await purchase.save();

  res.json(
    new apiResponse(200, purchase, `Purchase request ${action}ed successfully`)
  );
});

// Mark item as received
const markItemReceived = asyncHandler(async (req, res) => {
  const { purchaseId } = req.params;
  const buyerId = req.user._id;

  const purchase = await PointRedemption.findById(purchaseId)
    .populate('seller', 'name')
    .populate('item', 'name');

  if (!purchase) {
    throw new apiError(404, "Purchase not found");
  }

  if (purchase.buyer.toString() !== buyerId.toString()) {
    throw new apiError(403, "Not authorized to mark this item as received");
  }

  if (purchase.status !== 'accepted') {
    throw new apiError(400, "Purchase must be accepted first");
  }

  if (purchase.itemReceived) {
    throw new apiError(400, "Item already marked as received");
  }

  purchase.itemReceived = true;
  purchase.itemReceivedDate = new Date();
  await purchase.save();

  // Create notification for seller
  await Notification.create({
    recipient: purchase.seller._id,
    sender: buyerId,
    type: 'item_received_confirmation',
    title: 'Item Received',
    message: `${req.user.name} has confirmed receiving "${purchase.item.name}". They can now provide feedback.`,
    relatedItem: purchase.item._id,
    relatedUser: buyerId,
    relatedPointsPurchase: purchase._id
  });

  res.json(
    new apiResponse(200, purchase, "Item marked as received successfully")
  );
});

// Simple feedback submission for notifications
const submitFeedbackSimple = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const { condition } = req.body;
  const fromUserId = req.user._id;

  console.log(`Feedback submission attempt - Notification: ${notificationId}, From User: ${fromUserId}, Condition: ${condition}`);

  // Find the notification to get related info
  const notification = await Notification.findById(notificationId)
    .populate('sender')
    .populate('relatedItem')
    .populate('relatedSwap');
  
  if (!notification) {
    console.log(`Notification not found: ${notificationId}`);
    throw new apiError(404, "Notification not found");
  }

  // Determine who is giving feedback to whom and validate permissions
  let toUserId;
  let feedbackType = 'swap';
  let relatedSwap = notification.relatedSwap?._id || null;
  let relatedItem = notification.relatedItem?._id || null;

  // Only allow feedback for swap_accepted notifications (swap completion)
  if (notification.type === 'swap_accepted') {
    // If current user is the recipient, they're giving feedback to the sender
    if (notification.recipient.toString() === fromUserId.toString()) {
      toUserId = notification.sender._id;
    }
    // If current user is the sender, they're giving feedback to the recipient
    else if (notification.sender._id.toString() === fromUserId.toString()) {
      toUserId = notification.recipient;
    } else {
      throw new apiError(403, "You are not authorized to give feedback for this notification");
    }
  } else {
    throw new apiError(400, "Feedback can only be given for completed swaps (swap_accepted notifications)");
  }

  console.log(`Feedback direction - From: ${fromUserId}, To: ${toUserId}`);

  // Check if user has already given feedback for this swap
  const existingFeedback = await Feedback.findOne({
    fromUser: fromUserId,
    relatedSwap: relatedSwap
  });

  if (existingFeedback) {
    console.log(`User has already given feedback for this swap: ${existingFeedback._id}`);
    throw new apiError(400, "You have already given feedback for this swap");
  }

  // Get points for the condition
  const pointsMap = {
    'new': 60,
    'like_new': 50,
    'good': 40,
    'fair': 30,
    'worn': 20
  };
  const pointsAwarded = pointsMap[condition] || 40;

  console.log(`Points to award: ${pointsAwarded}`);

  try {
    // Create feedback record
    const feedbackData = {
      fromUser: fromUserId,
      toUser: toUserId,
      relatedSwap: relatedSwap,
      relatedItem: relatedItem,
      notification: notificationId,
      condition: condition,
      pointsAwarded: pointsAwarded,
      feedbackType: feedbackType
    };

    console.log(`Creating feedback with data: ${JSON.stringify(feedbackData)}`);
    
    const feedback = await Feedback.create(feedbackData);
    console.log(`Feedback created successfully: ${feedback._id}`);

    // Mark feedback as given in the notification (for the current user)
    await Notification.findByIdAndUpdate(notificationId, {
      feedbackGiven: true,
      feedbackDate: new Date()
    });
    console.log(`Notification updated with feedback status`);

    // Award points to the recipient of the feedback
    const updatedUser = await User.findByIdAndUpdate(
      toUserId,
      { $inc: { points: pointsAwarded } },
      { new: true }
    );
    console.log(`Points awarded to user. New balance: ${updatedUser.points}`);

    // Check if both users have given feedback for this swap
    const counterFeedback = await Feedback.findOne({
      fromUser: toUserId,
      toUser: fromUserId,
      relatedSwap: relatedSwap
    });

    if (counterFeedback) {
      // Both users have given feedback, mark swap as completed
      await Swap.findByIdAndUpdate(relatedSwap, {
        status: 'completed',
        completedAt: new Date()
      });
      console.log(`Swap ${relatedSwap} marked as completed - both feedbacks received`);

      // Create completion notification for both users
      const completionMessage = "Swap completed! Both users have provided feedback.";
      
      await Notification.create({
        recipient: toUserId,
        sender: fromUserId,
        type: 'swap_completed',
        title: 'Swap Completed!',
        message: completionMessage,
        relatedSwap: relatedSwap,
        relatedItem: relatedItem
      });

      await Notification.create({
        recipient: fromUserId,
        sender: toUserId,
        type: 'swap_completed',
        title: 'Swap Completed!',
        message: completionMessage,
        relatedSwap: relatedSwap,
        relatedItem: relatedItem
      });
    } else {
      // Only one feedback given, create notification for the other user to give feedback
      await Notification.create({
        recipient: toUserId,
        sender: fromUserId,
        type: 'feedback_request',
        title: 'Feedback Request',
        message: `${req.user.name} has rated you "${condition}" and you earned ${pointsAwarded} points! Please rate them back to complete the swap.`,
        relatedUser: fromUserId,
        relatedSwap: relatedSwap,
        relatedItem: relatedItem
      });
    }

    console.log(`Feedback submission completed successfully`);
    res.json(
      new apiResponse(200, { 
        pointsAwarded, 
        feedbackId: feedback._id,
        swapCompleted: !!counterFeedback
      }, "Feedback submitted successfully")
    );
  } catch (error) {
    console.error(`Error in feedback submission: ${error.message}`);
    throw new apiError(500, `Failed to submit feedback: ${error.message}`);
  }
});

// Submit feedback and award points
const submitFeedback = asyncHandler(async (req, res) => {
  const { purchaseId } = req.params;
  const { condition } = req.body;
  const buyerId = req.user._id;

  const purchase = await PointRedemption.findById(purchaseId)
    .populate('seller', 'name')
    .populate('item', 'name');

  if (!purchase) {
    throw new apiError(404, "Purchase not found");
  }

  if (purchase.buyer.toString() !== buyerId.toString()) {
    throw new apiError(403, "Not authorized to provide feedback for this purchase");
  }

  if (!purchase.itemReceived) {
    throw new apiError(400, "Must mark item as received before providing feedback");
  }

  if (purchase.feedback.feedbackGiven) {
    throw new apiError(400, "Feedback already provided for this purchase");
  }

  // Award points based on feedback
  const pointsAwarded = await purchase.awardPointsForFeedback(condition);

  // Create notification for seller
  await Notification.create({
    recipient: purchase.seller._id,
    sender: buyerId,
    type: 'feedback_received',
    title: 'Feedback Received',
    message: `${req.user.name} rated "${purchase.item.name}" as "${condition}" and you earned ${pointsAwarded} points!`,
    relatedItem: purchase.item._id,
    relatedUser: buyerId,
    relatedPointsPurchase: purchase._id
  });

  res.json(
    new apiResponse(200, { purchase, pointsAwarded }, "Feedback submitted successfully")
  );
});

// Get user's transactions (purchases and sales)
const getUserTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query; // 'purchases', 'sales', or 'all'

  let query = {};
  
  if (type === 'purchases') {
    query.buyer = userId;
  } else if (type === 'sales') {
    query.seller = userId;
  } else {
    query = {
      $or: [
        { buyer: userId },
        { seller: userId }
      ]
    };
  }

  const transactions = await PointRedemption.find(query)
    .populate('buyer', 'name')
    .populate('seller', 'name')
    .populate('item', 'name images price')
    .sort({ createdAt: -1 });

  res.json(
    new apiResponse(200, transactions, "Transactions retrieved successfully")
  );
});

// Get transaction details
const getTransactionDetails = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  const transaction = await PointRedemption.findById(transactionId)
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .populate('item')
    .populate('relatedSwap');

  if (!transaction) {
    throw new apiError(404, "Transaction not found");
  }

  // Check if user is involved in this transaction
  if (transaction.buyer._id.toString() !== userId.toString() && 
      transaction.seller._id.toString() !== userId.toString()) {
    throw new apiError(403, "Not authorized to view this transaction");
  }

  res.json(
    new apiResponse(200, transaction, "Transaction details retrieved successfully")
  );
});

// Get pending purchases for seller
const getPendingPurchases = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const pendingPurchases = await PointRedemption.find({
    seller: sellerId,
    status: 'pending'
  })
    .populate('buyer', 'name')
    .populate('item', 'name images')
    .sort({ createdAt: -1 });

  res.json(
    new apiResponse(200, pendingPurchases, "Pending purchases retrieved successfully")
  );
});

// Test endpoint to check feedback data (for debugging)
const getAllFeedback = asyncHandler(async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .populate('buyer', 'username fullName')
      .populate('seller', 'username fullName')
      .populate('item', 'title')
      .populate('notification', 'title type')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${feedbacks.length} feedback entries`);
    
    res.json(
      new apiResponse(200, feedbacks, "Feedback data retrieved successfully")
    );
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.json(
      new apiResponse(500, [], "Error fetching feedback data")
    );
  }
});

module.exports = {
  createPointsPurchase,
  respondToPointsPurchase,
  markItemReceived,
  submitFeedback,
  submitFeedbackSimple,
  getUserTransactions,
  getTransactionDetails,
  getPendingPurchases,
  getAllFeedback
};
