const Item = require("../models/Item.model");
const User = require("../models/User.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asynchandler");
const { uploadOnCloudinary } = require("../utils/cloudinary");

// Get user's own items
const getUserItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ listedBy: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, items, "User items retrieved successfully")
  );
});

// Get items by city location
const getItemsByCity = asyncHandler(async (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    throw new ApiError(400, "City parameter is required");
  }

  console.log('Searching for items in city:', city);

  // Build base filter
  let baseFilter = { 
    approved: true,
    status: 'available' // Only show available items in browse/city search
  };
  
  // Exclude user's own items from search results (only if user is authenticated)
  if (req.user && req.user._id) {
    baseFilter.listedBy = { $ne: req.user._id };
    console.log('Excluding items from user:', req.user.username);
  }

  // First, find users who match the location criteria
  const locationRegex = new RegExp(city.trim(), 'i');
  const matchingUsers = await User.find({
    $or: [
      { city: locationRegex },
      { district: locationRegex },
      { state: locationRegex }
    ]
  }).select('_id city district state');

  console.log(`Found ${matchingUsers.length} users in location: ${city}`);
  
  if (matchingUsers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        items: [],
        searchLocation: city,
        totalFound: 0,
        message: `No users found in ${city}`
      }, `No items found for location: ${city}`)
    );
  }

  // Extract user IDs
  const userIds = matchingUsers.map(user => user._id);
  
  // Now find items listed by these users
  const items = await Item.find({
    ...baseFilter,
    listedBy: { $in: userIds }
  })
  .populate('listedBy', 'username email fullName phoneNumber address state country pinCode district city profilePicture points')
  .sort({ createdAt: -1 });

  console.log(`Found ${items.length} items matching location: ${city}`);

  // Group items by seller location for debugging
  const locationBreakdown = {};
  items.forEach(item => {
    const sellerLocation = `${item.listedBy.city}, ${item.listedBy.district}, ${item.listedBy.state}`;
    locationBreakdown[sellerLocation] = (locationBreakdown[sellerLocation] || 0) + 1;
  });
  
  console.log('Items breakdown by seller location:', locationBreakdown);

  res.status(200).json(
    new ApiResponse(200, {
      items: items,
      searchLocation: city,
      totalFound: items.length,
      locationBreakdown
    }, `Items found for location: ${city}`)
  );
});

