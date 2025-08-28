import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/notificationService';
import SwapService from '../services/swapService';

/**
 * Production-level notification management hook
 * Handles all notification state with proper error handling and caching
 */
export const useNotifications = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    pageSize = 20
  } = options;

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch notifications with error handling and loading states
   */
  const fetchNotifications = useCallback(async (page = 1, filters = {}) => {
    try {
      setError(null);
      if (page === 1) setLoading(true);

      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      const response = await NotificationService.getUserNotifications(params);
      
      if (response.success && response.data) {
        const newNotifications = response.data.notifications || [];
        
        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setUnreadCount(response.data.unreadCount || 0);
        setHasMore(page < (response.data.totalPages || 1));
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message);
      
      // On error, don't clear existing data unless it's the first load
      if (page === 1 && notifications.length === 0) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, notifications.length]);

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchNotifications(currentPage + 1);
    }
  }, [fetchNotifications, loading, hasMore, currentPage]);

  /**
   * Mark notification as read with optimistic updates
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Find the notification before updating
      const notification = notifications.find(n => n._id === notificationId);
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Update unread count optimistically
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Make API call
      await NotificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      
      // Find the notification again for revert
      const notification = notifications.find(n => n._id === notificationId);
      
      // Revert optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: false }
            : notif
        )
      );
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
      
      throw err;
    }
  }, [notifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      
      // Make API call
      await NotificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      
      // Revert optimistic update
      await fetchNotifications(1);
      
      throw err;
    }
  }, [fetchNotifications]);

  /**
   * Delete notification with optimistic updates
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      // Optimistic update
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Make API call
      await NotificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      
      // Revert optimistic update
      await fetchNotifications(1);
      
      throw err;
    }
  }, [notifications, fetchNotifications]);

  /**
   * Refresh notifications (pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!document.hidden) { // Only refresh when tab is visible
        fetchNotifications(1);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  // Visibility change listener for auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications(1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchNotifications]);

  return {
    // Data
    notifications,
    unreadCount,
    hasMore,
    
    // State
    loading,
    error,
    
    // Actions
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Pagination
    currentPage,
    fetchNotifications
  };
};

/**
 * Hook for handling individual swap notifications
 */
export const useSwapNotification = (notificationId) => {
  const [swapData, setSwapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSwapData = useCallback(async () => {
    if (!notificationId) return;

    try {
      setLoading(true);
      setError(null);

      // Get the notification first
      const notificationResponse = await NotificationService.getNotificationById(notificationId);
      
      if (!notificationResponse.success || !notificationResponse.data) {
        throw new Error('Notification not found');
      }

      let finalData = notificationResponse.data;

      // If this is a swap notification and we need additional swap details
      if (notificationResponse.data.type?.startsWith('swap') && notificationResponse.data.swapId) {
        const swapId = typeof notificationResponse.data.swapId === 'object' 
          ? notificationResponse.data.swapId._id 
          : notificationResponse.data.swapId;

        try {
          const swapResponse = await SwapService.getSwapById(swapId);
          
          if (swapResponse.success && swapResponse.data) {
            // Merge notification and swap data intelligently
            finalData = {
              ...notificationResponse.data,
              itemOffered: swapResponse.data.itemOffered || notificationResponse.data.itemOffered,
              itemRequested: swapResponse.data.itemRequested || notificationResponse.data.itemRequested,
              swapId: swapResponse.data
            };
          }
        } catch (swapError) {
          console.warn('Could not fetch additional swap details:', swapError.message);
          // Continue with notification data only
        }
      }

      setSwapData(finalData);
    } catch (err) {
      console.error('Failed to fetch swap notification data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    fetchSwapData();
  }, [fetchSwapData]);

  return {
    swapData,
    loading,
    error,
    refresh: fetchSwapData
  };
};
