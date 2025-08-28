const asynchandler = require("../utils/asynchandler");
const User = require("../models/User.model");
const apiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const {
  generateOTP,
  sendOTPEmail,
} = require("../utils/emailService.alternative");

// Helper function to generate tokens
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refresh_token = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new apiError(
      500,
      "Something went wrong while assigning access token and refresh token"
    );
  }
};

// Register User
const registerUser = asynchandler(async (req, res) => {
  const { username, email, password, role, adminSecret } = req.body;

  if (!username || !email || !password) {
    throw new apiError(400, "Please provide all the required details");
  }

  // Check if trying to create admin user
  if (role === "admin") {
    // Check if admin secret is provided and matches environment variable
    const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET;
    if (!ADMIN_SECRET) {
      throw new apiError(403, "Admin registration is not enabled");
    }
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      throw new apiError(403, "Invalid admin secret");
    }
  }

  const existedUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  }).lean();

  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  // Generate OTP for email verification
  const emailOtp = generateOTP();
  const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    role: role === "admin" ? "admin" : "user", // Only allow admin if secret provided
    otp: emailOtp,
    otpExpiry: emailOtpExpiry,
    isEmailVerified: false, // Require email verification
  });

  // Send OTP email
  const emailSent = await sendOTPEmail(email, emailOtp, "verification");
  console.log(emailSent);
  if (!emailSent) {
    throw new apiError(500, "Failed to send verification email");
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refresh_token -otp -loginOtp"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully. Please check your email for verification OTP."
      )
    );
});

// Verify Email OTP
const verifyEmailOTP = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new apiError(400, "Email is already verified");
  }

  if (!user.otp || user.otp !== otp) {
    throw new apiError(400, "Invalid OTP");
  }

  if (new Date() > user.otpExpiry) {
    throw new apiError(400, "OTP has expired");
  }

  // Verify email
  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { emailVerified: true },
        "Email verified successfully"
      )
    );
});

// Resend Email Verification OTP
const resendEmailOTP = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new apiError(400, "Email is already verified");
  }

  const emailOtp = generateOTP();
  const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = emailOtp;
  user.otpExpiry = emailOtpExpiry;
  await user.save({ validateBeforeSave: false });

  const emailSent = await sendOTPEmail(email, emailOtp, "verification");

  if (!emailSent) {
    throw new apiError(500, "Failed to send verification email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { emailSent: true },
        "Verification OTP sent successfully"
      )
    );
});

// Login User with Password
const loginUser = asynchandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new apiError(400, "Please verify your email first");
  }

  const isPasswordMatch = await user.isPasswordMatch(password);
  if (!isPasswordMatch) {
    throw new apiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refresh_token -otp -loginOtp"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        accessToken,
        user: loggedInUser,
      })
    );
});

// Send Login OTP
const sendLoginOTP = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new apiError(400, "Please verify your email first");
  }

  const loginOtp = generateOTP();
  const loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.loginOtp = loginOtp;
  user.loginOtpExpiry = loginOtpExpiry;
  await user.save({ validateBeforeSave: false });

  const emailSent = await sendOTPEmail(email, loginOtp, "login");

  if (!emailSent) {
    throw new apiError(500, "Failed to send login OTP");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Login OTP sent successfully"));
});

// Login with OTP
const loginWithOTP = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new apiError(400, "Please verify your email first");
  }

  if (!user.loginOtp || user.loginOtp !== otp) {
    throw new apiError(400, "Invalid OTP");
  }

  if (new Date() > user.loginOtpExpiry) {
    throw new apiError(400, "OTP has expired");
  }

  // Clear login OTP after successful verification
  user.loginOtp = undefined;
  user.loginOtpExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refresh_token -otp -loginOtp"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, user: loggedInUser },
        "User logged in successfully"
      )
    );
});

// Logout User
const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refresh_token: "" },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

// Get Current User
const getCurrentUser = asynchandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refresh_token")
    .lean();
  return res.status(200).json(new ApiResponse(200, user, "User details"));
});

// Refresh Token
const refreshToken = asynchandler(async (req, res) => {
  const { refreshToken } = req.cookies; // Get refresh token from cookies

  if (!refreshToken) {
    throw new apiError(401, "Session expired. Please log in again.");
  }

  // Find user by refresh token
  const user = await User.findOne({ refresh_token: refreshToken });

  if (!user) {
    throw new apiError(403, "Invalid refresh token. Please log in again.");
  }

  try {
    // Verify refresh token
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (decoded.id !== user._id.toString()) {
      throw new apiError(403, "Invalid refresh token. Please log in again.");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    // Set new cookies
    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(200, { accessToken }, "New access token generated")
      );
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Handle expired refresh token
      user.refresh_token = null; // Clear refresh token in DB
      await user.save({ validateBeforeSave: false });

      res.clearCookie("refreshToken"); // Clear cookies
      res.clearCookie("accessToken");

      throw new apiError(401, "Session expired. Please log in again.");
    }
    throw new apiError(403, "Invalid refresh token. Please log in again.");
  }
});

