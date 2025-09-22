import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/init';
import { logs } from '../utils/logs';

// Extend Request interface to include permission methods
// Note: The user property is already extended in auth.ts
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
      permissions?: {
        canRead: (resource: string) => Promise<boolean>;
        canEdit: (resource: string) => Promise<boolean>;
        canCreate: (resource: string) => Promise<boolean>;
        canManage: (resource: string) => Promise<boolean>;
      };
    }
  }
}

// Permission actions enum
export enum PermissionAction {
  READ = 'read',
  EDIT = 'edit', 
  CREATE = 'create',
  MANAGE = 'manage'
}

// Interface for user permissions
interface UserPermission {
  resource: string;
  action: string;
}

/**
 * Check if a resource pattern matches the requested resource
 * Supports wildcard patterns like *.* for all resources
 */
const matchesResource = (pattern: string, resource: string): boolean => {
  // Exact match
  if (pattern === resource) {
    return true;
  }

  // Wildcard pattern *.* matches everything
  if (pattern === '*.*') {
    return true;
  }

  // Module wildcard pattern like "user.*" matches "user.create", "user.read", etc.
  if (pattern.endsWith('.*')) {
    const modulePattern = pattern.slice(0, -2);
    return resource.startsWith(modulePattern + '.') || resource.startsWith(modulePattern);
  }

  // Action wildcard pattern like "*.read" matches "user.read", "payroll.read", etc.
  if (pattern.startsWith('*.')) {
    const actionPattern = pattern.slice(2);
    return resource.endsWith('.' + actionPattern);
  }

  return false;
};

/**
 * Get all permissions for a user based on their group memberships
 */
const getUserPermissions = async (userId: string, email: string, clientId?: string): Promise<UserPermission[]> => {
  // Super Admin
  const adminEmails = process.env.VITE_SUPERADMIN?.split(',');
    if (adminEmails?.includes(email)) {
      return [
        { resource: '*.*', action: 'manage' }
      ];
    }

  try {
    // Get user's groups
    const userGroups = await prisma.group_user_maps.findMany({
      where: {
        user_id: userId,
        status_id: 0, // Active mappings only
        ...(clientId && { client_id: clientId })
      },
      select: {
        group_id: true
      }
    });

    if (userGroups.length === 0) {
      return [];
    }

    const groupIds = userGroups.map(ug => ug.group_id);

    // Get permissions for all user's groups
    const permissions = await prisma.group_permissions.findMany({
      where: {
        group_id: {
          in: groupIds
        },
        status_id: 0, // Active permissions only
        ...(clientId && { client_id: clientId })
      },
      select: {
        resource: true,
        action: true
      }
    });

    return permissions.map(p => ({
      resource: p.resource || '',
      action: p.action || ''
    }));
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
};

/**
 * Check if user has specific permission for a resource
 */
const hasPermission = async (userId: string, email: string, resource: string, action: PermissionAction, clientId?: string): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions(userId, email, clientId);
    
    // Check if user has the specific permission
    return permissions.some(permission => {
      const permissionResource = permission.resource;
      const permissionAction = permission.action;
      
      // Check if resource matches and action matches
      return matchesResource(permissionResource, resource) && 
             (permissionAction === action || permissionAction === PermissionAction.MANAGE);
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Permission middleware that adds permission checking methods to the request object
 * This middleware should be used after authentication middleware
 */
export const permissionMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required for permission checking'
      });
      return;
    }

    const userId = req.user.id;
    // Get client_id from user if available (you might need to adjust this based on your auth implementation)
    let clientId =  req.headers['x-client-id'] as string;
    if (!clientId) {
      clientId = (req.user as any).clientId;
      // res.status(401).json({
      //   success: false,
      //   message: 'Client ID required for permission checking'
      // });
      // return;
    }

    let currentUser = await prisma.users.findUnique({
      where: {
        id: userId,
        status_id: 0
      },
      select: {
        email: true,
      }
    });
    if (!currentUser){
      return;
    }

    // Add permission methods to request object
    req.permissions = {
      canRead: async (resource: string): Promise<boolean> => {
        return hasPermission(userId, currentUser?.email, resource, PermissionAction.READ, clientId);
      },
      
      canEdit: async (resource: string): Promise<boolean> => {
        return hasPermission(userId, currentUser?.email, resource, PermissionAction.EDIT, clientId);
      },
      
      canCreate: async (resource: string): Promise<boolean> => {
        return hasPermission(userId, currentUser?.email, resource, PermissionAction.CREATE, clientId);
      },
      
      canManage: async (resource: string): Promise<boolean> => {
        return hasPermission(userId, currentUser?.email, resource, PermissionAction.MANAGE, clientId);
      }
    };

    next();
  } catch (error) {
    console.error('Permission middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in permission middleware'
    });
  }
};

/**
 * Higher-order function to create permission-checking middleware for specific resources and actions
 */
export const requirePermission = (resource: string, action: PermissionAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.permissions) {
        res.status(500).json({
          success: false,
          message: 'Permission middleware not initialized. Make sure to use permissionMiddleware first.'
        });
        return;
      }

      let hasAccess = false;

      switch (action) {
        case PermissionAction.READ:
          hasAccess = await req.permissions.canRead(resource);
          break;
        case PermissionAction.EDIT:
          hasAccess = await req.permissions.canEdit(resource);
          break;
        case PermissionAction.CREATE:
          hasAccess = await req.permissions.canCreate(resource);
          break;
        case PermissionAction.MANAGE:
          hasAccess = await req.permissions.canManage(resource);
          break;
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${action} on ${resource}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

/**
 * Utility function to check multiple permissions at once
 */
export const checkMultiplePermissions = async (
  req: Request,
  checks: Array<{ resource: string; action: PermissionAction }>
): Promise<{ [key: string]: boolean }> => {
  if (!req.permissions) {
    throw new Error('Permission middleware not initialized');
  }

  const results: { [key: string]: boolean } = {};

  for (const check of checks) {
    const key = `${check.resource}:${check.action}`;
    
    switch (check.action) {
      case PermissionAction.READ:
        results[key] = await req.permissions.canRead(check.resource);
        break;
      case PermissionAction.EDIT:
        results[key] = await req.permissions.canEdit(check.resource);
        break;
      case PermissionAction.CREATE:
        results[key] = await req.permissions.canCreate(check.resource);
        break;
      case PermissionAction.MANAGE:
        results[key] = await req.permissions.canManage(check.resource);
        break;
    }
  }

  return results;
};