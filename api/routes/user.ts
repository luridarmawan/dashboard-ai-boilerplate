import { Router } from 'express';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { permissionClientCheck } from '../middleware/clientCheck';
import { generateUUIDv7 } from '../utils/uuid';
import { getPermission } from '../utils/permission'
import emailService from '../../src/lib/email/email';
import { getUserGroupsAndPermissions } from '../services/userService';
import { validateQuery, validateBody, validateParams } from '../middleware/validate';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

// Schema for path parameter validation (UUID format)
const userPathSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Schema for user creation body validation
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  alias: z.string().optional(),
  description: z.string().optional(),
  send_email: z.boolean().optional(),
});

// Schema for user update body validation
const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().min(1, 'Phone cannot be empty').optional(),
  alias: z.string().optional(),
  description: z.string().optional(),
  statusId: z.number().int().min(0).max(1).optional(),
}).refine(data => data.firstName !== undefined || data.lastName !== undefined ||
                data.phone !== undefined || data.alias !== undefined ||
                data.description !== undefined || data.statusId !== undefined, {
  message: 'At least one field must be provided for update',
  path: ['firstName', 'lastName', 'phone', 'alias', 'description', 'statusId']
});

/**
 * @swagger
 * /v1/user:
 *   get:
 *     summary: List all users
 *     description: Retrieve a list of all users with optional search filtering (requires read permission on user resource)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the messages
 *       - name: q
 *         in: query
 *         required: false
 *         description: Search term to filter users by first name, last name, email, or phone
 *         schema:
 *           type: string
 *           example: john
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserWithStatus'
 *                     requestedBy:
 *                       $ref: '#/components/schemas/User'
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canManage:
 *                           type: boolean
 *                         canCreate:
 *                           type: boolean
 *                         canEdit:
 *                           type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', requirePermission('user', PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { q } = req.query;

    // Build where clause with search filter - only non deleted user (status_id <> 1)
    const whereClause: any = {
      client_id: clientId,
      status_id: { not: 1 }
    };

    // Add search filter if query parameter 'q' is provided
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        {
          first_name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          last_name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        created_at: true,
        last_seen: true,
        ip: true,
        status_id: true
      },
      where: whereClause,
      orderBy: [
        { first_name: 'asc' },
        { last_name: 'asc' }
      ]
    });

    // Check additional permissions for enhanced response
    const canManageUsers = await req.permissions!.canManage('user');
    const canCreateUsers = await req.permissions!.canCreate('user');
    const canEditUsers = await req.permissions!.canEdit('user');

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          alias: user.alias,
          description: user.description,
          createdAt: user.created_at,
          lastSeen: user.last_seen,
          ip: user.ip,
          statusId: user.status_id
        })),
        requestedBy: req.user, // Information about who made the request
        permissions: {
          canManage: canManageUsers,
          canCreate: canCreateUsers,
          canEdit: canEditUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/user/permission:
 *   get:
 *     summary: Get user permissions
 *     description: Retrieve the current user's permissions and group memberships
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant support
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Permission retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userGroupsPermissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           groupId:
 *                             type: integer
 *                             description: Group ID
 *                           groupName:
 *                             type: string
 *                             description: Group name
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 resource:
 *                                   type: string
 *                                   description: Resource name
 *                                 action:
 *                                   type: string
 *                                   description: Permission action
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions to access user data
 */
router.get('/permission', requirePermission('user', PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const userId = req.user!.id;

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
      status_id: 0
    },
    select: {
      id: true,
      email: true,
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const userGroupsPermissions = await getUserGroupsAndPermissions(userId, clientId);

  res.json({
    success: true,
    message: 'Permission retrieved successfully',
    data: {
      permissions: userGroupsPermissions
    }
  });
});

/**
 * Retrieve the current user's permissions and group memberships
 */
router.get('/scope', async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const userId = req.user!.id;

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
      status_id: 0
    },
    select: {
      id: true,
      email: true,
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const userGroupsPermissions = await getUserGroupsAndPermissions(userId, clientId);

  res.json({
    success: true,
    message: 'Permission retrieved successfully',
    data: {
      permissions: userGroupsPermissions
    }
  });
});

