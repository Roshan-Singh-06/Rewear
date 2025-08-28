// Test verifyJWT import
const verifyJWT = require("../middlewares/auth.middleware");

console.log("verifyJWT type:", typeof verifyJWT);
console.log("verifyJWT:", verifyJWT);

module.exports = verifyJWT;
