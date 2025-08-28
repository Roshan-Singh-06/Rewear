const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    // Profile Details
    fullName: {
      type: String,
      trim: true,
      maxlength: [50, "Full name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{10,15}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, "State cannot exceed 50 characters"],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, "Country cannot exceed 50 characters"],
    },
    pinCode: {
      type: String,
      trim: true,
      match: [/^\d{4,10}$/, "Please enter a valid pin code"],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [50, "District cannot exceed 50 characters"],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, "City cannot exceed 50 characters"],
    },
    latitude: {
      type: Number,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    profilePicture: {
      type: String, // URL to the uploaded image
      trim: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    refresh_token: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    listedItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    }],
    swaps: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Swap',
    }],
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    }],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Check if profile is complete
  this.isProfileComplete = this.fullName && 
                          this.phoneNumber && 
                          this.address && 
                          this.state && 
                          this.country && 
                          this.pinCode &&
                          this.district &&
                          this.city &&
                          this.isEmailVerified;
  
  next();
});

UserSchema.methods.checkProfileCompletion = function() {
  return this.fullName && 
         this.phoneNumber && 
         this.address && 
         this.state && 
         this.country && 
         this.pinCode &&
         this.district &&
         this.city &&
         this.isEmailVerified;
};

UserSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

module.exports = mongoose.model("User", UserSchema);
