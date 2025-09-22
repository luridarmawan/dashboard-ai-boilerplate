import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { permissionClientCheck } from '../middleware/clientCheck';
import { generateUUIDv7, isValidUUIDv7 } from '../utils/uuid';
import { logs } from '../utils';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

/**
 * @swagger
 * /v1/group-permissions/{id}:
 *   get:
 *     summary: Get group permissions
 *     description: Get group permissions by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the conversation
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the group permission
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group permissions retrieved successfully
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
 *                   example: Group permissions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     group_permissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GroupPermission'
 */

router.get('/:id', requirePermission('groups', PermissionAction.READ), async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'] as string;
    const { id } = req.params;
    if (!isValidUUIDv7(id) || !isValidUUIDv7(clientId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid group permission ID or no client id provided`
      });
    }

    const groupPermissions = await prisma.group_permissions.findMany({
      where: {
        group_id: id,
        client_id: clientId,
        status_id: 0,
      },
      select: {
        id: true,
        name: true,
        resource: true,
        action: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      }
    });

    if (!groupPermissions) {
      return res.status(404).json({
        success: false,
        message: 'Group Permission not found'
      });
    }

    res.json({
      success: true,
      message: 'Group retrieved successfully',
      data: {
        group_permissions: groupPermissions
      },

    });

  } catch (error) {
    logs('Error fetching group permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});

/**
 * @swagger
 * /v1/group-permissions:
 *   post:
 *     summary: Create group permission
 *     description: Create a new group permission
 *     tags: [Groups]
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_id
 *               - name
 *             properties:
 *               group_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the group
 *               name:
 *                 type: string
 *                 description: Name of the permission
 *               resource:
 *                 type: string
 *                 description: Resource name
 *               action:
 *                 type: string
 *                 description: Action name
 *               order:
 *                 type: integer
 *                 description: Display order
 *     responses:
 *       201:
 *         description: Group permission created successfully
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
 *                   example: Group permission created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     group_permission:
 *                       $ref: '#/components/schemas/GroupPermission'
 */
router.post('/', requirePermission('groups', PermissionAction.CREATE), async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'] as string;
    const { group_id, name, resource, action, order } = req.body;

    if (!isValidUUIDv7(group_id) || !isValidUUIDv7(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID or permission ID provided'
      });
    }

    if (!group_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Group ID and name are required'
      });
    }

    if (!isValidUUIDv7(group_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID provided'
      });
    }

    // Check if group exists and belongs to client
    const group = await prisma.groups.findFirst({
      where: {
        id: group_id,
        client_id: clientId,
        status_id: { not: 1 }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const groupPermission = await prisma.group_permissions.create({
      data: {
        id: generateUUIDv7(),
        client_id: clientId,
        group_id,
        name,
        resource: resource || null,
        action: action || null,
        order: order || 0,
        status_id: 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Group permission created successfully',
      data: {
        group_permission: groupPermission
      }
    });

  } catch (error) {
    logs('Error creating group permission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/group-permissions/{permissionId}:
 *   put:
 *     summary: Update group permission
 *     description: Update an existing group permission
 *     tags: [Groups]
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the conversation
 *       - in: path
 *         name: permissionId
 *         required: true
 *         description: ID of the group permission to update
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the permission
 *               resource:
 *                 type: string
 *                 description: Resource name
 *               action:
 *                 type: string
 *                 description: Action name
 *               order:
 *                 type: integer
 *                 description: Display order
 *     responses:
 *       200:
 *         description: Group permission updated successfully
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
 *                   example: Group permission updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     group_permission:
 *                       $ref: '#/components/schemas/GroupPermission'
 */
router.put('/:permissionId', requirePermission('groups', PermissionAction.EDIT), async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'] as string;
    const { permissionId } = req.params;
    const { name, resource, action, order } = req.body;

    if (!isValidUUIDv7(permissionId) || !isValidUUIDv7(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission ID or client ID provided'
      });
    }

    // Check if permission exists and belongs to client
    const existingPermission = await prisma.group_permissions.findFirst({
      where: {
        id: permissionId,
        client_id: clientId,
        status_id: { not: 1 }
      }
    });

    if (!existingPermission) {
      return res.status(404).json({
        success: false,
        message: 'Group permission not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (resource !== undefined) updateData.resource = resource;
    if (action !== undefined) updateData.action = action;
    if (order !== undefined) updateData.order = order;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const updatedPermission = await prisma.group_permissions.update({
      where: { id: permissionId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Group permission updated successfully',
      data: {
        group_permission: updatedPermission
      }
    });

  } catch (error) {
    logs('Error updating group permission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/group-permissions/{permissionId}:
 *   delete:
 *     summary: Delete group permission
 *     description: Delete a group permission (soft delete by setting status_id to 0)
 *     tags: [Groups]
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for the conversation
 *       - in: path
 *         name: permissionId
 *         required: true
 *         description: ID of the group permission to delete
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Group permission deleted successfully
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
 *                   example: Group permission deleted successfully
 */
router.delete('/:permissionId', requirePermission('groups', PermissionAction.MANAGE), async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'] as string;
    const { permissionId } = req.params;

    if (!isValidUUIDv7(permissionId) || !isValidUUIDv7(clientId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid permission ID or client ID provided - ${permissionId} / ${clientId}`
      });
    }

    // Check if permission exists and belongs to client
    const existingPermission = await prisma.group_permissions.findFirst({
      where: {
        id: permissionId,
        client_id: clientId,
        status_id: { not: 1 }
      }
    });

    if (!existingPermission) {
      return res.status(404).json({
        success: false,
        message: 'Group permission not found'
      });
    }

    // Soft delete by setting status_id to 1
    await prisma.group_permissions.update({
      where: { id: permissionId },
      data: { status_id: 1 }
    });

    res.json({
      success: true,
      message: 'Group permission deleted successfully'
    });

  } catch (error) {
    logs('Error deleting group permission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
