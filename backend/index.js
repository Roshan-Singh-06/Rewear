const cookieParser = require("cookie-parser");
const Cors = require("cors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db.js");
const dotenv = require("dotenv");
const userRouter = require("./src/routes/user.route");
const itemRouter = require("./src/routes/item.route");
const swapRouter = require("./src/routes/swap.route");
const pointsRouter = require("./src/routes/points.route");
const adminRouter = require("./src/routes/admin.route");
const orderRouter = require("./src/routes/order.route");
const notificationRouter = require("./src/routes/notification.route");
const messageRouter = require("./src/routes/message.route.simple");
const transactionRouter = require("./src/routes/transaction.route");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Vite default
      "http://localhost:5174", // Alternative Vite port
      "http://localhost:5001", // Backend port for testing
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Make io available to routes
app.set('io', io);

app.use(
  Cors({
    origin: [
      "http://localhost:5173", // Vite default
      "http://localhost:5174", // Alternative Vite port
      "http://localhost:5001", // Backend port for testing
    ],
    credentials: true,
  })
);

app.use(express.static("public")); // This is a built-in middleware function in Express. It serves static files and is based on serve-static.
app.use(cookieParser()); // This is a third-party middleware function in Express. It parses cookies attached to the client request object.

// Apply body parsing middleware conditionally - not for multipart/form-data
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    // Skip body parsing for multipart/form-data, let multer handle it
    return next();
  }
  // Apply JSON and URL-encoded parsing for other content types
  express.json()(req, res, () => {
    express.urlencoded({ extended: true })(req, res, next);
  });
});

app.use("/api/users", userRouter); 
app.use("/api/items", itemRouter);
app.use("/api/swaps", swapRouter);
app.use("/api/points", pointsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/orders", orderRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/messages", messageRouter);
app.use("/api/transactions", transactionRouter);

// For now, create a simple WebSocket handler
// We'll implement full WebSocket service later if needed
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });
  
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat: ${chatId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});
