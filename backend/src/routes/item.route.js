const router = require("express").Router();
const {
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
} = require("../controllers/item.controller");
const verifyJWT = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const checkProfileComplete = require("../middlewares/profileComplete.middleware");
const { upload } = require("../middlewares/multer.middleware");

// Public Routes with optional authentication (to exclude user's own items)
router.get("/", optionalAuth, getAllItems); // List/browse items (with filters)
router.get("/search/city", optionalAuth, getItemsByCity); // Search items by city
router.get("/search/location", optionalAuth, getItemsByLocation); // Comprehensive location search
router.get("/near-me", verifyJWT, getItemsNearUser); // Items near user's location

// Protected Routes - specific routes MUST come before parameterized routes
router.get("/my-items", verifyJWT, getUserItems); // Get user's own items
router.get("/my-items/dashboard", verifyJWT, getUserItemsForDashboard); // Get user's items for dashboard
router.get("/:id", getItemById); // Item detail - MUST be after specific routes

router.post("/", verifyJWT, checkProfileComplete, upload.array(), createItem); // Add new item
router.put("/:id", verifyJWT, checkProfileComplete, upload.array(), updateItem); // Edit item (lister/admin)
router.delete("/:id", verifyJWT, deleteItem); // Remove item (lister/admin)

module.exports = router;
