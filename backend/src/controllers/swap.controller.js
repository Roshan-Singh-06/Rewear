const Swap = require("../models/Swap.model");
const Item = require("../models/Item.model");
const User = require("../models/User.model");
const { createNotification } = require("./notification.controller");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asynchandler");

// Helper function to check exchange limits between users
const checkExchangeLimit = async (user1Id, user2Id) => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Find completed swaps between these two users in the last 2 weeks
  const recentSwaps = await Swap.find({
    status: 'completed',
    completedAt: { $gte: twoWeeksAgo },
    $or: [
      { requester: user1Id, responder: user2Id },
      { requester: user2Id, responder: user1Id }
    ]
  });

  return recentSwaps.length < 3; // Allow up to 3 swaps every 2 weeks
};

// Request a swap
const requestSwap = asyncHandler(async (req, res) => {
  const { itemOffered, itemRequested } = req.body;

  if (!itemOffered || !itemRequested) {
    throw new ApiError(400, "Both items are required for swap");
  }

  const offeredItem = await Item.findById(itemOffered);
  const requestedItem = await Item.findById(itemRequested);

  if (!offeredItem || !requestedItem) {
    throw new ApiError(404, "One or both items not found");
  }

  if (offeredItem.listedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only offer your own items");
  }

  if (requestedItem.listedBy.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot request your own item");
  }

  if (offeredItem.status !== 'available' || requestedItem.status !== 'available') {
    throw new ApiError(400, "Both items must be available for swap");
  }

  // Check exchange limits between users
  const canExchange = await checkExchangeLimit(req.user._id, requestedItem.listedBy);
  if (!canExchange) {
    throw new ApiError(400, "Exchange limit exceeded. You can only request/complete 3 swaps with the same user every 2 weeks.");
  }

  const swap = await Swap.create({
    itemOffered,
    itemRequested,
    requester: req.user._id,
    responder: requestedItem.listedBy,
  });

  // Update item statuses to pending
  await Item.findByIdAndUpdate(itemOffered, { status: 'pending' });
  await Item.findByIdAndUpdate(itemRequested, { status: 'pending' });

  // Add swap to both users
  await User.findByIdAndUpdate(req.user._id, { $push: { swaps: swap._id } });
  await User.findByIdAndUpdate(requestedItem.listedBy, { $push: { swaps: swap._id } });

  // Create notification for the responder
  try {
    console.log('Creating notification for swap request...');
    console.log('Recipient:', requestedItem.listedBy);
    console.log('Sender:', req.user._id);
    console.log('Current user info:', { username: req.user.username, fullName: req.user.fullName });
    
    const senderName = req.user.username || req.user.fullName || 'Someone';
    
    const notification = await createNotification({
      recipient: requestedItem.listedBy,
      sender: req.user._id,
      type: 'swap_request',
      title: 'New Swap Request',
      message: `${senderName} wants to swap "${offeredItem.title}" for your "${requestedItem.title}"`,
      swapId: swap._id,
      itemOffered: itemOffered,
      itemRequested: itemRequested,
    });
    
    console.log('Notification created successfully:', notification._id);
  } catch (notificationError) {
    console.error('Error creating notification:', notificationError);
    // Don't fail the swap request if notification fails
  }

  res.status(201).json(
    new ApiResponse(201, swap, "Swap request created successfully")
  );
});

// Get user's swaps
const getUserSwaps = asyncHandler(async (req, res) => {
  const swaps = await Swap.find({
    $or: [
      { requester: req.user._id },
      { responder: req.user._id }
    ]
  })
  .populate('itemOffered', 'title images category')
  .populate('itemRequested', 'title images category')
  .populate('requester', 'username email')
  .populate('responder', 'username email')
  .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, swaps, "Swaps retrieved successfully")
  );
});

