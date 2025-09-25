import express, { RequestHandler } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";

// body parser limit ditaruh di main server (example di bawah)
export const securityMiddlewares: RequestHandler[] = [
  helmet(),
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);

      // Get trusted domains from environment variable
      const trustedDomains = process.env.VITE_TRUSTED_DOMAIN
        ? process.env.VITE_TRUSTED_DOMAIN.split(',').map(domain => domain.trim())
        : [];

      // Allow localhost origins for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return cb(null, true);
      }

      // Check if the origin is in our trusted domains list
      if (trustedDomains.includes(origin)) {
        cb(null, true);
      } else {
        if (process.env.VITE_APP_DEBUG) {
          console.warn(`CORS blocked origin: ${origin}`);
        }
        // Create a clean error without stack trace
        const error = new Error('Not allowed by CORS');
        error.stack = undefined;
        cb(error);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
  hpp(), // parameter pollution protection
  rateLimit({
    // Rate Limiting: 100 requests per 15 minutes per IP
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit per IP
    standardHeaders: true,
    legacyHeaders: false,
  }) as unknown as RequestHandler,
  express.json({ limit: process.env.VITE_MAX_UPLOAD_SIZE || '50mb' }), // Increased limit for file uploads
  express.urlencoded({ extended: true, limit: process.env.VITE_MAX_UPLOAD_SIZE || '50mb' }), // For URL-encoded payloads
];
