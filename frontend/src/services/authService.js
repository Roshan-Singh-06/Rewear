import axiosInstance from '../axios/axiosInstance';
import { API_ENDPOINTS } from '../axios/apiConfig';

class AuthService {
  static async makeRequest(endpoint, options = {}) {
    try {
      const { method = 'GET', data, ...config } = options;
      
      const response = await axiosInstance({
        url: endpoint,
        method,
        data,
        ...config,
      });

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'API request failed';
      
      throw new Error(errorMessage);
    }
  }

  // Authentication Methods
  static async register(userData) {
    return this.makeRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      data: userData,
    });
  }

  static async verifyEmail(email, otp) {
    return this.makeRequest(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      data: { email, otp },
    });
  }

  static async resendEmailOTP(email) {
    return this.makeRequest(API_ENDPOINTS.AUTH.RESEND_EMAIL_OTP, {
      method: 'POST',
      data: { email },
    });
  }

  static async login(credentials) {
    return this.makeRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      data: credentials,
    });
  }

  static async sendLoginOTP(email) {
    return this.makeRequest(API_ENDPOINTS.AUTH.SEND_LOGIN_OTP, {
      method: 'POST',
      data: { email },
    });
  }

  static async loginWithOTP(email, otp) {
    return this.makeRequest(API_ENDPOINTS.AUTH.LOGIN_WITH_OTP, {
      method: 'POST',
      data: { email, otp },
    });
  }

  static async logout() {
    return this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  static async getCurrentUser() {
    return this.makeRequest(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
    });
  }

  static async refreshToken() {
    return this.makeRequest(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      method: 'POST',
    });
  }

  // Profile Methods
  static async updateProfile(profileData) {
    return this.makeRequest(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
      method: 'PUT',
      data: profileData,
    });
  }

  static async getProfileStatus() {
    return this.makeRequest(API_ENDPOINTS.AUTH.PROFILE_STATUS, {
      method: 'GET',
    });
  }

  static async uploadProfilePicture(formData) {
    return this.makeRequest(API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PICTURE, {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default AuthService;
