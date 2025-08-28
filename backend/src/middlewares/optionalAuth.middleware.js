const asynchandler = require('../utils/asynchandler');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Optional authentication middleware
// If token is provided and valid, sets req.user
// If no token or invalid token, continues without setting req.user
const optionalAuth = asynchandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace("Bearer ", "").trim();

    // If no token provided, continue without authentication
    if (!token) {
      console.log('No token provided - continuing as guest');
      return next();
    }

    // Try to verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Try to find the user
    const user = await User.findById(decoded?.id).select('-password -refresh_token').lean();
    
    if (user) {
      req.user = user;
      console.log('Optional auth - User authenticated:', user.username);
    } else {
      console.log('Optional auth - Invalid user ID in token');
    }
    
    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    console.log('Optional auth - Token verification failed, continuing as guest');
    next();
  }
});

module.exports = optionalAuth;
