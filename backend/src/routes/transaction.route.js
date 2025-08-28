const express = require("express");
const {
  createPointsPurchase,
  respondToPointsPurchase,
  markItemReceived,
  submitFeedback,
  submitFeedbackSimple,
  submitFeedbackFromNotification,
  getUserTransactions,
  getTransactionDetails,
  getPendingPurchases,
  getAllFeedback
} = require("../controllers/transaction.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Purchase routes
router.post("/purchase", createPointsPurchase);
router.patch("/purchase/:purchaseId/respond", respondToPointsPurchase);
router.patch("/purchase/:purchaseId/received", markItemReceived);
router.post("/purchase/:purchaseId/feedback", submitFeedback);

// Legacy notification-based feedback (must come before the generic route)
router.post("/feedback/notification/:notificationId", submitFeedbackFromNotification);

// Simple feedback for transactions
router.post("/feedback/:transactionType/:transactionId", submitFeedbackSimple);

// Transaction management
router.get("/transactions", getUserTransactions);
router.get("/transactions/:transactionId", getTransactionDetails);
router.get("/pending-purchases", getPendingPurchases);

// Debug endpoint to check feedback
router.get("/feedback/all", getAllFeedback);

module.exports = router;
