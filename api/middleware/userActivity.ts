import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/init';
import { logs, warn, errors } from '../utils'

// In-memory cache to store last update time for each user
// In production, use Redis or a similar caching solution
const lastUpdateCache = new Map<string, number>();

// Time window in milliseconds (1 minute) to prevent duplicate updates
const UPDATE_WINDOW = 60 * 1000;

// Middleware to update user activity (last_seen and ip)
export const userActivityMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the JWT token from the Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Get the user ID from the decoded token
      const userId = decoded.userId;
      
      if (userId) {
        // Check if we've recently updated this user's activity
        const lastUpdate = lastUpdateCache.get(userId);
        const now = Date.now();
        
        // Only update if it's been more than UPDATE_WINDOW since last update
        if (!lastUpdate || (now - lastUpdate) > UPDATE_WINDOW) {
          // Get the client's IP address
          // Check various headers that might contain the real IP
          const ip = req.headers['x-forwarded-for'] as string ||
                    req.headers['x-real-ip'] as string ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.ip ||
                    'unknown';
          
          // Update the user's last_seen and ip fields
          // Use updateMany to avoid P2025 error if user doesn't exist
          const updateResult = await prisma.users.updateMany({
            where: {
              id: userId
            },
            data: {
              last_seen: new Date(),
              ip: ip.split(',')[0].trim() // Take only the first IP if there are multiple
            }
          });
          
          // Only update cache and log if the user was actually found and updated
          if (updateResult.count > 0) {
            // Update the cache with the current time
            lastUpdateCache.set(userId, now);

            // Optional: Log for debugging (remove in production)
            logs("Updated user activity for:", userId, new Date());
          } else {
            warn("User not found for activity update:", userId);
          }
        }
      }
    }
  } catch (error) {
    // We don't want to interrupt the request if this fails
    errors('Error updating user activity:', error);
  }
  
  // Continue with the next middleware or route handler
  next();
};