import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Sanitize string input to prevent SQL injection and XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters and patterns
  return input
    // Remove SQL injection patterns
    .replace(/['"`;\\]/g, '') // Remove quotes, backticks, semicolons, backslashes
    .replace(/(--|#|\/\*|\*\/)/g, '') // Remove SQL comments
    .replace(/(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/gi, '') // Remove SQL keywords
    // Remove potential XSS patterns
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    // Trim and normalize whitespace
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize object recursively
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// check: req.query
// ex: /users?limit=10&page=2
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters before validation
    const sanitizedQuery = sanitizeObject(req.query);
    const parsed = schema.safeParse(sanitizedQuery);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    // optionally attach parsed to req
    (req as any).validatedQuery = parsed.data;
    next();
  };
}

// check: req.params
// ex: /users/:id → /users/123
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize path parameters before validation
    const sanitizedParams = sanitizeObject(req.params);
    const parsed = schema.safeParse(sanitizedParams);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    (req as any).validatedParams = parsed.data;
    next();
  };
}

// check: req.body
// ex: POST /users { "email": "...", "password": "..." }
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body before validation
    const sanitizedBody = sanitizeObject(req.body);
    const parsed = schema.safeParse(sanitizedBody);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    (req as any).validatedBody = parsed.data;
    next();
  };
}
