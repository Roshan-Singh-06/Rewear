const Item = require("../models/Item.model");
const User = require("../models/User.model");
const Order = require("../models/Order.model");
const SystemConfig = require("../models/SystemConfig.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asynchandler");

// Get all users with details
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  
  let filter = {};
  
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    filter.role = role;
  }

  const skip = (page - 1) * limit;
  
  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select('-password -refresh_token -otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
    hasNext: page < Math.ceil(totalUsers / limit),
    hasPrev: page > 1
  };

  res.status(200).json(
    new ApiResponse(200, { users, pagination }, "Users retrieved successfully")
  );
});

// Delete user by ID
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === 'admin') {
    throw new ApiError(400, "Cannot delete admin users");
  }

  // Delete all related data (items, orders, etc.)
  await Promise.all([
    Item.deleteMany({ listedBy: id }),
    Order.deleteMany({ $or: [{ requester: id }, { responder: id }] }),
    User.findByIdAndDelete(id)
  ]);

  res.status(200).json(
    new ApiResponse(200, {}, "User and related data deleted successfully")
  );
});

// Get all items with details
const getAllItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  
  let filter = {};
  
  if (status) filter.status = status;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  
  const [items, totalItems] = await Promise.all([
    Item.find(filter)
      .populate('listedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Item.countDocuments(filter)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalItems / limit),
    totalItems,
    hasNext: page < Math.ceil(totalItems / limit),
    hasPrev: page > 1
  };

  res.status(200).json(
    new ApiResponse(200, { items, pagination }, "Items retrieved successfully")
  );
});

// Get all orders with details
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, orderType } = req.query;
  
  let filter = {};
  
  if (status) filter.status = status;
  if (orderType) filter.orderType = orderType;

  const skip = (page - 1) * limit;
  
  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .populate('requester', 'username email')
      .populate('responder', 'username email')
      .populate('itemOffered', 'title category pointsCost')
      .populate('itemRequested', 'title category pointsCost')
      .populate('item', 'title category pointsCost')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(filter)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
    hasNext: page < Math.ceil(totalOrders / limit),
    hasPrev: page > 1
  };

  res.status(200).json(
    new ApiResponse(200, { orders, pagination }, "Orders retrieved successfully")
  );
});

// Get current swap points configuration
const getSwapPoints = asyncHandler(async (req, res) => {
  const swapPoints = await SystemConfig.getConfig('swapPoints') || 25;
  const redemptionPoints = await SystemConfig.getConfig('redemptionPoints') || 25;
  
  res.status(200).json(
    new ApiResponse(200, { 
      swapPoints, 
      redemptionPoints 
    }, "Points configuration retrieved successfully")
  );
});

// Update swap points configuration
const updateSwapPoints = asyncHandler(async (req, res) => {
  const { swapPoints, redemptionPoints } = req.body;
  
  if (swapPoints !== undefined) {
    if (typeof swapPoints !== 'number' || swapPoints < 0) {
      throw new ApiError(400, "Swap points must be a non-negative number");
    }
    
    await SystemConfig.setConfig(
      'swapPoints', 
      swapPoints, 
      'Points awarded to both users for completing a swap',
      req.user._id
    );
  }
  
  if (redemptionPoints !== undefined) {
    if (typeof redemptionPoints !== 'number' || redemptionPoints < 0) {
      throw new ApiError(400, "Redemption points must be a non-negative number");
    }
    
    await SystemConfig.setConfig(
      'redemptionPoints', 
      redemptionPoints, 
      'Points awarded to item lister for point redemption',
      req.user._id
    );
  }

  const updatedConfig = {
    swapPoints: await SystemConfig.getConfig('swapPoints'),
    redemptionPoints: await SystemConfig.getConfig('redemptionPoints')
  };
  
  res.status(200).json(
    new ApiResponse(200, updatedConfig, "Points configuration updated successfully")
  );
});

// Approve item
const approveItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await Item.findById(id);
  
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  if (item.approved) {
    throw new ApiError(400, "Item is already approved");
  }

  const updatedItem = await Item.findByIdAndUpdate(
    id,
    { approved: true },
    { new: true }
  ).populate('listedBy', 'username email');

  res.status(200).json(
    new ApiResponse(200, updatedItem, "Item approved successfully")
  );
});

// Reject item
const rejectItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await Item.findById(id);
  
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  if (!item.approved) {
    throw new ApiError(400, "Item is already rejected/pending");
  }

  const updatedItem = await Item.findByIdAndUpdate(
    id,
    { approved: false },
    { new: true }
  ).populate('listedBy', 'username email');

  res.status(200).json(
    new ApiResponse(200, updatedItem, "Item rejected successfully")
  );
});

module.exports = {
  getAllUsers,
  deleteUser,
  getAllItems,
  getAllOrders,
  getSwapPoints,
  updateSwapPoints,
  approveItem,
  rejectItem,
};
