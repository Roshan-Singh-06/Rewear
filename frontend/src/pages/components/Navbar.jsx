import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuthContext";
import NotificationService from "../../services/notificationService";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user: _user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleBrowse = () => {
    // Navigate to browse page
    navigate("/browse");
    closeMobileMenu();
  };

  const handleAbout = () => {
    // Navigate to about page
    navigate("/about");
    closeMobileMenu();
  };

  const handleMessages = () => {
    // Navigate to messages page
    navigate("/messages");
    closeMobileMenu();
  };

  const handleAddItem = () => {
    // Navigate to add item form page
    navigate("/addItem");
    closeMobileMenu();
  };

  const handleLogin = () => {
    // Navigate to login/signup page using React Router
    navigate("/auth");
    closeMobileMenu();
  };

  const handleDashboard = () => {
    // Navigate to dashboard
    navigate("/dashboard");
    closeMobileMenu();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/home");
    } catch (error) {
      console.error("Logout error:", error);
    }
    closeMobileMenu();
  };

  const handleDash = () => { // eslint-disable-line
    // Navigate to login/signup page using React Router
    navigate("/dashboard");
    closeMobileMenu();
  };

  const handleHowItWorks = () => {
    // Smooth scroll to How It Works section
    const howItWorksSection = document.querySelector("#how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    closeMobileMenu();
  };

  const handleHome = () => {
    // Navigate to home and scroll to top
    navigate("/");
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
    closeMobileMenu();
  };

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log('🔔 Fetching unread count...');
        const response = await NotificationService.getUnreadCount();
        console.log('🔔 Unread count response:', response);
        
        if (response.success && response.data) {
          console.log('🔔 Setting unreadCount to:', response.data.unreadCount);
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('❌ Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for updates every 10 seconds for real-time feel
    const interval = setInterval(fetchUnreadCount, 10000);
    
    // Listen for feedback submission events to refresh count
    const handleFeedbackSubmitted = () => {
      setTimeout(fetchUnreadCount, 1000); // Delay to ensure backend is updated
    };
    
    // Listen for notifications read events
    const handleNotificationsRead = () => {
      setTimeout(fetchUnreadCount, 500);
    };
    
    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    window.addEventListener('notificationsRead', handleNotificationsRead);
    
    // Listen for page visibility changes to refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchUnreadCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
      window.removeEventListener('notificationsRead', handleNotificationsRead);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const handleNotifications = () => {
    navigate("/notifications");
    closeMobileMenu();
  };

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 py-4 shadow-md bg-white sticky top-0 z-50">
      {/* Logo */}
      <div
        className="text-xl sm:text-2xl font-bold text-black cursor-pointer"
        onClick={handleHome}
      >
        ClothSwap
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium">
        <button
          onClick={handleHome}
          className="hover:text-black transition-colors duration-200"
        >
          Home
        </button>
        <button
          onClick={handleBrowse}
          className="hover:text-black transition-colors duration-200"
        >
          Browse
        </button>
        <button
          onClick={handleHowItWorks}
          className="hover:text-black transition-colors duration-200"
        >
          How It Works
        </button>
        <button
          onClick={handleAbout}
          className="hover:text-black transition-colors duration-200"
        >
          About
        </button>
        <button
          onClick={handleMessages}
          className="hover:text-black transition-colors duration-200"
        >
          Messages
        </button>
        
        {/* Notification Icon - Only show when authenticated */}
        {isAuthenticated && (
          <button
            onClick={handleNotifications}
            className="relative hover:text-black transition-colors duration-200 p-2 flex items-center"
            title={`${unreadCount} unread notifications`}
          >
            <Bell className="h-5 w-5" />
            {/* Always show debug info in development */}
        
            {unreadCount > 0 && (
              <>
                {/* Green dot indicator */}

                {/* Number badge */}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>
        )}
        
        <button
          onClick={handleAddItem}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
        >
          + Add List
        </button>
        {/* <button
          onClick={handleDash}
          className="hover:text-black transition-colors duration-200"
        >
          Dashboard
        </button> */}
      </nav>

      {/* Desktop Auth Buttons */}
      <div className="hidden md:flex space-x-4">
        {isAuthenticated ? (
          <>
            <button
              onClick={handleDashboard}
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
            >
              Login
            </button>
            <button
              onClick={handleLogin}
              className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Sign Up
            </button>
          </>
        )}

        {/* <button 
          onClick={handleLogin}
          className="text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
        >
          Login
        </button>
        <button 
          onClick={handleLogin}
          className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
        >
          Sign Up
        </button> */}
      </div>

      {/* Mobile Section */}
      <div className="md:hidden flex items-center space-x-3">
        {/* Mobile Notification Icon - Only show when authenticated */}
        {isAuthenticated && (
          <button
            onClick={handleNotifications}
            className="relative hover:text-black transition-colors duration-200 p-2 flex items-center"
            title={`${unreadCount} unread notifications`}
          >
            <Bell className="h-5 w-5" />
            {/* Debug info for mobile too */}
            {import.meta.env.DEV && (
              <span className="absolute top-8 left-0 text-xs bg-yellow-100 px-1 rounded">
                Count: {unreadCount}
              </span>
            )}
            {unreadCount > 0 && (
              <>
                {/* Green dot indicator */}
                <span className="absolute -top-0.5 -right-0.5 bg-green-500 rounded-full h-3 w-3 animate-pulse border border-white"></span>
                {/* Number badge */}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>
        )}

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          <span
            className={`w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-black transition-all duration-300 ${
              isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="text-xl font-bold text-black">ClothSwap</div>
          <button
            onClick={closeMobileMenu}
            className="flex justify-center items-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex flex-col p-6 space-y-6">
          <button
            onClick={handleHome}
            className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
          >
            Home
          </button>
          <button
            onClick={handleBrowse}
            className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
          >
            Browse
          </button>
          <button
            onClick={handleHowItWorks}
            className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
          >
            How It Works
          </button>
          <button
            onClick={handleAbout}
            className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
          >
            About
          </button>
          <button
            onClick={handleMessages}
            className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
          >
            Messages
          </button>
          
          {/* Mobile Notification Link - Only show when authenticated */}
          {isAuthenticated && (
            <button
              onClick={handleNotifications}
              className="text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2 flex items-center justify-between"
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={handleAddItem}
            className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-center font-medium"
          >
            + Add List
          </button>

          {/* Mobile Auth Buttons */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleDashboard}
                  className="w-full text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate("/notifications");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
                >
                  Notifications
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-center font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="w-full text-left text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200 py-2"
                >
                  Login
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-center font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
