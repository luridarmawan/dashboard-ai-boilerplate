import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/init';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        clientId?: string;
      };
    }
  }
}

// Authentication middleware to verify JWT tokens
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user data from database to ensure user still exists and is active
    const user = await prisma.users.findUnique({
      where: {
        id: decoded.userId,
        status_id: 0 // 0: active user
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        client_id: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Add user data to request object for use in route handlers
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      clientId: user.client_id || undefined
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional middleware for routes that can work with or without authentication
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      // If token is provided, verify it
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.users.findUnique({
        where: {
          id: decoded.userId,
          status_id: 0 // 0 = active user
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          client_id: true
        }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          clientId: user.client_id || undefined
        };
      }
    }

    // Continue regardless of whether authentication succeeded
    next();
  } catch (error) {
    // For optional auth, we don't fail the request if token is invalid
    console.error('Optional authentication error:', error);
    next();
  }
};