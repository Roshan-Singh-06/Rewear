// Test controller imports
try {
  const controller = require("../controllers/transaction.controller");
  console.log("Controller imported successfully:", Object.keys(controller));
} catch (error) {
  console.error("Controller import failed:", error.message);
}

const verifyJWT = require("../middlewares/auth.middleware");
console.log("Middleware imported successfully:", typeof verifyJWT);