// Get swap by ID
const getSwapById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const swap = await Swap.findById(id)
    .populate('itemOffered', 'title description images category subCategory size condition pointsCost status listedBy')
    .populate('itemRequested', 'title description images category subCategory size condition pointsCost status listedBy')
    .populate('requester', 'username fullName email')
    .populate('responder', 'username fullName email')
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

  if (!swap) {
    throw new ApiError(404, "Swap not found");
  }

  // Check if user is part of this swap
  if (swap.requester._id.toString() !== req.user._id.toString() && 
      swap.responder._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this swap");
  }

  res.status(200).json(
    new ApiResponse(200, swap, "Swap details retrieved successfully")
  );
});

// Accept swap
const acceptSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('=== ACCEPT SWAP API CALLED ===');
  console.log('Attempting to accept swap with ID:', id);
  console.log('User accepting:', req.user._id);
  console.log('User info:', { username: req.user.username, fullName: req.user.fullName });

  const swap = await Swap.findById(id);
  
  if (!swap) {
    console.log('❌ Swap not found');
    throw new ApiError(404, "Swap not found");
  }

  console.log('✅ Swap found - Current swap status:', swap.status);
  console.log('Swap responder:', swap.responder);
  console.log('Current user:', req.user._id);
  console.log('User is responder?', swap.responder.toString() === req.user._id.toString());

  if (swap.responder.toString() !== req.user._id.toString()) {
    console.log('❌ User is not the responder');
    throw new ApiError(403, "Only the responder can accept this swap");
  }

  // If already accepted, just send notification again
  if (swap.status === 'accepted') {
    console.log('Swap already accepted, sending notification...');
    
    // Create notification for the requester about acceptance
    try {
      const responderUser = await User.findById(swap.responder);
      const requestedItem = await Item.findById(swap.itemRequested);

      const responderName = responderUser.username || responderUser.fullName || 'Someone';
      
      const notification = await createNotification({
        recipient: swap.requester,
        sender: req.user._id,
        type: 'swap_accepted',
        title: 'Swap Request Accepted!',
        message: `${responderName} accepted your swap request for "${requestedItem.title}"`,
        swapId: swap._id,
        itemOffered: swap.itemOffered,
        itemRequested: swap.itemRequested,
      });
      
      console.log('Notification created for already accepted swap:', notification._id);
      
      return res.status(200).json(
        new ApiResponse(200, { swap }, "Swap already accepted, notification sent")
      );
    } catch (notificationError) {
      console.error('Error creating notification for accepted swap:', notificationError);
      return res.status(200).json(
        new ApiResponse(200, { swap }, "Swap already accepted")
      );
    }
  }

  if (swap.status !== 'pending') {
    console.log('Swap status is not pending, current status:', swap.status);
    throw new ApiError(400, `Swap is not in pending status. Current status: ${swap.status}`);
  }

  // Check exchange limits between users
  const canExchange = await checkExchangeLimit(swap.requester, swap.responder);
  if (!canExchange) {
    throw new ApiError(400, "Exchange limit exceeded. You can only complete 3 swaps with the same user every 2 weeks.");
  }

  console.log('Updating swap status to accepted...');
  swap.status = 'accepted';
  await swap.save();

  console.log('Swap accepted successfully, no order creation needed for basic swaps');

  // Create notification for the requester about acceptance
  try {
    console.log('Creating acceptance notification...');
    const requesterUser = await User.findById(swap.requester);
    const responderUser = await User.findById(swap.responder);
    const offeredItem = await Item.findById(swap.itemOffered);
    const requestedItem = await Item.findById(swap.itemRequested);

    console.log('Users and items loaded for notification:');
    console.log('- Requester:', requesterUser ? requesterUser.username || requesterUser.fullName : 'NOT FOUND');
    console.log('- Responder:', responderUser ? responderUser.username || responderUser.fullName : 'NOT FOUND');
    console.log('- Offered item:', offeredItem ? offeredItem.title : 'NOT FOUND');
    console.log('- Requested item:', requestedItem ? requestedItem.title : 'NOT FOUND');

    if (!requesterUser || !responderUser || !offeredItem || !requestedItem) {
      throw new Error('Missing required data for notification creation');
    }

    const responderName = responderUser.username || responderUser.fullName || 'Someone';
    
    console.log('Notification details:', {
      recipient: swap.requester,
      sender: req.user._id,
      responderName,
      itemTitle: requestedItem.title
    });

    const notification = await createNotification({
      recipient: swap.requester,
      sender: req.user._id,
      type: 'swap_accepted',
      title: 'Swap Request Accepted!',
      message: `${responderName} accepted your swap request for "${requestedItem.title}"`,
      swapId: swap._id,
      itemOffered: swap.itemOffered,
      itemRequested: swap.itemRequested,
    });
    
    console.log('Acceptance notification created successfully:', notification._id);
  } catch (notificationError) {
    console.error('Error creating acceptance notification:', notificationError);
    console.error('Notification error stack:', notificationError.stack);
    // Don't fail the swap acceptance if notification fails
  }

  console.log('Swap acceptance completed successfully');
  res.status(200).json(
    new ApiResponse(200, { swap }, "Swap accepted successfully, notification sent")
  );
});

