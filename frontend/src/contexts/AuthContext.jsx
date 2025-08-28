import React, { useState, useEffect, createContext } from 'react';
import AuthService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await AuthService.getCurrentUser();
        console.log('Current user response:', response); // Debug log
        
        if (response && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials);
      console.log('Login response:', response); // Debug log
      
      if (response && response.data) {
        const { accessToken, user: userData } = response.data;
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return response;
      }
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  };

  const updateProfile = async (profileData) => {
    const response = await AuthService.updateProfile(profileData);
    if (response.success && response.data) {
      setUser(response.data);
      return response;
    }
    throw new Error('Profile update failed');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
