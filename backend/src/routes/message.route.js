const express = require('express');
const mongoose = require('mongoose');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();

console.log('verifyJWT loaded:', typeof verifyJWT);

// Message Schema (inline for CommonJS compatibility)
const messageSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: String, required: true, index: true },
  relatedSwap: { type: mongoose.Schema.Types.ObjectId, ref: 'Swap', default: null },
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Chat Schema
const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  relatedSwap: { type: mongoose.Schema.Types.ObjectId, ref: 'Swap', default: null },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  lastActivity: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

// Models
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

// Helper function to generate chat ID
const generateChatId = (userId1, userId2) => {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

// Get or create chat
router.post('/chat', verifyJWT, async (req, res) => {
  try {
    const { otherUserId, swapId } = req.body;
    const currentUserId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'Other user ID is required' });
    }

    const chatId = generateChatId(currentUserId, otherUserId);
    
    let chat = await Chat.findOne({ chatId })
      .populate('participants', 'username fullName avatar email')
      .populate('lastMessage')
      .populate('relatedSwap', 'status itemOffered itemRequested');

    if (!chat) {
      chat = new Chat({
        chatId,
        participants: [currentUserId, otherUserId],
        relatedSwap: swapId || null
      });
      await chat.save();
      await chat.populate('participants', 'username fullName avatar email');
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user chats
router.get('/chats', verifyJWT, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({
      participants: currentUserId,
      status: 'active'
    })
    .populate({
      path: 'participants',
      select: 'username fullName avatar email',
      match: { _id: { $ne: currentUserId } }
    })
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username fullName' }
    })
    .populate('relatedSwap', 'status itemOffered itemRequested')
    .sort({ lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const formattedChats = chats.map(chat => ({
      _id: chat._id,
      chatId: chat.chatId,
      otherParticipant: chat.participants[0],
      lastMessage: chat.lastMessage,
      lastActivity: chat.lastActivity,
      relatedSwap: chat.relatedSwap
    }));

    res.status(200).json({ success: true, data: { chats: formattedChats } });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chat messages
router.get('/chat/:chatId/messages', verifyJWT, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user._id;

    // Verify user access to chat
    const chat = await Chat.findOne({
      chatId,
      participants: currentUserId
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const messages = await Message.find({
      chatId,
      isDeleted: false
    })
    .populate('sender', 'username fullName avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      { chatId, receiver: currentUserId, isRead: false },
      { isRead: true, isDelivered: true }
    );

    res.status(200).json({
      success: true,
      data: { messages: messages.reverse() }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send message
router.post('/send', verifyJWT, async (req, res) => {
  try {
    const { chatId, content, type = 'text' } = req.body;
    const currentUserId = req.user._id;

    if (!chatId || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Chat ID and content required' });
    }

    // Get chat and verify access
    const chat = await Chat.findOne({
      chatId,
      participants: currentUserId
    }).populate('participants', 'username fullName');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Get receiver
    const receiver = chat.participants.find(p => p._id.toString() !== currentUserId.toString());

    // Create message
    const message = new Message({
      content: content.trim(),
      type,
      sender: currentUserId,
      receiver: receiver._id,
      chatId,
      relatedSwap: chat.relatedSwap
    });

    await message.save();
    await message.populate('sender', 'username fullName avatar');

    // Update chat
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    // Emit to WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new_message', { message, chatId });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', verifyJWT, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      isRead: false,
      isDeleted: false
    });

    res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
