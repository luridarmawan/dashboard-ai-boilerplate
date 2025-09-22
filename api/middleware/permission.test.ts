import { Request, Response } from 'express';
import { permissionMiddleware, requirePermission, PermissionAction, checkMultiplePermissions } from './permission';
import { prisma } from '../database/init';

// Mock Prisma
jest.mock('../database/init', () => ({
  prisma: {
    group_user_maps: {
      findMany: jest.fn()
    },
    group_permissions: {
      findMany: jest.fn()
    }
  }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Permission Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        clientId: 'test-client-id'
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('permissionMiddleware', () => {
    it('should add permission methods to request object', async () => {
      // Mock database responses
      mockPrisma.group_user_maps.findMany.mockResolvedValue([
        { group_id: 'group-1' }
      ]);

      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: 'user', action: 'read' }
      ]);

      await permissionMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.permissions).toBeDefined();
      expect(typeof mockReq.permissions?.canRead).toBe('function');
      expect(typeof mockReq.permissions?.canEdit).toBe('function');
      expect(typeof mockReq.permissions?.canCreate).toBe('function');
      expect(typeof mockReq.permissions?.canManage).toBe('function');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await permissionMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required for permission checking'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Permission checking', () => {
    beforeEach(async () => {
      // Setup permission middleware first
      mockPrisma.group_user_maps.findMany.mockResolvedValue([
        { group_id: 'group-1' }
      ]);
      
      await permissionMiddleware(mockReq as Request, mockRes as Response, mockNext);
    });

    it('should return true for exact resource match', async () => {
      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: 'user', action: 'read' }
      ]);

      const canRead = await mockReq.permissions!.canRead('user');
      expect(canRead).toBe(true);
    });

    it('should return true for wildcard *.* permission', async () => {
      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: '*.*', action: 'read' }
      ]);

      const canRead = await mockReq.permissions!.canRead('user');
      expect(canRead).toBe(true);
      
      const canReadPayroll = await mockReq.permissions!.canRead('payroll');
      expect(canReadPayroll).toBe(true);
    });

    it('should return true for module wildcard permission', async () => {
      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: 'user.*', action: 'read' }
      ]);

      const canRead = await mockReq.permissions!.canRead('user.profile');
      expect(canRead).toBe(true);
      
      const canReadOther = await mockReq.permissions!.canRead('payroll.salary');
      expect(canReadOther).toBe(false);
    });

    it('should return true for manage permission on any action', async () => {
      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: 'user', action: 'manage' }
      ]);

      const canRead = await mockReq.permissions!.canRead('user');
      const canEdit = await mockReq.permissions!.canEdit('user');
      const canCreate = await mockReq.permissions!.canCreate('user');
      const canManage = await mockReq.permissions!.canManage('user');

      expect(canRead).toBe(true);
      expect(canEdit).toBe(true);
      expect(canCreate).toBe(true);
      expect(canManage).toBe(true);
    });

    it('should return false for no matching permission', async () => {
      mockPrisma.group_permissions.findMany.mockResolvedValue([
        { resource: 'user', action: 'read' }
      ]);

      const canEdit = await mockReq.permissions!.canEdit('user');
      expect(canEdit).toBe(false);
      
      const canReadPayroll = await mockReq.permissions!.canRead('payroll');
      expect(canReadPayroll).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    it('should call next() if user has permission', async () => {
      // Setup permissions
      mockReq.permissions = {
        canRead: jest.fn().mockResolvedValue(true),
        canEdit: jest.fn().mockResolvedValue(false),
        canCreate: jest.fn().mockResolvedValue(false),
        canManage: jest.fn().mockResolvedValue(false)
      };

      const middleware = requirePermission('user', PermissionAction.READ);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have permission', async () => {
      // Setup permissions
      mockReq.permissions = {
        canRead: jest.fn().mockResolvedValue(false),
        canEdit: jest.fn().mockResolvedValue(false),
        canCreate: jest.fn().mockResolvedValue(false),
        canManage: jest.fn().mockResolvedValue(false)
      };

      const middleware = requirePermission('user', PermissionAction.READ);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required permission: read on user'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if permissions not initialized', async () => {
      mockReq.permissions = undefined;

      const middleware = requirePermission('user', PermissionAction.READ);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Permission middleware not initialized. Make sure to use permissionMiddleware first.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkMultiplePermissions', () => {
    it('should check multiple permissions correctly', async () => {
      mockReq.permissions = {
        canRead: jest.fn().mockImplementation((resource) => 
          Promise.resolve(resource === 'user' || resource === 'payroll')
        ),
        canEdit: jest.fn().mockResolvedValue(false),
        canCreate: jest.fn().mockImplementation((resource) => 
          Promise.resolve(resource === 'user')
        ),
        canManage: jest.fn().mockResolvedValue(false)
      };

      const results = await checkMultiplePermissions(mockReq as Request, [
        { resource: 'user', action: PermissionAction.READ },
        { resource: 'user', action: PermissionAction.CREATE },
        { resource: 'payroll', action: PermissionAction.READ },
        { resource: 'payroll', action: PermissionAction.EDIT }
      ]);

      expect(results['user:read']).toBe(true);
      expect(results['user:create']).toBe(true);
      expect(results['payroll:read']).toBe(true);
      expect(results['payroll:edit']).toBe(false);
    });

    it('should throw error if permissions not initialized', async () => {
      mockReq.permissions = undefined;

      await expect(checkMultiplePermissions(mockReq as Request, [
        { resource: 'user', action: PermissionAction.READ }
      ])).rejects.toThrow('Permission middleware not initialized');
    });
  });
});