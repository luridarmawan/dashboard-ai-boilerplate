import express, { RequestHandler } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import crypto from "crypto";

// Helper function to properly handle IPv4 and IPv6 addresses
const getClientIP = (req: express.Request): string => {
  // Check for IP in various headers (in order of preference)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const clientIP = req.headers['x-client-ip'];

  // Use the first available IP from headers, fallback to req.ip
  const ip = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() :
             typeof realIP === 'string' ? realIP :
             typeof clientIP === 'string' ? clientIP :
             req.ip) || 'unknown';

  // Normalize IPv6 addresses by removing the IPv6 prefix if present
  return ip.replace(/^::ffff:/, '');
};

// Helper function to hash the authorization token
const hashAuth = (auth: string): string => {
  if (auth === 'unknown' || auth === '') {
    return 'unknown';
  }
  // Create a SHA-256 hash of the auth token for privacy and consistency
  return crypto.createHash('sha256').update(auth).digest('hex').substring(0, 16);
};

const generateKey = (req: express.Request): string => {
  const userAgent = req.header("User-Agent") || "noagent";
  const auth = hashAuth(req.header("Authorization") || "unknown");
  const key = getClientIP(req) + '-' + auth;
  // console.log("generateKey", key, req.originalUrl);
  return key;
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.VITE_API_RATE_LOGIN_LIMIT ?? "10"),
  message: "Too many login attempts. Take a break and try again later.",
  standardHeaders: true,
});

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
    // Rate Limiting: 100 requests per 15 minutes per API key
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.VITE_API_RATE_LIMIT ?? "300"), // limit per API Key
    message: {
      message: "Too many requests, please try again later.",
      retryAfter: "15 minutes"
    },
    keyGenerator: (req) => generateKey(req),
    standardHeaders: true,
    legacyHeaders: false,
  }) as unknown as RequestHandler,
  express.json({ limit: process.env.VITE_MAX_UPLOAD_SIZE || '50mb' }), // Increased limit for file uploads
  express.urlencoded({ extended: true, limit: process.env.VITE_MAX_UPLOAD_SIZE || '50mb' }), // For URL-encoded payloads
];
