import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await api.post("/users/refresh-token");
        return api.request(error.config);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs - Updated for your backend
export const register = (userData) => api.post("/users/register", userData);
export const registerAdmin = (userData) =>
  api.post("/users/register-admin", userData);
export const verifyEmail = (email, otp) =>
  api.post("/users/verify-email", { email, otp });
export const resendEmailOTP = (email) =>
  api.post("/users/resend-email-otp", { email });
export const login = (email, password) =>
  api.post("/users/login", { email, password });
export const logout = () => api.post("/users/logout");
export const getCurrentUser = () => api.get("/users/profile");
export const refreshToken = () => api.post("/users/refresh-token");

// Admin APIs - Updated to match your backend
export const getAllUsers = (params) => api.get("/admin/users", { params });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAllItems = (params) => api.get("/admin/items", { params });
export const getAllOrders = (params) => api.get("/admin/orders", { params });
export const getSwapPoints = () => api.get("/admin/points");
export const updateSwapPoints = (pointsData) =>
  api.put("/admin/points", pointsData);

// Order Management
export const cancelOrder = (orderId) => api.put(`/orders/${orderId}/cancel`);

// Item Management
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const approveItem = (id) => api.put(`/admin/items/${id}/approve`);
export const rejectItem = (id) => api.put(`/admin/items/${id}/reject`);

// Legacy aliases for backward compatibility
export const getUsers = (params) => getAllUsers(params);
export const getOrders = (params) => getAllOrders(params);
export const getProducts = (params) => getAllItems(params); // Items are called "products" in frontend

export default api;
