import axiosInstance from '../axios/axiosInstance';
import { API_ENDPOINTS } from '../axios/apiConfig';

/**
 * Production-level Swap Service
 * Handles all swap-related API operations with proper error handling and validation
 */
class SwapService {
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
        timeout: 15000, // 15 second timeout for swap operations
        ...config,
      });

      // Validate response structure
      if (!response.data || typeof response.data.success !== 'boolean') {
        throw new Error('Invalid API response format');
      }

      return response.data;
    } catch (error) {
      console.error(`Swap API Error [${endpoint}]:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // Detailed error handling for different scenarios
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to perform this action');
      } else if (error.response?.status === 404) {
        throw new Error('Swap not found or has been removed');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid swap operation');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please try again');
      } else if (!navigator.onLine) {
        throw new Error('No internet connection');
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Swap service temporarily unavailable';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Request a new swap
   */
  static async requestSwap(swapData) {
    if (!swapData?.itemOffered || !swapData?.itemRequested) {
      throw new Error('Both offered and requested items are required');
    }

    try {
      return await this.makeRequest(API_ENDPOINTS.SWAPS.REQUEST, {
        method: 'POST',
        data: swapData,
      });
    } catch (error) {
      throw new Error(`Failed to create swap request: ${error.message}`);
    }
  }

  /**
   * Get user's swaps with optional filtering
   */
  static async getUserSwaps(params = {}) {
    try {
      const validatedParams = this.validateSwapParams(params);
      const response = await this.makeRequest(API_ENDPOINTS.SWAPS.GET_USER_SWAPS, {
        method: 'GET',
        params: validatedParams,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid swaps data received');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch your swaps: ${error.message}`);
    }
  }

  /**
   * Get swap by ID with complete population
   */
  static async getSwapById(swapId) {
    if (!swapId) {
      throw new Error('Swap ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.SWAPS.GET_BY_ID.replace(':id', swapId);
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
      });

      if (!response.data) {
        throw new Error('Swap not found');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch swap details: ${error.message}`);
    }
  }

  /**
   * Accept a swap request
   */
  static async acceptSwap(swapId) {
    if (!swapId) {
      throw new Error('Swap ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.SWAPS.ACCEPT.replace(':id', swapId);
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
      });

      // Validate acceptance response
      if (!response.data?.swap) {
        throw new Error('Invalid swap acceptance response');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to accept swap: ${error.message}`);
    }
  }

  /**
   * Reject a swap request
   */
  static async rejectSwap(swapId) {
    if (!swapId) {
      throw new Error('Swap ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.SWAPS.REJECT.replace(':id', swapId);
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
      });

      if (!response.data?.swap) {
        throw new Error('Invalid swap rejection response');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to reject swap: ${error.message}`);
    }
  }

  /**
   * Complete a swap (mark as finished)
   */
  static async completeSwap(swapId) {
    if (!swapId) {
      throw new Error('Swap ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.SWAPS.COMPLETE.replace(':id', swapId);
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
      });

      if (!response.data?.swap) {
        throw new Error('Invalid swap completion response');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to complete swap: ${error.message}`);
    }
  }

  /**
   * Validate swap parameters
   */
  static validateSwapParams(params) {
    const validated = {};
    
    if (params.status && ['pending', 'accepted', 'rejected', 'completed'].includes(params.status)) {
      validated.status = params.status;
    }
    
    if (params.page) {
      const page = parseInt(params.page);
      validated.page = isNaN(page) || page < 1 ? 1 : page;
    }
    
    if (params.limit) {
      const limit = parseInt(params.limit);
      validated.limit = isNaN(limit) || limit < 1 || limit > 100 ? 20 : limit;
    }
    
    return validated;
  }
}

export default SwapService;
