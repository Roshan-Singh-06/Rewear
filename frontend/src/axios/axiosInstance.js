import axios from 'axios';
import { API_CONFIG } from './apiConfig';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor to add auth token or handle requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData requests - remove Content-Type to let axios set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('Detected FormData - removed Content-Type header');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${API_CONFIG.BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
          const newToken = refreshResponse.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - server might be down');
      error.message = 'Network error - please check your connection';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
