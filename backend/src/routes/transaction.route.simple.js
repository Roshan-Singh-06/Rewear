const express = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const PointRedemption = require("../models/PointRedemption.model");
const User = require("../models/User.model");
const Item = require("../models/Item.model");
const Notification = require("../models/Notification.model");
const asyncHandler = require("../utils/asynchandler");
const apiResponse = require("../utils/apiResponse");
const apiError = require("../utils/apiError");

const router = express.Router();

// Test route (no auth required)
router.get("/test", (req, res) => {
  res.json({ message: "Transaction routes working" });
});

// All routes below require authentication
router.use(verifyJWT);

// Create a points purchase request
router.post("/purchase", asyncHandler(async (req, res) => {
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
    user: item.user._id,
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
}));

// Mark item as received
router.patch("/purchase/:purchaseId/received", asyncHandler(async (req, res) => {
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
    user: purchase.seller._id,
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
}));

// Simple feedback submission from notifications
router.post("/feedback/:notificationId", asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const { condition } = req.body;
  const buyerId = req.user._id;

  // Find the notification to get seller info
  const notification = await Notification.findById(notificationId).populate('sender');
  if (!notification) {
    throw new apiError(404, "Notification not found");
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

  // Award points to the notification sender (seller)
  if (notification.sender) {
    await User.findByIdAndUpdate(
      notification.sender._id,
      { $inc: { points: pointsAwarded } }
    );

    // Create feedback notification for seller
    await Notification.create({
      recipient: notification.sender._id,
      sender: buyerId,
      type: 'feedback_received',
      title: 'Feedback Received!',
      message: `You received "${condition}" rating and earned ${pointsAwarded} points!`,
      relatedUser: buyerId,
      relatedNotification: notificationId
    });
  }

  res.json(
    new apiResponse(200, { pointsAwarded }, "Feedback submitted successfully")
  );
}));

// Submit feedback and award points
router.post("/purchase/:purchaseId/feedback", asyncHandler(async (req, res) => {
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
    user: purchase.seller._id,
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
}));

// Get user transactions
router.get("/transactions", asyncHandler(async (req, res) => {
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
}));

module.exports = router;
