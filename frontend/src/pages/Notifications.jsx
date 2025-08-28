import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Package,
  Star,
  Coins
} from 'lucide-react';
import Navbar from './components/Navbar';
import { useNotifications } from '../hooks/useNotifications';
import { messageService } from '../services/messageService';
import FeedbackModal from '../components/FeedbackModal';
import PointsPurchaseModal from '../components/PointsPurchaseModal';
import { useAuth } from '../hooks/useAuthContext';

/**
 * Production-level Notifications component
 * Features: filtering, pagination, loading states, error handling, optimistic updates
 */
export default function Notifications() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('all');
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, transaction: null });
  const { checkAuthStatus } = useAuth();
  
  // Use the production-level notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Filter notifications based on selected tab - exclude transaction notifications
  const filteredNotifications = notifications.filter(notification => {
    // First filter: only allow feedback and swap-related notifications
    const allowedTypes = ['feedback_received', 'feedback_request', 'swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed'];
    if (!allowedTypes.includes(notification.type)) {
      return false;
    }

    // Second filter: apply tab-specific filtering
    switch (selectedTab) {
      case 'unread':
        return !notification.isRead;
      case 'swap_requests':
        return notification.type === 'swap_request';
      case 'swap_accepted':
        return notification.type === 'swap_accepted';
      case 'swap_rejected':
        return notification.type === 'swap_rejected';
      case 'feedback':
        return ['feedback_received', 'feedback_request'].includes(notification.type);
      default: // 'all' case
        return true;
    }
  });

  /**
   * Handle notification click with proper error handling
   */
  const handleNotificationClick = useCallback(async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        // Trigger navbar update
        window.dispatchEvent(new CustomEvent('notificationsRead'));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    // Navigate based on notification type
    if (notification.type.startsWith('swap')) {
      // Use the related swap ID if available, otherwise use notification ID
      const swapId = notification.relatedSwap || notification._id;
      navigate(`/swap/${swapId}`);
    } else if (notification.type.includes('points_purchase') || notification.type.includes('feedback') || notification.type.includes('item_received')) {
      // Handle transaction-related notifications
      if (notification.relatedPointsPurchase) {
        navigate(`/transactions/${notification.relatedPointsPurchase}`);
      } else if (notification.relatedItem) {
        navigate(`/item/${notification.relatedItem}`);
      }
    } else {
      navigate(`/notifications/${notification._id}`);
    }
  }, [navigate, markAsRead]);

  /**
   * Handle starting a chat for accepted swaps
   */
  const handleStartChat = useCallback(async (notification, event) => {
    event.stopPropagation();
    
    try {
      // Get the other user ID from the notification
      const otherUserId = notification.sender?._id;
      if (!otherUserId) {
        alert('Unable to start chat: User information not available');
        return;
      }

      // Create or get existing chat
      const response = await messageService.getOrCreateChat(otherUserId, notification.relatedSwap);
      
      if (response.success) {
        // Navigate to messages page
        navigate('/messages');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  }, [navigate]);

  /**
   * Handle delete with confirmation
   */
  const handleDelete = useCallback(async (notificationId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await deleteNotification(notificationId);
    } catch {
      alert('Failed to delete notification. Please try again.');
    }
  }, [deleteNotification]);

  /**
   * Handle opening feedback modal - For feedback and swap notifications
   */
  const handleOpenFeedback = useCallback(async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      // Find the notification
      const notification = notifications.find(n => n._id === notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if this is a feedback-related or swap notification
      if (!['feedback_request', 'feedback_received', 'swap_accepted'].includes(notification.type)) {
        throw new Error('This notification does not support feedback');
      }

      let transaction;

      if (notification.type === 'swap_accepted') {
        // For swap_accepted notifications, create transaction data from swap info
        transaction = {
          _id: notification._id,
          type: notification.type,
          data: {
            transactionId: notification.relatedSwap,
            transactionType: 'swap'
          },
          seller: notification.sender || { _id: 'unknown', fullName: 'Unknown User' },
          item: notification.relatedItem || { 
            _id: 'swap-item',
            title: 'Swap Item',
            category: 'Swap'
          }
        };
      } else {
        // For feedback notifications, use existing data structure
        transaction = {
          _id: notification._id,
          type: notification.type,
          data: notification.data, // Contains transactionId, transactionType, etc.
          seller: notification.sender || { _id: 'unknown', fullName: 'Unknown User' },
          item: { 
            _id: 'feedback-item',
            title: `Feedback for ${notification.data?.transactionType || 'transaction'}`,
            category: 'Feedback'
          }
        };
      }
      
      setFeedbackModal({ isOpen: true, transaction });
    } catch (error) {
      console.error('Error opening feedback modal:', error);
      alert(`Failed to open feedback form: ${error.message}`);
    }
  }, [notifications]);

  /**
   * Handle feedback submission success
   */
  const handleFeedbackSubmitted = useCallback(async (pointsAwarded) => {
    // Force a complete refresh of notifications to get updated feedback status
    await refresh();
    
    // Refresh user data to update points in real-time
    try {
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
    
    // Notify user of success
    alert(`Feedback submitted! Seller earned ${pointsAwarded} points.`);
    
    // Trigger a storage event to notify other components (like dashboard)
    window.dispatchEvent(new CustomEvent('feedbackSubmitted', { 
      detail: { pointsAwarded } 
    }));

    // Force another refresh after a small delay to ensure backend updates are propagated
    setTimeout(async () => {
      await refresh();
    }, 1000);
  }, [refresh, checkAuthStatus]);

  /**
   * Handle mark all as read with confirmation
   */
  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllAsRead();
      // Trigger navbar update
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch {
      alert('Failed to mark all notifications as read. Please try again.');
    }
  }, [markAllAsRead, unreadCount]);

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'swap_request':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'swap_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'swap_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'swap_completed':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'feedback_received':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'feedback_request':
        return <Star className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  /**
   * Format relative time
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  /**
   * Error state
   */
  if (error && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load notifications
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <motion.section 
        className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Notifications
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-300"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Stay updated with your swap requests and activities
              </motion.p>
            </div>
            <motion.div 
              className="mt-6 md:mt-0 flex items-center space-x-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold">
                  {unreadCount} unread
                </span>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <motion.section 
        className="bg-white border-b"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {[
              { key: 'all', label: 'All', count: notifications.filter(n => ['feedback_received', 'feedback_request', 'swap_request', 'swap_accepted', 'swap_rejected'].includes(n.type)).length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'swap_accepted', label: 'Accepted', count: notifications.filter(n => n.type === 'swap_accepted').length },
              { key: 'swap_requests', label: 'Requests', count: notifications.filter(n => n.type === 'swap_request').length },
              { key: 'feedback', label: 'Feedback', count: notifications.filter(n => ['feedback_received', 'feedback_request'].includes(n.type)).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedTab === tab.key ? 'bg-blue-200' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Loading State */}
          {loading && notifications.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredNotifications.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                When you receive swap requests or updates, they'll appear here.
              </p>
            </motion.div>
          )}

          {/* Notifications List */}
          {filteredNotifications.length > 0 && (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white rounded-lg border p-6 hover:shadow-md transition-all cursor-pointer ${
                      !notification.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                            {notification.sender && (
                              <span>
                                From: {notification.sender.fullName || notification.sender.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => handleDelete(notification._id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Universal Action Buttons - Show conditionally based on feedback status and notification type */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-end space-x-2">
                        
                        {/* Start Chat Button - Show for swap accepted notifications */}
                        {notification.type === 'swap_accepted' && (
                          <button
                            onClick={(e) => handleStartChat(notification, e)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Start Chat
                          </button>
                        )}

                        {/* Item Received Button - Only show for swap_accepted notifications when user hasn't given feedback yet */}
                        {notification.type === 'swap_accepted' && !notification.feedbackGiven && (
                          <button
                            onClick={(e) => handleOpenFeedback(notification._id, e)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            title="Click when you have received your item to give feedback"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Item Received
                          </button>
                        )}

                        {/* Give Feedback Button - Show for feedback_request notifications when user hasn't given feedback yet */}
                        {notification.type === 'feedback_request' && !notification.feedbackGiven && (
                          <button
                            onClick={(e) => handleOpenFeedback(notification._id, e)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-2 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                            title="Give feedback for this transaction"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Give Feedback
                          </button>
                        )}

                        {/* Feedback Given Indicator - Show if current user has given feedback */}
                        {notification.feedbackGiven && (
                          <div className="inline-flex items-center px-2 py-1 text-xs leading-4 font-medium text-green-700 bg-green-100 rounded-md">
                            <Star className="h-3 w-3 mr-1" />
                            Feedback Given
                          </div>
                        )}

                        {/* Feedback Received Indicator - Show for feedback_received notifications */}
                        {notification.type === 'feedback_received' && (
                          <div className="inline-flex items-center px-2 py-1 text-xs leading-4 font-medium text-blue-700 bg-blue-100 rounded-md">
                            <Star className="h-3 w-3 mr-1" />
                            Feedback Received
                          </div>
                        )}

                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More Notifications'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, transaction: null })}
        transaction={feedbackModal.transaction}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}
