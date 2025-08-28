import axiosInstance from '../axios/axiosInstance';

class PointsService {
  static async makeRequest(endpoint, options = {}) {
    try {
      const { method = 'GET', data, params, ...config } = options;
      
      const response = await axiosInstance({
        url: endpoint,
        method,
        data,
        params,
        ...config,
      });

      return response.data;
    } catch (error) {
      console.error('Points API Error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'API request failed';
      
      throw new Error(errorMessage);
    }
  }

  // Redeem item with points
  static async redeemItem(itemId) {
    return this.makeRequest('/points/redeem', {
      method: 'POST',
      data: { itemId },
    });
  }

  // Get user's points history
  static async getPointsHistory() {
    return this.makeRequest('/points/history', {
      method: 'GET',
    });
  }
}

export default PointsService;
