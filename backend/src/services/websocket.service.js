import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import Message from '../models/Message.model.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  /**
   * Initialize WebSocket server
   */
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupEventHandlers();
    
    console.log('WebSocket service initialized');
    return this.io;
  }

  /**
   * Setup authentication middleware for socket connections
   */
  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded._id).select('username fullName email avatar');
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup event handlers for socket connections
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      socket.on('join_chat', (data) => this.handleJoinChat(socket, data));
      socket.on('leave_chat', (data) => this.handleLeaveChat(socket, data));
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('message_read', (data) => this.handleMessageRead(socket, data));
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
      socket.on('user_online', () => this.handleUserOnline(socket));
      socket.on('user_offline', () => this.handleUserOffline(socket));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);
    
    // Store user connection
    this.connectedUsers.set(socket.userId, socket.id);
    this.userSockets.set(socket.id, socket.userId);
    
    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);
    
    // Notify user is online
    this.broadcastUserStatus(socket.userId, 'online');
    
    // Send pending messages notification
    this.sendPendingNotifications(socket);
  }

  /**
   * Handle user joining a chat room
   */
  async handleJoinChat(socket, data) {
    try {
      const { chatId } = data;
      
      // Verify user is part of this chat
      const chat = await Chat.findOne({
        chatId,
        participants: socket.userId
      });
      
      if (!chat) {
        socket.emit('error', { message: 'Chat not found or access denied' });
        return;
      }
      
      socket.join(chatId);
      console.log(`User ${socket.user.username} joined chat: ${chatId}`);
      
      // Notify other participants that user joined
      socket.to(chatId).emit('user_joined_chat', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
      
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  }

  /**
   * Handle user leaving a chat room
   */
  handleLeaveChat(socket, data) {
    const { chatId } = data;
    socket.leave(chatId);
    
    // Notify other participants that user left
    socket.to(chatId).emit('user_left_chat', {
      userId: socket.userId,
      username: socket.user.username,
      chatId
    });
    
    console.log(`User ${socket.user.username} left chat: ${chatId}`);
  }

  /**
   * Handle sending message via WebSocket
   */
  async handleSendMessage(socket, data) {
    try {
      const { chatId, content, type = 'text', replyTo } = data;
      
      if (!chatId || !content?.trim()) {
        socket.emit('error', { message: 'Chat ID and content are required' });
        return;
      }
      
      // Verify chat access
      const chat = await Chat.findOne({
        chatId,
        participants: socket.userId
      }).populate('participants', 'username fullName avatar');
      
      if (!chat) {
        socket.emit('error', { message: 'Chat not found or access denied' });
        return;
      }
      
      // Get receiver
      const receiver = chat.getOtherParticipant(socket.userId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }
      
      // Create and save message
      const message = new Message({
        content: content.trim(),
        type,
        sender: socket.userId,
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
      
      // Update chat
      await chat.updateLastMessage(message._id);
      await chat.incrementUnreadCount(receiver._id);
      
      // Emit to chat room
      this.io.to(chatId).emit('new_message', {
        message,
        chatId
      });
      
      // Send push notification to receiver if offline
      if (!this.connectedUsers.has(receiver._id.toString())) {
        // Handle offline notification (could integrate with push notification service)
        console.log(`User ${receiver.username} is offline, should send push notification`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle message read receipt
   */
  async handleMessageRead(socket, data) {
    try {
      const { messageId, chatId } = data;
      
      await Message.findOneAndUpdate(
        { _id: messageId, receiver: socket.userId },
        { isRead: true, isDelivered: true }
      );
      
      // Emit read receipt to chat
      socket.to(chatId).emit('message_read', {
        messageId,
        chatId,
        readBy: socket.userId
      });
      
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Handle typing indicators
   */
  handleTypingStart(socket, data) {
    const { chatId } = data;
    socket.to(chatId).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      chatId
    });
  }

  handleTypingStop(socket, data) {
    const { chatId } = data;
    socket.to(chatId).emit('user_stopped_typing', {
      userId: socket.userId,
      username: socket.user.username,
      chatId
    });
  }

  /**
   * Handle user online status
   */
  handleUserOnline(socket) {
    this.broadcastUserStatus(socket.userId, 'online');
  }

  handleUserOffline(socket) {
    this.broadcastUserStatus(socket.userId, 'offline');
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect(socket) {
    console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
    
    // Remove user from connected users
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.id);
    
    // Broadcast user offline status
    this.broadcastUserStatus(socket.userId, 'offline');
  }

  /**
   * Broadcast user status to relevant chats
   */
  async broadcastUserStatus(userId, status) {
    try {
      // Find all chats user is part of
      const chats = await Chat.find({
        participants: userId,
        status: 'active'
      }).select('chatId');
      
      // Emit status to all relevant chat rooms
      chats.forEach(chat => {
        this.io.to(chat.chatId).emit('user_status_change', {
          userId,
          status,
          timestamp: new Date()
        });
      });
      
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }

  /**
   * Send pending notifications to newly connected user
   */
  async sendPendingNotifications(socket) {
    try {
      const unreadCount = await Message.countDocuments({
        receiver: socket.userId,
        isRead: false,
        isDeleted: false
      });
      
      socket.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(`user_${userId}`).emit('notification', notification);
    }
  }

  /**
   * Send message to specific chat
   */
  sendMessageToChat(chatId, event, data) {
    this.io.to(chatId).emit(event, data);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
