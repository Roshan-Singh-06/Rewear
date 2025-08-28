const router = require("express").Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationById,
} = require("../controllers/notification.controller");
const verifyJWT = require("../middlewares/auth.middleware");

// All notification routes are protected
router.get("/", verifyJWT, getUserNotifications); // Get user's notifications
router.get("/unread-count", verifyJWT, getUnreadCount); // Get unread count
router.get("/:id", verifyJWT, getNotificationById); // Get notification details
router.put("/:id/read", verifyJWT, markAsRead); // Mark notification as read
router.put("/mark-all-read", verifyJWT, markAllAsRead); // Mark all as read
router.delete("/:id", verifyJWT, deleteNotification); // Delete notification

module.exports = router;
