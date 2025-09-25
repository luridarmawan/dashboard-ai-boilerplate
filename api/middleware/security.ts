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
      // TODO: perkuat sesuai kebutuhan; contoh: allow semua in dev
      cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
  hpp(), // parameter pollution protection
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit per IP
    standardHeaders: true,
    legacyHeaders: false,
  }) as unknown as RequestHandler,
];

// body size limit & json parser di main file:
// app.use(express.json({ limit: '100kb' }));
// app.use(express.urlencoded({ extended: true, limit: '100kb' }));