/**
 * @swagger
 * /v1/user/{id}:
 *   get:
 *     summary: Get specific user
 *     description: Retrieve information about a specific user by ID (requires read permission on user resource)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the messages
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserWithStatus'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', validateParams(userPathSchema), requirePermission('user', PermissionAction.READ), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        created_at: true,
        last_seen: true,
        ip: true,
        status_id: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        alias: user.alias,
        description: user.description,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
        ip: user.ip,
        statusId: user.status_id
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/user:
 *   post:
 *     summary: Create new user
 *     description: Create a new user (requires create permission on user resource)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               alias:
 *                 type: string
 *                 example: jsmith
 *               description:
 *                 type: string
 *                 example: Marketing Manager
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserWithStatus'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validateBody(createUserSchema), requirePermission('user', PermissionAction.CREATE), async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'] as string;
    const { email, firstName, lastName, phone, alias, description, send_email } = req.body;

    // Basic validation
    if (!email || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email, First Name, Last Name, and Phone are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    const userId = generateUUIDv7();

    // Create new user (in real app, you'd hash password, etc.)
    const newUser = await prisma.users.create({
      data: {
        id: userId,
        email,
        password_hash: 'no-password',
        first_name: firstName,
        last_name: lastName,
        phone,
        alias,
        description,
        client_id: clientId,
        status_id: 0
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        client_id: true,
        created_at: true,
        status_id: true
      }
    });

    if (send_email) {
      // Generate reset token
      const token = generateUUIDv7();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Store token in database
      await prisma.password_reset_tokens.create({
        data: {
          user_id: newUser.id,
          token: token,
          expires_at: expiresAt
        }
      });

      // Generate reset link
      const resetLink = `${process.env.VITE_APP_URL}/reset-password?token=${token}`;

      // Send email with invitation link using template
      try {
        await emailService.sendTemplate(
          email,
          'Welcome to ' + process.env.VITE_APP_NAME,
          'user-invitation.html',
          {
            firstName: newUser.first_name,
            resetLink: resetLink
          },
          {
            user_id: newUser.id
          }
        );
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Don't fail the request if email sending fails
      }


    } // if (sendEmail){

    // TODO: Map to default client

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        alias: newUser.alias,
        description: newUser.description,
        clientId: newUser.client_id,
        createdAt: newUser.created_at,
        statusId: newUser.status_id
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/user/:id - Update user (requires edit permission on user resource)
router.put('/:id', validateParams(userPathSchema), validateBody(updateUserSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, alias, description, statusId } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // user can edit self
    const permissions = await getPermission(req, 'user');
    if (!permissions.canEdit){
      if (req.user?.id != id){
        return res.status(403).json({
          success: false,
          message: 'Access Denied. Required pemission to edit on user'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
        ...(phone && { phone }),
        ...(alias && { alias }),
        ...(description && { description }),
        ...(statusId && { status_id: statusId }),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        updated_at: true,
        status_id: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        alias: updatedUser.alias,
        description: updatedUser.description,
        updatedAt: updatedUser.updated_at,
        statusId: updatedUser.status_id
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/user/:id - Delete user (requires manage permission on user resource)
router.delete('/:id', validateParams(userPathSchema), requirePermission('user', PermissionAction.MANAGE), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by updating status_id
    await prisma.users.update({
      where: { id },
      data: {
        status_id: 1, // 1 = deleted/inactive
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/user/profile/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the messages
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/UserWithStatus'
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canReadUsers:
 *                           type: boolean
 *                         canCreateUsers:
 *                           type: boolean
 *                         canEditUsers:
 *                           type: boolean
 *                         canManageUsers:
 *                           type: boolean
 *                         canReadPayroll:
 *                           type: boolean
 *                         canManageAll:
 *                           type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        status_id: 0
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        created_at: true,
        last_seen: true,
        status_id: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Check what permissions the user has
    const permissions = {
      canReadUsers: await req.permissions!.canRead('user'),
      canCreateUsers: await req.permissions!.canCreate('user'),
      canEditUsers: await req.permissions!.canEdit('user'),
      canManageUsers: await req.permissions!.canManage('user'),
      canReadPayroll: await req.permissions!.canRead('payroll'),
      canManageAll: await req.permissions!.canManage('*.*')
    };

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        profile: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          alias: user.alias,
          description: user.description,
          createdAt: user.created_at,
          lastSeen: user.last_seen,
          statusId: user.status_id
        },
        permissions
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
