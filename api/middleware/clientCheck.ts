import { Request, Response, NextFunction } from 'express';
import { isValidUUIDv7 } from '../utils/uuid';


export const permissionClientCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientId = req.headers['x-client-id'] as string;

    if (!isValidUUIDv7(clientId)){
      res.status(401).json({
        success: false,
        message: 'Invalid client id'
      });
      return;
    }

    if (!clientId) {
      res.status(401).json({
        success: false,
        message: 'Client ID required for permission checking'
      });
      return;
    }

    // check client exist

    next();
  } catch (error) {
    console.error('Client Check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in client check middleware'
    });
  }
}