// Reject swap
const rejectSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const swap = await Swap.findById(id);
  
  if (!swap) {
    throw new ApiError(404, "Swap not found");
  }

  if (swap.responder.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the responder can reject this swap");
  }

  if (swap.status !== 'pending') {
    throw new ApiError(400, "Swap is not in pending status");
  }

  swap.status = 'rejected';
  await swap.save();

  // Update item statuses back to available
  await Item.findByIdAndUpdate(swap.itemOffered, { status: 'available' });
  await Item.findByIdAndUpdate(swap.itemRequested, { status: 'available' });

  // Create notification for the requester about rejection
  try {
    console.log('Creating rejection notification...');
    const responderUser = await User.findById(swap.responder);
    const requestedItem = await Item.findById(swap.itemRequested);

    const responderName = responderUser.username || responderUser.fullName || 'Someone';
    
    console.log('Rejection notification details:', {
      recipient: swap.requester,
      sender: req.user._id,
      responderName,
      itemTitle: requestedItem.title
    });

    const notification = await createNotification({
      recipient: swap.requester,
      sender: req.user._id,
      type: 'swap_rejected',
      title: 'Swap Request Rejected',
      message: `${responderName} declined your swap request for "${requestedItem.title}"`,
      swapId: swap._id,
      itemOffered: swap.itemOffered,
      itemRequested: swap.itemRequested,
    });
    
    console.log('Rejection notification created successfully:', notification._id);
  } catch (notificationError) {
    console.error('Error creating rejection notification:', notificationError);
    // Don't fail the swap rejection if notification fails
  }

  res.status(200).json(
    new ApiResponse(200, swap, "Swap rejected successfully")
  );
});

// Complete swap
const completeSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const swap = await Swap.findById(id);
  
  if (!swap) {
    throw new ApiError(404, "Swap not found");
  }

  if (swap.requester.toString() !== req.user._id.toString() && 
      swap.responder.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not part of this swap");
  }

  if (swap.status !== 'accepted') {
    throw new ApiError(400, "Swap must be accepted before completion");
  }

  swap.status = 'completed';
  swap.completedAt = new Date();
  await swap.save();

  res.status(200).json(
    new ApiResponse(200, swap, "Swap completed successfully. Please use the order system for tracking and points.")
  );
});

// Test notification endpoint for debugging
const testNotification = asyncHandler(async (req, res) => {
  const { recipientId, type, title, message } = req.body;

  if (!recipientId || !type || !title || !message) {
    throw new ApiError(400, "recipientId, type, title, and message are required");
  }

  try {
    console.log('Creating test notification...');
    console.log('Test notification details:', {
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message
    });

    const notification = await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message,
    });
    
    console.log('Test notification created successfully:', notification._id);

    res.status(200).json(
      new ApiResponse(200, notification, "Test notification created successfully")
    );
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw new ApiError(500, "Failed to create test notification");
  }
});

module.exports = {
  requestSwap,
  getUserSwaps,
  getSwapById,
  acceptSwap,
  rejectSwap,
  completeSwap,
  testNotification,
};