// Update user profile
const updateProfile = asynchandler(async (req, res) => {
  const { fullName, phoneNumber, address, state, country, pinCode, district, city, latitude, longitude, profilePicture } = req.body;

  const userId = req.user._id;

  // Build update object with only provided fields
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (address !== undefined) updateData.address = address;
  if (state !== undefined) updateData.state = state;
  if (country !== undefined) updateData.country = country;
  if (pinCode !== undefined) updateData.pinCode = pinCode;
  if (district !== undefined) updateData.district = district;
  if (city !== undefined) updateData.city = city;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

  // First, update the user with the new data
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new apiError(404, "User not found");
  }

  // Manually check and update profile completion status
  const isComplete =
    updatedUser.fullName &&
    updatedUser.phoneNumber &&
    updatedUser.address &&
    updatedUser.state &&
    updatedUser.country &&
    updatedUser.pinCode &&
    updatedUser.district &&
    updatedUser.city &&
    updatedUser.isEmailVerified;

  // Update the isProfileComplete field if it changed
  if (updatedUser.isProfileComplete !== isComplete) {
    updatedUser.isProfileComplete = isComplete;
    await updatedUser.save();
  }

  // Return user without sensitive fields
  const userResponse = await User.findById(userId).select(
    "-password -refresh_token -otp -otpExpiry"
  );

  res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Profile updated successfully"));
});

// Get profile completion status
const getProfileStatus = asynchandler(async (req, res) => {
  const user = req.user;

  const requiredFields = {
    fullName: !!user.fullName,
    phoneNumber: !!user.phoneNumber,
    address: !!user.address,
    state: !!user.state,
    country: !!user.country,
    pinCode: !!user.pinCode,
    district: !!user.district,
    city: !!user.city,
    isEmailVerified: user.isEmailVerified,
  };

  const completedFields = Object.values(requiredFields).filter(Boolean).length;
  const totalFields = Object.keys(requiredFields).length;
  const completionPercentage = Math.round(
    (completedFields / totalFields) * 100
  );

  const missingFields = Object.keys(requiredFields).filter(
    (field) => !requiredFields[field]
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        isComplete: user.isProfileComplete,
        completionPercentage,
        requiredFields,
        missingFields,
        user: {
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          address: user.address,
          state: user.state,
          country: user.country,
          pinCode: user.pinCode,
          district: user.district,
          city: user.city,
          latitude: user.latitude,
          longitude: user.longitude,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
        },
      },
      "Profile status retrieved successfully"
    )
  );
});

// Register Admin User (separate endpoint for better security)
const registerAdmin = asynchandler(async (req, res) => {
  const { username, email, password, adminSecret } = req.body;

  if (!username || !email || !password || !adminSecret) {
    throw new apiError(
      400,
      "Please provide all required details including admin secret"
    );
  }

  // Check admin secret
  const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET;
  if (!ADMIN_SECRET) {
    throw new apiError(
      403,
      "Admin registration is not enabled. Set ADMIN_REGISTRATION_SECRET in environment variables."
    );
  }

  if (adminSecret !== ADMIN_SECRET) {
    throw new apiError(403, "Invalid admin secret");
  }

  const existedUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  }).lean();

  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  // Generate OTP for email verification
  const emailOtp = generateOTP();
  const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    role: "admin",
    otp: emailOtp,
    otpExpiry: emailOtpExpiry,
    isEmailVerified: false, // Require email verification
  });

  // Send OTP email
  const emailSent = await sendOTPEmail(email, emailOtp, "verification");

  if (!emailSent) {
    throw new apiError(500, "Failed to send verification email");
  }

  const createdAdmin = await User.findById(user._id).select(
    "-password -refresh_token -otp -loginOtp"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdAdmin,
        "Admin user registered successfully. Please check your email for verification OTP."
      )
    );
});

// Upload profile picture
const uploadProfilePicture = asynchandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new apiError(400, "Profile picture is required");
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new apiError(404, "User not found");
    }

    // Upload to cloudinary
    const uploadResult = await uploadOnCloudinary(
      req.file.buffer,
      `profile_${userId}_${Date.now()}`
    );

    if (!uploadResult) {
      throw new apiError(500, "Failed to upload profile picture");
    }

    // Update user profile picture
    user.profilePicture = uploadResult.secure_url;
    await user.save();

    const userResponse = await User.findById(userId).select(
      "-password -refresh_token -otp -otpExpiry"
    );

    res.status(200).json(
      new ApiResponse(
        200,
        { 
          profilePicture: uploadResult.secure_url,
          user: userResponse 
        },
        "Profile picture uploaded successfully"
      )
    );
  } catch (error) {
    throw new apiError(500, error.message || "Failed to upload profile picture");
  }
});

module.exports = {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  sendLoginOTP,
  loginWithOTP,
  logoutUser,
  getCurrentUser,
  refreshToken,
  updateProfile,
  getProfileStatus,
  registerAdmin,
  uploadProfilePicture,
};
