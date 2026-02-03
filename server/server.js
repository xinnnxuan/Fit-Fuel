require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const mongoSanitize = require("mongo-sanitize");
const path = require("path");
const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const activityRoutes = require("./routes/activities");
const goalRoutes = require("./routes/goals");
const preferenceRoutes = require("./routes/preferences");
const feedRoutes = require("./routes/feed");
const recommendationRoutes = require("./routes/recommendations");
const config = require("./config");

const app = express();

mongoose
  .connect(config.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    retryWrites: true,
    w: "majority",
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Connection string (masked):", config.MONGO_URI ? config.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "NOT SET");
  });

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    if (config.NODE_ENV === "development") {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === config.FRONTEND_ORIGIN
      ) {
        callback(null, true);
      } else {
        console.warn("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    } else {
      // In production, allow requests from the same origin (since we're serving static files)
      // Also allow the configured FRONTEND_ORIGIN if it's different
      const allowedOrigins = config.FRONTEND_ORIGIN 
        ? [config.FRONTEND_ORIGIN] 
        : [];
      // If no origin (same-origin request) or origin matches allowed, allow it
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (config.NODE_ENV === "development") {
    if (
      !origin ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin === config.FRONTEND_ORIGIN
    ) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      res.header("Access-Control-Expose-Headers", "Authorization");
    }
  }
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === "development" ? 1000 : 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Serve static files from the parent directory (HTML, CSS, JS, images)
// This must come before the SPA catch-all route
const staticPath = path.join(__dirname, "..");
app.use(express.static(staticPath));

// For SPA routing: serve index.html for all non-API routes
// This handles client-side routing for the single-page application
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Route not found" });
  }
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(staticPath, "index.html"));
});

// Error handler middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request payload too large. Please reduce image size.",
      error: err.message,
    });
  }

  if (err.name === "PayloadTooLargeError") {
    return res.status(413).json({
      message: "Request payload too large. Please reduce image size.",
      error: err.message,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(config.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend origin: ${config.FRONTEND_ORIGIN}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});
