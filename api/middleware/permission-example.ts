import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth';
import { permissionMiddleware, requirePermission, PermissionAction, checkMultiplePermissions } from './permission';

const router = Router();

// Example 1: Using permission middleware with manual checks
router.get('/users', authenticateToken, permissionMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user can read users
    const canRead = await req.permissions!.canRead('user');
    
    if (!canRead) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to read users.'
      });
    }

    // Your logic to fetch users
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: [] // Your user data here
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Example 2: Using requirePermission middleware for automatic permission checking
router.post('/users', 
  authenticateToken, 
  permissionMiddleware, 
  requirePermission('user', PermissionAction.CREATE),
  async (req: Request, res: Response) => {
    try {
      // If we reach here, user has permission to create users
      // Your logic to create user
      res.json({
        success: true,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Example 3: Using requirePermission for editing users
router.put('/users/:id', 
  authenticateToken, 
  permissionMiddleware, 
  requirePermission('user', PermissionAction.EDIT),
  async (req: Request, res: Response) => {
    try {
      // User has permission to edit users
      const userId = req.params.id;
      // Your logic to update user
      res.json({
        success: true,
        message: `User ${userId} updated successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Example 4: Checking multiple permissions at once
router.get('/dashboard', authenticateToken, permissionMiddleware, async (req: Request, res: Response) => {
  try {
    // Check multiple permissions
    const permissions = await checkMultiplePermissions(req, [
      { resource: 'user', action: PermissionAction.READ },
      { resource: 'payroll', action: PermissionAction.READ },
      { resource: 'reports', action: PermissionAction.READ }
    ]);

    // Build dashboard data based on permissions
    const dashboardData: any = {};

    if (permissions['user:read']) {
      dashboardData.users = {
        count: 100, // Your user count logic
        canManage: await req.permissions!.canManage('user')
      };
    }

    if (permissions['payroll:read']) {
      dashboardData.payroll = {
        totalAmount: 50000, // Your payroll logic
        canEdit: await req.permissions!.canEdit('payroll')
      };
    }

    if (permissions['reports:read']) {
      dashboardData.reports = {
        available: ['monthly', 'yearly'], // Your reports logic
        canCreate: await req.permissions!.canCreate('reports')
      };
    }

    res.json({
      success: true,
      data: dashboardData,
      permissions: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Example 5: Using wildcard permissions
router.get('/admin/settings', 
  authenticateToken, 
  permissionMiddleware, 
  requirePermission('*.*', PermissionAction.MANAGE), // Requires manage permission on all resources
  async (req: Request, res: Response) => {
    try {
      // Only users with *.* manage permission can access this
      res.json({
        success: true,
        message: 'Admin settings retrieved',
        data: {
          // Your admin settings
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Example 6: Module-specific wildcard permissions
router.get('/payroll/salary',
  authenticateToken,
  permissionMiddleware,
  requirePermission('payroll.*', PermissionAction.READ), // Requires read permission on any payroll resource
  async (req: Request, res: Response) => {
    try {
      // User has read access to payroll module
      res.json({
        success: true,
        message: 'Payroll salary data retrieved',
        data: {
          module: 'payroll',
          resource: 'salary',
          permission_required: 'payroll.*:read'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Example 7: Another payroll endpoint
router.get('/payroll/reports',
  authenticateToken,
  permissionMiddleware,
  requirePermission('payroll.*', PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        message: 'Payroll reports retrieved',
        data: {
          module: 'payroll',
          resource: 'reports',
          permission_required: 'payroll.*:read'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;