// Get all items with filtering
const getAllItems = asyncHandler(async (req, res) => {
  // First, let's see ALL items in the database for debugging
  const allItems = await Item.find({});
  console.log('Total items in database:', allItems.length);
  console.log('All items breakdown:');
  allItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} - approved: ${item.approved}, status: ${item.status}`);
  });

  const { category, subCategory, size, condition, status } = req.query;
  
  let filter = { 
    approved: true,
    status: 'available' // Only show available items in browse/product pages
  };
  
  // Exclude user's own items from general listings (only if user is authenticated)
  if (req.user && req.user._id) {
    filter.listedBy = { $ne: req.user._id };
    console.log('Excluding items from user:', req.user.username);
  }
  
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (size) filter.size = size;
  if (condition) filter.condition = condition;
  // Remove status filter from query params since we're forcing 'available'

  console.log('getAllItems filter:', filter);
  console.log('getAllItems query params:', req.query);

  const items = await Item.find(filter)
    .populate('listedBy', 'username email')
    .sort({ createdAt: -1 });

  console.log(`getAllItems found ${items.length} items`);
  console.log('First few items:', items.slice(0, 3).map(item => ({ 
    _id: item._id, 
    title: item.title, 
    approved: item.approved,
    status: item.status 
  })));

  res.status(200).json(
    new ApiResponse(200, items, "Items retrieved successfully")
  );
});

// Get item by ID
const getItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await Item.findById(id)
    .populate('listedBy', 'username email fullName phoneNumber address state country pinCode district city profilePicture points');

  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  res.status(200).json(
    new ApiResponse(200, item, "Item retrieved successfully")
  );
});

// Create new item
const createItem = asyncHandler(async (req, res) => {
  console.log('=== CREATE ITEM DEBUG ===');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  console.log('req.files type:', typeof req.files);
  console.log('req.files length:', req.files ? req.files.length : 0);
  console.log('req.user:', req.user ? { id: req.user._id, username: req.user.username } : 'No user');
  console.log('========================');
  
  const { title, description, category, subCategory, size, condition, pointsCost } = req.body;
  
  if (!title || !description || !category || !subCategory || !size || !condition || pointsCost === undefined) {
    console.log('Missing required fields:', { title, description, category, subCategory, size, condition, pointsCost });
    throw new ApiError(400, "All fields including points cost are required");
  }

  if (pointsCost < 0) {
    throw new ApiError(400, "Points cost cannot be negative");
  }

  if (!req.files || req.files.length === 0) {
    console.log('No files received in req.files, req.files:', req.files);
    throw new ApiError(400, "At least one image is required");
  }

  console.log('Processing', req.files.length, 'files');

  // Upload images to cloudinary
  const imageUrls = [];
  for (const file of req.files) {
    console.log('Processing file:', file.originalname, 'Size:', file.size, 'Buffer:', file.buffer ? 'exists' : 'missing');
    const result = await uploadOnCloudinary(file.buffer, file.originalname);
    if (result) {
      console.log('Successfully uploaded:', result.secure_url);
      imageUrls.push(result.secure_url);
    } else {
      console.log('Failed to upload file:', file.originalname);
    }
  }

  if (imageUrls.length === 0) {
    console.log('No images were successfully uploaded to Cloudinary');
    throw new ApiError(500, "Failed to upload images");
  }

  console.log('Creating item with data:', {
    title,
    description,
    category,
    subCategory,
    size,
    condition,
    pointsCost,
    imageCount: imageUrls.length,
    listedBy: req.user._id
  });

  const item = await Item.create({
    title,
    description,
    images: imageUrls,
    category,
    subCategory,
    size,
    condition,
    pointsCost,
    listedBy: req.user._id,
  });

  console.log('Item created successfully:', item._id);

  // Add item to user's listedItems
  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { listedItems: item._id } }
  );

  console.log('Item added to user listedItems');

  res.status(201).json(
    new ApiResponse(201, item, "Item created successfully")
  );
});

// Update item
const updateItem = asyncHandler(async (req, res) => {
  console.log('=== UPDATE ITEM DEBUG ===');
  console.log('Item ID:', req.params.id);
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  console.log('req.files length:', req.files ? req.files.length : 0);
  console.log('req.user:', req.user ? { id: req.user._id, username: req.user.username } : 'No user');
  console.log('========================');

  const { id } = req.params;
  const { title, description, category, subCategory, size, condition, pointsCost } = req.body;

  const item = await Item.findById(id);
  
  if (!item) {
    console.log('Item not found with ID:', id);
    throw new ApiError(404, "Item not found");
  }

  console.log('Found item:', {
    id: item._id,
    title: item.title,
    listedBy: item.listedBy,
    currentUserId: req.user._id
  });

  // Check if user is the lister or admin
  if (item.listedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    console.log('Permission denied. Item owner:', item.listedBy, 'Current user:', req.user._id);
    throw new ApiError(403, "You can only edit your own items");
  }

  // Handle new images if provided
  let imageUrls = item.images;
  if (req.files && req.files.length > 0) {
    console.log('Processing new images...');
    imageUrls = [];
    for (const file of req.files) {
      console.log('Processing file:', file.originalname, 'Size:', file.size);
      const result = await uploadOnCloudinary(file.buffer, file.originalname);
      if (result) {
        console.log('Successfully uploaded:', result.secure_url);
        imageUrls.push(result.secure_url);
      } else {
        console.log('Failed to upload file:', file.originalname);
      }
    }
  } else {
    console.log('No new images provided, keeping existing images:', imageUrls.length);
  }

  const updateData = {
    title: title || item.title,
    description: description || item.description,
    category: category || item.category,
    subCategory: subCategory || item.subCategory,
    size: size || item.size,
    condition: condition || item.condition,
    pointsCost: pointsCost !== undefined ? pointsCost : item.pointsCost,
    images: imageUrls,
  };

  console.log('Update data:', updateData);

  const updatedItem = await Item.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  console.log('Item updated successfully:', updatedItem._id);

  res.status(200).json(
    new ApiResponse(200, updatedItem, "Item updated successfully")
  );
});

// Delete item
const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await Item.findById(id);
  
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  // Check if user is the lister or admin
  if (item.listedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, "You can only delete your own items");
  }

  await Item.findByIdAndDelete(id);

  // Remove item from user's listedItems
  await User.findByIdAndUpdate(
    item.listedBy,
    { $pull: { listedItems: id } }
  );

  res.status(200).json(
    new ApiResponse(200, {}, "Item deleted successfully")
  );
});

// Get user's items for dashboard with status information
const getUserItemsForDashboard = asyncHandler(async (req, res) => {
  const items = await Item.find({ listedBy: req.user._id })
    .sort({ createdAt: -1 });

  // Categorize items by status
  const categorizedItems = {
    available: items.filter(item => item.status === 'available'),
    pending: items.filter(item => item.status === 'pending'),
    swapped: items.filter(item => item.status === 'swapped'),
    all: items
  };

  res.status(200).json(
    new ApiResponse(200, categorizedItems, "User dashboard items retrieved successfully")
  );
});

// Get items by comprehensive location search
const getItemsByLocation = asyncHandler(async (req, res) => {
  const { location, radius = 50 } = req.query; // radius in km for future enhancement
  
  if (!location) {
    throw new ApiError(400, "Location parameter is required");
  }

  console.log('Comprehensive location search for:', location);

  // Build base filter
  let baseFilter = { 
    approved: true,
    status: 'available'
  };
  
  // Exclude user's own items from search results (only if user is authenticated)
  if (req.user && req.user._id) {
    baseFilter.listedBy = { $ne: req.user._id };
    console.log('Excluding items from user:', req.user.username);
  }

  // Create a more flexible location search
  const locationRegex = new RegExp(location.trim(), 'i');
  
  // First, find users who match the location criteria
  const matchingUsers = await User.find({
    $or: [
      { city: locationRegex },
      { district: locationRegex },
      { state: locationRegex },
      { address: locationRegex },
      { pinCode: location.trim() } // Exact match for pin code
    ]
  }).select('_id city district state address pinCode');

  console.log(`Found ${matchingUsers.length} users matching location: ${location}`);
  
  if (matchingUsers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        items: [],
        locationGroups: {
          exactCityMatch: [],
          districtMatch: [],
          stateMatch: [],
          addressMatch: [],
          pinCodeMatch: []
        },
        searchLocation: location,
        totalFound: 0,
        message: `No users found matching location: ${location}`
      }, `No items found for location: ${location}`)
    );
  }

  // Extract user IDs
  const userIds = matchingUsers.map(user => user._id);
  
  // Now find items listed by these users
  const items = await Item.find({
    ...baseFilter,
    listedBy: { $in: userIds }
  })
  .populate('listedBy', 'username email fullName phoneNumber address state country pinCode district city profilePicture points')
  .sort({ createdAt: -1 });

  // Group results by location type for better presentation
  const locationGroups = {
    exactCityMatch: [],
    districtMatch: [],
    stateMatch: [],
    addressMatch: [],
    pinCodeMatch: []
  };

  items.forEach(item => {
    const user = item.listedBy;
    const searchTerm = location.trim().toLowerCase();
    
    if (user.city && user.city.toLowerCase().includes(searchTerm)) {
      locationGroups.exactCityMatch.push(item);
    } else if (user.district && user.district.toLowerCase().includes(searchTerm)) {
      locationGroups.districtMatch.push(item);
    } else if (user.state && user.state.toLowerCase().includes(searchTerm)) {
      locationGroups.stateMatch.push(item);
    } else if (user.pinCode === location.trim()) {
      locationGroups.pinCodeMatch.push(item);
    } else if (user.address && user.address.toLowerCase().includes(searchTerm)) {
      locationGroups.addressMatch.push(item);
    }
  });

  console.log(`Found ${items.length} items for location: ${location}`);
  console.log('Location breakdown:', {
    city: locationGroups.exactCityMatch.length,
    district: locationGroups.districtMatch.length,
    state: locationGroups.stateMatch.length,
    address: locationGroups.addressMatch.length,
    pinCode: locationGroups.pinCodeMatch.length
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: items,
      locationGroups,
      searchLocation: location,
      totalFound: items.length,
      breakdown: {
        exactCityMatch: locationGroups.exactCityMatch.length,
        districtMatch: locationGroups.districtMatch.length,
        stateMatch: locationGroups.stateMatch.length,
        addressMatch: locationGroups.addressMatch.length,
        pinCodeMatch: locationGroups.pinCodeMatch.length
      }
    }, `Items found for location: ${location}`)
  );
});

// Get items based on user's current location (for logged-in users)
const getItemsNearUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required for location-based recommendations");
  }

  const user = await User.findById(req.user._id);
  if (!user.city && !user.district && !user.state) {
    throw new ApiError(400, "Please complete your profile with location information to get location-based recommendations");
  }

  console.log(`Finding items near user's location: ${user.city}, ${user.district}, ${user.state}`);

  // Build base filter
  let baseFilter = { 
    approved: true,
    status: 'available',
    listedBy: { $ne: req.user._id } // Exclude user's own items
  };

  // Create location search terms based on user's profile
  const locationTerms = [];
  if (user.city) locationTerms.push(new RegExp(user.city.trim(), 'i'));
  if (user.district) locationTerms.push(new RegExp(user.district.trim(), 'i'));
  if (user.state) locationTerms.push(new RegExp(user.state.trim(), 'i'));

  // Find items where seller's location matches user's location
  const items = await Item.find(baseFilter)
    .populate({
      path: 'listedBy',
      match: { 
        $or: [
          { city: { $in: locationTerms } },
          { district: { $in: locationTerms } },
          { state: { $in: locationTerms } }
        ]
      },
      select: 'username email fullName phoneNumber address state country pinCode district city profilePicture points'
    })
    .sort({ createdAt: -1 });

  // Filter out items where the populate didn't match
  const filteredItems = items.filter(item => item.listedBy !== null);

  console.log(`Found ${filteredItems.length} items near user's location`);

  res.status(200).json(
    new ApiResponse(200, {
      items: filteredItems,
      userLocation: {
        city: user.city,
        district: user.district,
        state: user.state
      },
      totalFound: filteredItems.length
    }, "Items found near your location")
  );
});

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getUserItems,
  getUserItemsForDashboard,
  getItemsByCity,
  getItemsByLocation,
  getItemsNearUser,
};
