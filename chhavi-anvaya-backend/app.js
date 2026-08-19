require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const followRoutes = require("./routes/followRoutes");
const videoRoutes = require("./routes/videoRoutes");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        mediaSrc: ["'self'", "blob:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  })
);

// Response compression
app.use(compression());

// HTTP request logging — skip in test
if (process.env.NODE_ENV !== "test") {
  const { httpLogger } = require("./config/logger");
  app.use(httpLogger);
}

// Rate limiting on auth endpoints — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_URL || "http://localhost:3000")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!origin || allowed.includes("*") || allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/images", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "images")));

app.use("/media", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Accept-Ranges", "bytes");
  next();
}, express.static(path.join(__dirname, "videos", "uploads"), { acceptRanges: true }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/protected", protectedRoutes);

const resolveFrontend = () => {
  const candidates = [
    path.join(__dirname, "client"),
    path.join(process.cwd(), "client"),
    path.join(__dirname, "public"),
    path.join(process.cwd(), "public"),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) || null;
};

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

const frontendDir = resolveFrontend();

if (frontendDir) {
  const frontendIndex = path.join(frontendDir, "index.html");
  app.use(express.static(frontendDir));
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/media") ||
      req.path.startsWith("/images")
    ) {
      return next();
    }
    res.sendFile(frontendIndex);
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "Clipstream API",
      status: "ok",
      videos: "/api/videos",
      health: "/health",
      ui: false,
    });
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  console.error(err);
  res.status(status).json({ message });
});

module.exports = app;
