import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map<string, string>();

// Generate a new CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Store CSRF token for a session
export const storeCSRFToken = (sessionId: string, token: string): void => {
  csrfTokens.set(sessionId, token);
};

// Validate CSRF token
export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const storedToken = csrfTokens.get(sessionId);
  return storedToken === token;
};

// CSRF middleware
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow GET requests to the CSRF token endpoint without CSRF headers
  if (req.method === 'GET' && req.path === '/api/auth/csrf-token') {
    next();
    return;
  }
  
  // Only validate CSRF token for POST, PUT, DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const sessionId = req.headers['x-session-id'] as string;
    const csrfToken = req.headers['x-csrf-token'] as string;
    
    if (!sessionId || !csrfToken) {
      res.status(403).json({
        success: false,
        message: 'Missing CSRF protection headers'
      });
      return;
    }
    
    if (!validateCSRFToken(sessionId, csrfToken)) {
      res.status(403).json({
        success: false,
        message: '🔄 Oops! CSRF token mismatch.\nYour session may have shifted — try refreshing the page.'
      });
      return;
    }
  }
  
  next();
};

// Middleware to generate and send CSRF token
export const generateCSRFTokenMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');
  const csrfToken = generateCSRFToken();
  storeCSRFToken(sessionId, csrfToken);
  
  // Add CSRF token to response headers
  res.setHeader('X-CSRF-Token', csrfToken);
  res.setHeader('X-Session-ID', sessionId);
  
  next();
};
// Conditional CSRF middleware for MCP routes
export const mcpCSRFMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if CSRF is enabled for MCP routes
  const mcpUseCsrf = process.env.MCP_USE_CSRF === 'true';

  if (!mcpUseCsrf) {
    // If CSRF is disabled for MCP, skip validation
    next();
    return;
  }

  // If CSRF is enabled, use the standard CSRF middleware logic
  // Allow GET requests without CSRF headers
  if (req.method === 'GET') {
    next();
    return;
  }

  // Only validate CSRF token for POST, PUT, DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const sessionId = req.headers['x-session-id'] as string;
    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!sessionId || !csrfToken) {
      res.status(403).json({
        success: false,
        message: 'Missing CSRF protection headers'
      });
      return;
    }

    if (!validateCSRFToken(sessionId, csrfToken)) {
      res.status(403).json({
        success: false,
        message: '🔄 Oops! CSRF token mismatch.\nYour session may have shifted — try refreshing the page.'
      });
      return;
    }
  }

  next();
};