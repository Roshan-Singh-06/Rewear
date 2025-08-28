import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import User from '../models/User.model.js';
import Swap from '../models/Swap.model.js';

/**
 * Get chat between two users or create if doesn't exist
 */
const getOrCreateChat = asyncHandler(async (req, res) => {
  const { otherUserId, swapId } = req.body;
  const currentUserId = req.user._id;

  if (!otherUserId) {
    throw new ApiError(400, 'Other user ID is required');
  }

  if (otherUserId === currentUserId.toString()) {
    throw new ApiError(400, 'Cannot create chat with yourself');
  }

  // Verify other user exists
  const otherUser = await User.findById(otherUserId).select('username fullName');
  if (!otherUser) {
    throw new ApiError(404, 'User not found');
  }

  let relatedSwap = null;
  if (swapId) {
    relatedSwap = await Swap.findById(swapId);
    if (!relatedSwap) {
      throw new ApiError(404, 'Swap not found');
    }
    
    // Verify user is part of the swap
    const isParticipant = relatedSwap.requester.toString() === currentUserId.toString() ||
                         relatedSwap.owner.toString() === currentUserId.toString() ||
                         relatedSwap.requester.toString() === otherUserId ||
                         relatedSwap.owner.toString() === otherUserId;
    
    if (!isParticipant) {
      throw new ApiError(403, 'Not authorized to access this swap chat');
    }
  }

  const chat = await Chat.findOrCreateChat(currentUserId, otherUserId, relatedSwap?._id);

  return res.status(200).json(
    new ApiResponse(200, chat, 'Chat retrieved successfully')
  );
});

/**
 * Get all chats for current user
 */
const getUserChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const chats = await Chat.find({
    participants: currentUserId,
    status: 'active'
  })
  .populate([
    { 
      path: 'participants', 
      select: 'username fullName avatar email',
      match: { _id: { $ne: currentUserId } }
    },
    { 
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username fullName'
      }
    },
    { 
      path: 'relatedSwap',
      select: 'status itemOffered itemRequested',
      populate: [
        { path: 'itemOffered', select: 'title images' },
        { path: 'itemRequested', select: 'title images' }
      ]
    }
  ])
  .sort({ lastActivity: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  // Format chats for frontend
  const formattedChats = chats.map(chat => ({
    _id: chat._id,
    chatId: chat.chatId,
    otherParticipant: chat.participants[0], // After filtering, only other participant remains
    lastMessage: chat.lastMessage,
    lastActivity: chat.lastActivity,
    unreadCount: chat.unreadCounts.get(currentUserId.toString()) || 0,
    relatedSwap: chat.relatedSwap,
    metadata: chat.metadata
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      chats: formattedChats,
      totalChats: await Chat.countDocuments({
        participants: currentUserId,
        status: 'active'
      })
    }, 'Chats retrieved successfully')
  );
});

/**
 * Get messages in a chat
 */
const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const currentUserId = req.user._id;

  // Verify user is part of the chat
  const chat = await Chat.findOne({
    chatId,
    participants: currentUserId
  });

  if (!chat) {
    throw new ApiError(404, 'Chat not found or access denied');
  }

  const messages = await Message.find({
    chatId,
    isDeleted: false
  })
  .populate([
    { path: 'sender', select: 'username fullName avatar' },
    { path: 'replyTo', select: 'content sender createdAt' }
  ])
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  // Mark messages as read for current user
  await Message.updateMany(
    {
      chatId,
      receiver: currentUserId,
      isRead: false
    },
    { 
      isRead: true,
      isDelivered: true
    }
  );

  // Reset unread count for current user
  await chat.resetUnreadCount(currentUserId);

  return res.status(200).json(
    new ApiResponse(200, {
      messages: messages.reverse(), // Return in chronological order
      totalMessages: await Message.countDocuments({
        chatId,
        isDeleted: false
      })
    }, 'Messages retrieved successfully')
  );
});

/**
 * Send a message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, type = 'text', replyTo } = req.body;
  const currentUserId = req.user._id;

  if (!chatId || !content?.trim()) {
    throw new ApiError(400, 'Chat ID and message content are required');
  }

  // Verify user is part of the chat
  const chat = await Chat.findOne({
    chatId,
    participants: currentUserId
  }).populate('participants', 'username fullName');

  if (!chat) {
    throw new ApiError(404, 'Chat not found or access denied');
  }

  // Get receiver (other participant)
  const receiver = chat.getOtherParticipant(currentUserId);
  if (!receiver) {
    throw new ApiError(404, 'Receiver not found');
  }

  // Create message
  const message = new Message({
    content: content.trim(),
    type,
    sender: currentUserId,
    receiver: receiver._id,
    chatId,
    replyTo: replyTo || null,
    relatedSwap: chat.relatedSwap
  });

  await message.save();
  await message.populate([
    { path: 'sender', select: 'username fullName avatar' },
    { path: 'replyTo', select: 'content sender createdAt' }
  ]);

  // Update chat's last message and increment unread count for receiver
  await chat.updateLastMessage(message._id);
  await chat.incrementUnreadCount(receiver._id);

  // Emit to WebSocket (will be handled by WebSocket service)
  req.app.get('io')?.to(chatId).emit('newMessage', {
    message,
    chatId,
    receiverId: receiver._id.toString()
  });

  return res.status(201).json(
    new ApiResponse(201, message, 'Message sent successfully')
  );
});

/**
 * Mark message as read
 */
const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await Message.findOne({
    _id: messageId,
    receiver: currentUserId
  });

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  await message.markAsRead();

  // Emit read receipt
  req.app.get('io')?.to(message.chatId).emit('messageRead', {
    messageId: message._id,
    chatId: message.chatId,
    readBy: currentUserId
  });

  return res.status(200).json(
    new ApiResponse(200, message, 'Message marked as read')
  );
});

/**
 * Delete a message
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await Message.findOne({
    _id: messageId,
    sender: currentUserId
  });

  if (!message) {
    throw new ApiError(404, 'Message not found or not authorized');
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  // Emit message deletion
  req.app.get('io')?.to(message.chatId).emit('messageDeleted', {
    messageId: message._id,
    chatId: message.chatId
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'Message deleted successfully')
  );
});

/**
 * Get unread message count for user
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const totalUnread = await Message.countDocuments({
    receiver: currentUserId,
    isRead: false,
    isDeleted: false
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount: totalUnread }, 'Unread count retrieved successfully')
  );
});

/**
 * Search messages
 */
const searchMessages = asyncHandler(async (req, res) => {
  const { query, chatId } = req.query;
  const currentUserId = req.user._id;

  if (!query?.trim()) {
    throw new ApiError(400, 'Search query is required');
  }

  const searchFilter = {
    content: { $regex: query.trim(), $options: 'i' },
    isDeleted: false,
    $or: [
      { sender: currentUserId },
      { receiver: currentUserId }
    ]
  };

  if (chatId) {
    searchFilter.chatId = chatId;
  }

  const messages = await Message.find(searchFilter)
    .populate([
      { path: 'sender', select: 'username fullName avatar' },
      { path: 'receiver', select: 'username fullName' }
    ])
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(
    new ApiResponse(200, messages, 'Messages found successfully')
  );
});

export {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages
};
