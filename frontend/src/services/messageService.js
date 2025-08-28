import axiosInstance from '../axios/axiosInstance';

/**
 * Production-level Message Service
 * Handles all messaging operations with proper error handling
 */
class MessageService {
  constructor() {
    this.baseURL = '/messages';
  }

  /**
   * Make request with standardized error handling
   */
  async makeRequest(method, endpoint, data = null, config = {}) {
    try {
      const response = await axiosInstance({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        timeout: 15000,
        ...config
      });

      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Operation successful'
      };
    } catch (error) {
      console.error(`MessageService ${method.toUpperCase()} ${endpoint} error:`, error);
      
      // Enhanced error handling
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        // Server responded with an error status
        switch (error.response.status) {
          case 404:
            errorMessage = 'Service not found. Please check if the backend is running.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You don\'t have permission for this action.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.response?.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and ensure the backend is running.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      return {
        success: false,
        error: errorMessage,
        statusCode: error.response?.status,
        details: error.response?.data
      };
    }
  }

  /**
   * Get or create a chat with another user
   */
  async getOrCreateChat(otherUserId, swapId = null) {
    if (!otherUserId) {
      throw new Error('Other user ID is required');
    }

    return this.makeRequest('POST', '/chat', {
      otherUserId,
      swapId
    });
  }

  /**
   * Get all chats for current user
   */
  async getUserChats(page = 1, limit = 20) {
    return this.makeRequest('GET', `/chats?page=${page}&limit=${limit}`);
  }

  /**
   * Get messages in a specific chat
   */
  async getChatMessages(chatId, page = 1, limit = 50) {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    return this.makeRequest('GET', `/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  /**
   * Send a message
   */
  async sendMessage(chatId, content, type = 'text', replyTo = null) {
    if (!chatId || !content?.trim()) {
      throw new Error('Chat ID and message content are required');
    }

    return this.makeRequest('POST', '/send', {
      chatId,
      content: content.trim(),
      type,
      replyTo
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    return this.makeRequest('PATCH', `/message/${messageId}/read`);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    return this.makeRequest('DELETE', `/message/${messageId}`);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount() {
    return this.makeRequest('GET', '/unread-count');
  }

  /**
   * Search messages
   */
  async searchMessages(query, chatId = null) {
    if (!query?.trim()) {
      throw new Error('Search query is required');
    }

    const params = new URLSearchParams({ query: query.trim() });
    if (chatId) {
      params.append('chatId', chatId);
    }

    return this.makeRequest('GET', `/search?${params.toString()}`);
  }

  /**
   * Get chat info by ID
   */
  async getChatInfo(chatId) {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    return this.makeRequest('GET', `/chat/${chatId}/info`);
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService;
