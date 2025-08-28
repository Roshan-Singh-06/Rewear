import React, { useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';

export default function NotificationTest() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await NotificationService.getUserNotifications();
        console.log('All notifications response:', response);
        
        if (response.success && response.data) {
          setNotifications(response.data.notifications);
          console.log('Notifications array:', response.data.notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Notification Debug Test</h2>
      <p>Total notifications: {notifications.length}</p>
      
      {notifications.map((notif, index) => (
        <div key={notif._id} style={{ 
          border: '1px solid #ccc', 
          margin: '10px 0', 
          padding: '10px',
          backgroundColor: notif.isRead ? '#f9f9f9' : '#e8f4fd'
        }}>
          <h3>Notification #{index + 1}</h3>
          <p><strong>ID:</strong> {notif._id}</p>
          <p><strong>Type:</strong> {notif.type}</p>
          <p><strong>Title:</strong> {notif.title}</p>
          <p><strong>Message:</strong> {notif.message}</p>
          <p><strong>Read:</strong> {notif.isRead ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(notif.createdAt).toLocaleString()}</p>
          
          {notif.swapId && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
              <h4>Swap Data:</h4>
              <p><strong>Swap ID:</strong> {typeof notif.swapId === 'object' ? notif.swapId._id : notif.swapId}</p>
              <p><strong>Status:</strong> {typeof notif.swapId === 'object' ? notif.swapId.status : 'ID only'}</p>
            </div>
          )}
          
          {notif.itemOffered && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f8e8' }}>
              <h4>Item Offered:</h4>
              <p><strong>Title:</strong> {notif.itemOffered.title}</p>
              <p><strong>Category:</strong> {notif.itemOffered.category}</p>
            </div>
          )}
          
          {notif.itemRequested && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffe8e8' }}>
              <h4>Item Requested:</h4>
              <p><strong>Title:</strong> {notif.itemRequested.title}</p>
              <p><strong>Category:</strong> {notif.itemRequested.category}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
