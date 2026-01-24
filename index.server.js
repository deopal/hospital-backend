/**
 * Hospital Management Backend Server
 * Clean Architecture Entry Point
 */

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Load environment variables first
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
import { connectDatabase } from "./src/config/database.js";

// Routes
import routes from "./src/routes/index.js";

// Services
import { startReminderScheduler } from "./src/services/reminder/reminder.service.js";
import { initializeVideoSocket } from "./src/services/video/socket.handler.js";

const app = express();

// Create HTTP server for both Express and Socket.io
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount all routes under /api
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

const PORT = process.env.PORT || 2000;

// Initialize video consultation socket handlers
initializeVideoSocket(io);

// Use httpServer instead of app.listen for Socket.io support
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io initialized for video consultations`);

  // Start appointment reminder scheduler
  startReminderScheduler();
});

export { io };
export default app;
