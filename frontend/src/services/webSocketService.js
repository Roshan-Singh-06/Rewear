import { io } from 'socket.io-client';

/**
 * Production-level WebSocket Service for real-time messaging
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection failed:', error);
      this.reconnectAttempts++;
      this.emit('reconnect_error', error);
    });

    // Message events
    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('message_read', (data) => {
      console.log('Message read receipt:', data);
      this.emit('message_read', data);
    });

    this.socket.on('message_deleted', (data) => {
      console.log('Message deleted:', data);
      this.emit('message_deleted', data);
    });

    // User events
    this.socket.on('user_joined_chat', (data) => {
      this.emit('user_joined_chat', data);
    });

    this.socket.on('user_left_chat', (data) => {
      this.emit('user_left_chat', data);
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    this.socket.on('user_status_change', (data) => {
      this.emit('user_status_change', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('unread_count', (data) => {
      this.emit('unread_count', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join a chat room
   */
  joinChat(chatId) {
    if (this.socket?.connected && chatId) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId) {
    if (this.socket?.connected && chatId) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(chatId, content, type = 'text', replyTo = null) {
    if (this.socket?.connected && chatId && content?.trim()) {
      this.socket.emit('send_message', {
        chatId,
        content: content.trim(),
        type,
        replyTo
      });
    }
  }

  /**
   * Send message read receipt
   */
  markMessageAsRead(messageId, chatId) {
    if (this.socket?.connected && messageId && chatId) {
      this.socket.emit('message_read', { messageId, chatId });
    }
  }

  /**
   * Send typing indicator
   */
  startTyping(chatId) {
    if (this.socket?.connected && chatId) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId) {
    if (this.socket?.connected && chatId) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  /**
   * Update user online status
   */
  setUserOnline() {
    if (this.socket?.connected) {
      this.socket.emit('user_online');
    }
  }

  /**
   * Update user offline status
   */
  setUserOffline() {
    if (this.socket?.connected) {
      this.socket.emit('user_offline');
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
