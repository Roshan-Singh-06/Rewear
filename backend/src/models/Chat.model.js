import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  // Unique chat identifier
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Participants in the chat
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Related swap (if chat is initiated from a swap)
  relatedSwap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    default: null
  },
  
  // Last message in the chat
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Chat status
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  
  // Unread message counts for each participant
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Chat metadata
  metadata: {
    // Chat title (if set by users)
    title: {
      type: String,
      default: null
    },
    
    // Chat description
    description: {
      type: String,
      default: null
    },
    
    // Chat avatar
    avatar: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ relatedSwap: 1 });

// Static method to find or create chat between users
chatSchema.statics.findOrCreateChat = async function(userId1, userId2, relatedSwap = null) {
  const chatId = this.generateChatId(userId1, userId2);
  
  let chat = await this.findOne({ chatId }).populate([
    { path: 'participants', select: 'username fullName avatar email' },
    { path: 'lastMessage', populate: { path: 'sender', select: 'username fullName' } },
    { path: 'relatedSwap', select: 'status itemOffered itemRequested' }
  ]);
  
  if (!chat) {
    // Initialize unread counts for both participants
    const unreadCounts = new Map();
    unreadCounts.set(userId1.toString(), 0);
    unreadCounts.set(userId2.toString(), 0);
    
    chat = new this({
      chatId,
      participants: [userId1, userId2],
      relatedSwap,
      unreadCounts
    });
    
    await chat.save();
    await chat.populate([
      { path: 'participants', select: 'username fullName avatar email' },
      { path: 'relatedSwap', select: 'status itemOffered itemRequested' }
    ]);
  }
  
  return chat;
};

// Static method to generate chat ID
chatSchema.statics.generateChatId = function(userId1, userId2) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

// Instance method to increment unread count for a user
chatSchema.methods.incrementUnreadCount = async function(userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCounts.get(userIdStr) || 0;
  this.unreadCounts.set(userIdStr, currentCount + 1);
  this.lastActivity = new Date();
  return await this.save();
};

// Instance method to reset unread count for a user
chatSchema.methods.resetUnreadCount = async function(userId) {
  const userIdStr = userId.toString();
  this.unreadCounts.set(userIdStr, 0);
  return await this.save();
};

// Instance method to update last message
chatSchema.methods.updateLastMessage = async function(messageId) {
  this.lastMessage = messageId;
  this.lastActivity = new Date();
  return await this.save();
};

// Instance method to get other participant
chatSchema.methods.getOtherParticipant = function(currentUserId) {
  return this.participants.find(participant => 
    participant._id.toString() !== currentUserId.toString()
  );
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
