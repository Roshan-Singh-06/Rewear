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
  AlertCircle
} from 'lucide-react';
import Navbar from './components/Navbar';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Production-level Notifications component
 * Features: filtering, pagination, loading states, error handling, optimistic updates
 */
export default function Notifications() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('all');
  
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

  // Filter notifications based on selected tab
  const filteredNotifications = notifications.filter(notification => {
    switch (selectedTab) {
      case 'unread':
        return !notification.isRead;
      case 'swap_requests':
        return notification.type === 'swap_request';
      case 'swap_accepted':
        return notification.type === 'swap_accepted';
      case 'swap_rejected':
        return notification.type === 'swap_rejected';
      default:
        return true;
    }
  });

  /**
   * Handle notification click with proper error handling
   */
  const handleNotificationClick = useCallback(async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
      
      // Navigate based on notification type
      if (notification.type.startsWith('swap')) {
        navigate(`/swap/${notification._id}`);
      } else {
        navigate(`/notifications/${notification._id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still navigate even if mark as read fails
      if (notification.type.startsWith('swap')) {
        navigate(`/swap/${notification._id}`);
      } else {
        navigate(`/notifications/${notification._id}`);
      }
    }
  }, [navigate, markAsRead]);

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
    } catch (error) { // eslint-disable-line no-unused-vars
      alert('Failed to delete notification. Please try again.');
    }
  }, [deleteNotification]);

  /**
   * Handle mark all as read with confirmation
   */
  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllAsRead();
    } catch (error) { // eslint-disable-line no-unused-vars
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
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'swap_accepted', label: 'Accepted', count: notifications.filter(n => n.type === 'swap_accepted').length },
              { key: 'swap_requests', label: 'Requests', count: notifications.filter(n => n.type === 'swap_request').length },
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

                    {/* Swap Details Preview */}
                    {notification.type.startsWith('swap') && (notification.itemOffered || notification.itemRequested) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {notification.itemOffered && (
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-600">IMG</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.itemOffered.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {notification.itemOffered.category}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {notification.itemRequested && (
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-600">IMG</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.itemRequested.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {notification.itemRequested.category}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
    </div>
  );
}
