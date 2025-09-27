import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api", "https://rewear-r2vt.onrender.com"// Your backend API base
  withCredentials: true, // For cookies/sessions
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use(
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
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await axiosInstance.post("/users/refresh-token");
        // Retry the original request
        return axiosInstance.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
