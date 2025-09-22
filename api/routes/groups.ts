import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { permissionClientCheck } from '../middleware/clientCheck';
import { generateUUIDv7 } from '../utils/uuid';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

/**
 * @swagger
 * /v1/groups:
 *   get:
 *     summary: List all active groups
 *     description: Retrieve a list of all active groups (status_id=0) with optional search filtering (requires read permission on groups resource)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: Search term to filter groups by name or description
 *         schema:
 *           type: string
 *           example: admin
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
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
 *                   example: Groups retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Group'
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
router.get('/', requirePermission('groups', PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'];
  try {
    const { q } = req.query;

    // Build where clause with search filter - only active groups (status_id = 0)
    const whereClause: any = {
      client_id: clientId,
      status_id: {
        not: 1
      }
    };

    // Add search filter if query parameter 'q' is provided
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    const groups = await prisma.groups.findMany({
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        created_at: true,
        status_id: true
      },
      where: whereClause,
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Check additional permissions for enhanced response
    const canManageGroups = await req.permissions!.canManage('groups');
    const canCreateGroups = await req.permissions!.canCreate('groups');
    const canEditGroups = await req.permissions!.canEdit('groups');

    res.json({
      success: true,
      message: 'Groups retrieved successfully',
      data: {
        groups: groups.map(group => ({
          id: group.id,
          clientId: group.client_id,
          name: group.name,
          description: group.description,
          createdAt: group.created_at,
          statusId: group.status_id
        })),
        requestedBy: req.user, // Information about who made the request
        permissions: {
          canManage: canManageGroups,
          canCreate: canCreateGroups,
          canEdit: canEditGroups
        }
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/groups/{id}:
 *   get:
 *     summary: Get specific group
 *     description: Retrieve information about a specific group by ID (requires read permission on groups resource)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Group ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Group retrieved successfully
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
 *                   example: Group retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', requirePermission('groups', PermissionAction.READ), async (req, res) => {
  try {
    const { id } = req.params;

    const group = await prisma.groups.findUnique({
      where: { 
        id,
        status_id: {
          not: 1
        }
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        created_at: true,
        status_id: true
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      message: 'Group retrieved successfully',
      data: {
        id: group.id,
        clientId: group.client_id,
        name: group.name,
        description: group.description,
        createdAt: group.created_at,
        statusId: group.status_id
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/groups:
 *   post:
 *     summary: Create new group
 *     description: Create a new group (requires create permission on groups resource)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Administrators
 *               description:
 *                 type: string
 *                 example: System administrators group
 *               clientId:
 *                 type: string
 *                 example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       201:
 *         description: Group created successfully
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
 *                   example: Group created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
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
router.post('/', requirePermission('groups', PermissionAction.CREATE), async (req, res) => {
  try {
    const { name, description } = req.body;
    const clientId = req.headers['x-client-id'] as string;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if group with same name already exists
    const existingGroup = await prisma.groups.findFirst({
      where: { 
        name,
        client_id: clientId || null,
        status_id: 0 // Only check active groups
      }
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: 'Group with this name already exists'
      });
    }

    const groupId = generateUUIDv7();

    // Create new group
    const newGroup = await prisma.groups.create({
      data: {
        id: groupId,
        name,
        description,
        client_id: clientId,
        status_id: 0 // Active group
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        created_at: true,
        status_id: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        id: newGroup.id,
        clientId: newGroup.client_id,
        name: newGroup.name,
        description: newGroup.description,
        createdAt: newGroup.created_at,
        statusId: newGroup.status_id
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/groups/{id}:
 *   put:
 *     summary: Update group
 *     description: Update an existing group (requires edit permission on groups resource)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Group ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Group Name
 *               description:
 *                 type: string
 *                 example: Updated group description
 *               statusId:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Group updated successfully
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
 *                   example: Group updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', requirePermission('groups', PermissionAction.EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, statusId } = req.body;

    // Check if group exists
    const existingGroup = await prisma.groups.findUnique({
      where: { id }
    });

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if another group with same name exists (if name is being updated)
    if (name && name !== existingGroup.name) {
      const duplicateGroup = await prisma.groups.findFirst({
        where: { 
          name,
          status_id: 0, // Only check active groups
          id: { not: id } // Exclude current group
        }
      });

      if (duplicateGroup) {
        return res.status(409).json({
          success: false,
          message: 'Group with this name already exists'
        });
      }
    }

    // Update group
    const updatedGroup = await prisma.groups.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(statusId !== undefined && { status_id: statusId })
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        created_at: true,
        status_id: true
      }
    });

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: {
        id: updatedGroup.id,
        clientId: updatedGroup.client_id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        createdAt: updatedGroup.created_at,
        statusId: updatedGroup.status_id
      }
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/groups/{id}:
 *   delete:
 *     summary: Delete group
 *     description: Soft delete a group by setting status_id to 1 (requires manage permission on groups resource)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Group ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Group deleted successfully
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
 *                   example: Group deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', requirePermission('groups', PermissionAction.MANAGE), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if group exists
    const existingGroup = await prisma.groups.findUnique({
      where: { id }
    });

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Soft delete by updating status_id
    await prisma.groups.update({
      where: { id },
      data: {
        status_id: 1 // 1 = deleted/inactive
      }
    });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;