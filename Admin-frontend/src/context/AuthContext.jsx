import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginApi,
  logout as logoutApi,
  getCurrentUser,
  register as registerApi,
  registerAdmin as registerAdminApi,
  verifyEmail as verifyEmailApi,
  resendEmailOTP as resendEmailOTPApi,
} from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await getCurrentUser();
          setUser(response.data.message); // Updated to use message field
        } catch (error) {
          console.error("Failed to get user:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (userData) => {
    try {
      const response = await registerApi(userData);
      return response.data;
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  const registerAdmin = async (userData) => {
    try {
      const response = await registerAdminApi(userData);
      return response.data;
    } catch (error) {
      console.error(
        "Admin registration error:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await verifyEmailApi(email, otp);
      return response.data;
    } catch (error) {
      console.error(
        "Email verification error:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  const resendEmailOTP = async (email) => {
    try {
      const response = await resendEmailOTPApi(email);
      return response.data;
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials.email, credentials.password);
      console.log("AuthContext - Login API response:", response.data); // Debug log

      // Based on your API response: { status, message: { accessToken, user }, data: "success text", success }
      const responseData = response.data.message;
      console.log("AuthContext - Extracted responseData:", responseData); // Debug log

      const { accessToken, user: userData } = responseData;

      if (!accessToken || !userData) {
        console.error(
          "AuthContext - Missing token or user data:",
          responseData
        );
        throw new Error("Invalid login response - missing token or user data");
      }

      // Store token and user data
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("AuthContext - Login successful, user set:", userData); // Debug log
      return response.data;
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    register,
    registerAdmin,
    verifyEmail,
    resendEmailOTP,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
