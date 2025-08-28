import axiosInstance from '../axios/axiosInstance';
import { API_ENDPOINTS } from '../axios/apiConfig';

/**
 * Production-level Notification Service
 * Handles all notification-related API operations with proper error handling
 */
class NotificationService {
  /**
   * Generic request handler with standardized error handling
   */
  static async makeRequest(endpoint, options = {}) {
    try {
      const { method = 'GET', data, params, ...config } = options;
      
      const response = await axiosInstance({
        url: endpoint,
        method,
        data,
        params,
        timeout: 10000, // 10 second timeout
        ...config,
      });

      // Ensure response follows expected structure
      if (!response.data || typeof response.data.success !== 'boolean') {
        throw new Error('Invalid API response format');
      }

      return response.data;
    } catch (error) {
      console.error(`Notification API Error [${endpoint}]:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // Standardized error format
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Notification service temporarily unavailable';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  static async getUserNotifications(params = {}) {
    try {
      const validatedParams = this.validatePaginationParams(params);
      const response = await this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.GET_ALL, {
        method: 'GET',
        params: validatedParams,
      });

      // Validate response structure
      if (!response.data || !Array.isArray(response.data.notifications)) {
        throw new Error('Invalid notifications data received');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  /**
   * Get notification by ID with complete data population
   */
  static async getNotificationById(id) {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.NOTIFICATIONS.GET_BY_ID.replace(':id', id);
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('Notification not found');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch notification details: ${error.message}`);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount() {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
        method: 'GET',
      });

      return {
        ...response,
        data: {
          unreadCount: Number(response.data?.unreadCount || response.data?.count) || 0
        }
      };
    } catch (error) {
      // Non-critical error - return 0 count
      console.warn('Failed to fetch unread count:', error.message);
      return { success: true, data: { unreadCount: 0 } };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id) {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.NOTIFICATIONS.MARK_READ.replace(':id', id);
      return await this.makeRequest(endpoint, {
        method: 'PUT',
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    try {
      return await this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PUT',
      });
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id) {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.NOTIFICATIONS.DELETE.replace(':id', id);
      return await this.makeRequest(endpoint, {
        method: 'DELETE',
      });
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static validatePaginationParams(params) {
    const validated = {};
    
    if (params.page) {
      const page = parseInt(params.page);
      validated.page = isNaN(page) || page < 1 ? 1 : page;
    }
    
    if (params.limit) {
      const limit = parseInt(params.limit);
      validated.limit = isNaN(limit) || limit < 1 || limit > 100 ? 20 : limit;
    }
    
    if (params.unreadOnly === true || params.unreadOnly === 'true') {
      validated.unreadOnly = true;
    }
    
    return validated;
  }
}

export default NotificationService;
