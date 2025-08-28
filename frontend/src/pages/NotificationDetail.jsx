import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Eye } from 'lucide-react';
import Navbar from './components/Navbar';
import NotificationService from '../services/notificationService';

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotificationDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await NotificationService.getNotificationById(id);
        
        if (response.success && response.data) {
          setNotification(response.data);
          // If this is a swap notification, redirect to SwapDetail for better UI
          if (response.data.type.startsWith('swap')) {
            navigate(`/swap/${id}`, { replace: true });
            return;
          }
        } else {
          setError('Notification not found');
        }
      } catch (err) {
        console.error('Error fetching notification:', err);
        setError('Failed to load notification details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotificationDetail();
    }
  }, [id, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading notification details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error || 'Notification not found'}</p>
            <button
              onClick={() => navigate('/notifications')}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Notifications
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
      <section className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Notifications</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold">
            {notification.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Notification Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {notification.sender?.fullName?.[0] || notification.sender?.username?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    From: {notification.sender?.fullName || notification.sender?.username}
                  </h3>
                  <p className="text-gray-600">{notification.sender?.email}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 text-gray-500 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatDate(notification.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-gray-700 text-lg leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Redirect to Swap Detail for swap notifications */}
            {notification.type.startsWith('swap') && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate(`/swap/${id}`)}
                  className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
                >
                  <Eye className="h-5 w-5" />
                  <span>View Full Swap Details</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
