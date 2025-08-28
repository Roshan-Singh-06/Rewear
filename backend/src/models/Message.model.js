import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Message type (text, image, file, etc.)
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  
  // Sender and receiver
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Conversation/Chat room identifier
  chatId: {
    type: String,
    required: true,
    index: true
  },
  
  // Related swap (if message is related to a swap)
  relatedSwap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    default: null
  },
  
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  
  isDelivered: {
    type: Boolean,
    default: false
  },
  
  // For edited messages
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editedAt: {
    type: Date,
    default: null
  },
  
  // For deleted messages
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  // File attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ relatedSwap: 1 });

// Static method to generate chat ID between two users
messageSchema.statics.generateChatId = function(userId1, userId2) {
  // Sort user IDs to ensure consistent chat ID regardless of order
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to get chat participants from chat ID
messageSchema.statics.getChatParticipants = function(chatId) {
  const parts = chatId.replace('chat_', '').split('_');
  return parts.length === 2 ? parts : null;
};

// Instance method to mark as read
messageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.isDelivered = true;
    return await this.save();
  }
  return this;
};

// Instance method to mark as delivered
messageSchema.methods.markAsDelivered = async function() {
  if (!this.isDelivered) {
    this.isDelivered = true;
    return await this.save();
  }
  return this;
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
