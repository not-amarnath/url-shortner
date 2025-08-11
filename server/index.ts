import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { shortenUrl, redirectUrl } from "./routes/url";
import { getStoredUrls } from "./routes/debug";
import { getAllUrls, deleteUrl } from "./routes/admin";
import { authenticateUser, optionalAuth } from "./middleware/auth";
import { connectDB } from "./config/database";

export function createServer() {
  const app = express();

  // Connect to MongoDB
  connectDB();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Headers for iframe support
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.builder.codes https://builder.io");
    next();
  });

  // URL Shortener API routes (protected)
  app.post("/api/shorten", authenticateUser, shortenUrl);
  app.get("/api/debug/urls", getStoredUrls);

  // Admin API routes (protected)
  app.get("/api/admin/urls", authenticateUser, getAllUrls);
  app.delete("/api/urls/:shortCode", authenticateUser, deleteUrl);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Redirect route (must be after all other routes)
  app.get("/:shortCode", redirectUrl);

  return app;
}
