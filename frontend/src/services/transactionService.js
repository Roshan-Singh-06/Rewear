import axiosInstance from '../axios/axiosInstance';

class TransactionService {
  // Create a points purchase request
  async createPointsPurchase(itemId, pointsOffered) {
    try {
      const response = await axiosInstance.post('/transactions/purchase', {
        itemId,
        pointsOffered
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create purchase request');
    }
  }

  // Respond to a points purchase (accept/reject)
  async respondToPointsPurchase(purchaseId, action) {
    try {
      const response = await axiosInstance.patch(`/transactions/purchase/${purchaseId}/respond`, {
        action
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to respond to purchase request');
    }
  }

  // Mark item as received
  async markItemReceived(purchaseId) {
    try {
      const response = await axiosInstance.patch(`/transactions/purchase/${purchaseId}/received`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark item as received');
    }
  }

  // Submit feedback
  async submitFeedback(purchaseId, condition) {
    try {
      const response = await axiosInstance.post(`/transactions/purchase/${purchaseId}/feedback`, {
        condition
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit feedback');
    }
  }

  // Submit simple feedback for transaction
  async submitFeedbackSimple(transactionId, transactionType, condition) {
    try {
      const response = await axiosInstance.post(`/transactions/feedback/${transactionType}/${transactionId}`, {
        condition
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit feedback');
    }
  }

  // Get user transactions
  async getUserTransactions(type = 'all') {
    try {
      const response = await axiosInstance.get(`/transactions/transactions?type=${type}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }

  // Get transaction details
  async getTransactionDetails(transactionId) {
    try {
      const response = await axiosInstance.get(`/transactions/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transaction details');
    }
  }

  // Get pending purchases (for sellers)
  async getPendingPurchases() {
    try {
      const response = await axiosInstance.get('/transactions/pending-purchases');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending purchases');
    }
  }

  // Helper method to get points for feedback condition
  getPointsForCondition(condition) {
    const pointsMap = {
      'new': 60,
      'like_new': 50,
      'good': 40,
      'fair': 30,
      'worn': 20
    };
    return pointsMap[condition] || 0;
  }

  // Helper method to format condition for display
  formatCondition(condition) {
    const conditionMap = {
      'new': 'New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'worn': 'Worn'
    };
    return conditionMap[condition] || condition;
  }

  // Helper method to get status color for UI
  getStatusColor(status) {
    const statusColors = {
      'pending': 'yellow',
      'accepted': 'green',
      'rejected': 'red',
      'completed': 'blue',
      'cancelled': 'gray'
    };
    return statusColors[status] || 'gray';
  }
}

export default new TransactionService();
