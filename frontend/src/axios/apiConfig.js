// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5001/api',"https://rewear-r2vt.onrender.com",
  TIMEOUT: 10000,
  
  // Environment-specific configurations
  DEVELOPMENT: {
    BASE_URL: 'http://localhost:5001/api',"https://rewear-r2vt.onrender.com",
  },
  PRODUCTION: {
    BASE_URL: 'https://your-production-api.com/api',"https://rewear-r2vt.onrender.com",
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/users/register',
    VERIFY_EMAIL: '/users/verify-email',
    RESEND_EMAIL_OTP: '/users/resend-email-otp',
    LOGIN: '/users/login',
    SEND_LOGIN_OTP: '/users/send-login-otp',
    LOGIN_WITH_OTP: '/users/login-with-otp',
    LOGOUT: '/users/logout',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    PROFILE_STATUS: '/users/profile/status',
    REFRESH_TOKEN: '/users/refresh-token',
    UPLOAD_PROFILE_PICTURE: '/users/profile/upload-picture',
  },
  ITEMS: {
    GET_ALL: '/items',
    GET_BY_ID: '/items',
    CREATE: '/items',
    UPDATE: '/items',
    DELETE: '/items',
    SEARCH_BY_CITY: '/items/search/city',
    SEARCH_BY_LOCATION: '/items/search/location',
    NEAR_ME: '/items/near-me',
    MY_ITEMS: '/items/my-items',
    MY_ITEMS_DASHBOARD: '/items/my-items/dashboard',
  },
  ORDERS: {
    GET_USER_ORDERS: '/orders',
    GET_BY_ID: '/orders',
    COMPLETE: '/orders',
    CANCEL: '/orders',
  },
  SWAPS: {
    REQUEST: '/swaps/request',
    GET_USER_SWAPS: '/swaps',
    ACCEPT: '/swaps/:id/accept',
    REJECT: '/swaps/:id/reject',
    COMPLETE: '/swaps/:id/complete',
    GET_BY_ID: '/swaps/:id',
  },
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    GET_BY_ID: '/notifications/:id',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: '/notifications/:id',
    UNREAD_COUNT: '/notifications/unread-count',
  },
  POINTS: {
    REDEEM: '/points/redeem',
    HISTORY: '/points/history',
  }
};

// Get current environment configuration
export const getCurrentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  return env === 'production' ? API_CONFIG.PRODUCTION : API_CONFIG.DEVELOPMENT;
};
