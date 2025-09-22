import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getPermission } from '../../../../api/utils/permission';
import { ucwords } from '../../../../api/utils/string';
import { generateUUIDv7, isValidUUIDv7 } from '../../../../api/utils/uuid';

const ModuleName = 'Example';
const router = Router();
const prisma = new PrismaClient();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

/**
 * @swagger
 * /v1/example:
 *   get:
 *     summary: Get examples list
 *     description: Retrieve a list of examples with optional search functionality. Only returns active examples (status_id != 1).<br>👉 Refer to the sample code in <code>'server/modules/example/*'</code>.
 *     tags:
 *       - Example
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter examples by name or description (case-insensitive)
 *     responses:
 *       200:
 *         description: Successfully retrieved examples list
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
 *                   example: "Examples retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Example ID
 *                       name:
 *                         type: string
 *                         description: Example name
 *                       description:
 *                         type: string
 *                         description: Example description
 *                       external:
 *                         type: boolean
 *                         description: External flag
 *                       client_id:
 *                         type: string
 *                         description: Client ID
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Creation timestamp
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Last update timestamp
 *                       status_id:
 *                         type: integer
 *                         description: Status ID (0 = active, 1 = inactive)
 *                         example: 0
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 *                   example: "Insufficient permissions"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.get('/', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const { q } = req.query;

  // Build where clause with search filter - only active data (status_id = 0)
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

  try {
    const examples = await prisma.examples.findMany({
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        external: true,
        metadata: true,
        status_id: true,
      },
      where: whereClause,
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Check additional permissions for enhanced response
    const canManageUsers = await req.permissions!.canManage('user');
    const canCreateUsers = await req.permissions!.canCreate('user');
    const canEditUsers = await req.permissions!.canEdit('user');

    res.json({
      success: true,
      message: `${ucwords(ModuleName)} retrieved successfully`,
      data: {
        examples: examples,
        requestedBy: req.user, // Information about who made the request
        permissions: await getPermission(req, ModuleName)
      },
      requestedBy: req.user, // Information about who made the request
      permissions: {
        canManage: canManageUsers,
        canCreate: canCreateUsers,
        canEdit: canEditUsers
      }
    });

  } catch (error) {
    console.error(`Error fetching ${ucwords(ModuleName)}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});

/**
 * @swagger
 * /v1/example/{id}:
 *   get:
 *     summary: Get example detail by ID
 *     description: Retrieve detailed information of a specific example by its ID.<br>👉 Refer to the sample code in <code>'server/modules/example/*'</code>.
 *     tags:
 *       - Example
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID
 *     responses:
 *       200:
 *         description: Successfully retrieved example detail
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
 *                   example: "Example retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Example ID
 *                     name:
 *                       type: string
 *                       description: Example name
 *                     description:
 *                       type: string
 *                       description: Example description
 *                     external:
 *                       type: boolean
 *                       description: External flag
 *                     metadata:
 *                       type: object
 *                       nullable: true
 *                       description: Additional metadata
 *                     client_id:
 *                       type: string
 *                       description: Client ID
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Creation timestamp
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last update timestamp
 *                     status_id:
 *                       type: integer
 *                       description: Status ID (0 = active, 1 = inactive)
 *                       example: 0
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 *                   example: "Insufficient permissions"
 *       404:
 *         description: Example not found
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
 *                   example: "Example not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.get('/:id', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;

    if (!isValidUUIDv7(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${id}`
      });
    }

    // Check if exists
    const existingData = await prisma.examples.findUnique({
      where: {
        id,
        client_id: clientId,
        status_id: {
          not: 1
        }
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        external: true,
        metadata: true,
        created_at: true,
        status_id: true
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: `${ucwords(ModuleName)} not found`
      });
    }

    res.json({
      success: true,
      message: `${ucwords(ModuleName)} retrieved successfully`,
      data: existingData
    });
  } catch (error) {
    console.error(`Error fetching ${ucwords(ModuleName)}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

  res.status(500).json({
    success: false,
    message: 'test api example detail'
  });
})

/**
 * @swagger
 * /v1/example:
 *   post:
 *     summary: Create a new example
 *     description: Create a new example with the provided data. Name must be unique within the client.<br>👉 Refer to the sample code in <code>'server/modules/example/*'</code>.
 *     tags:
 *       - Example
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
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
 *                 description: Example name (must be unique within client)
 *                 example: "My Example"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Example description
 *                 example: "This is an example description"
 *               external:
 *                 type: boolean
 *                 nullable: true
 *                 description: External flag
 *                 example: true
 *     responses:
 *       201:
 *         description: Example created successfully
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
 *                   example: "Example created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Generated example ID (UUIDv7)
 *                     clientId:
 *                       type: string
 *                       description: Client ID
 *                     name:
 *                       type: string
 *                       description: Example name
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       description: Example description
 *                     external:
 *                       type: boolean
 *                       description: External flag
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Creation timestamp
 *                     statusId:
 *                       type: integer
 *                       description: Status ID (0 = active)
 *                       example: 0
 *       400:
 *         description: Bad request - Missing required fields
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
 *                   example: "Name is required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 *                   example: "Insufficient permissions"
 *       409:
 *         description: Conflict - Example with same name already exists
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
 *                   example: "Example with this name \"My Example\" already exists"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.post('/', requirePermission(ModuleName, PermissionAction.CREATE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { name, description, external } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if data with same name already exists
    const existingData = await prisma.examples.findFirst({
      where: {
        name,
        client_id: clientId || null,
        status_id: 0 // Only check active data
      }
    });

    if (existingData) {
      return res.status(409).json({
        success: false,
        message: `${ucwords(ModuleName)} with this name "${name}" already exists`
      });
    }

    const newId = generateUUIDv7();

    // Create new data
    const newData = await prisma.examples.create({
      data: {
        id: newId,
        name,
        description,
        external: external || false,
        client_id: clientId,
        status_id: 0 // Active group
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        external: true,
        created_at: true,
        status_id: true
      }
    });

    res.status(201).json({
      success: true,
      message: `${ucwords(ModuleName)} created successfully`,
      data: {
        id: newData.id,
        clientId: newData.client_id,
        name: newData.name,
        description: newData.description,
        external: newData.external,
        createdAt: newData.created_at,
        statusId: newData.status_id
      }
    });
  } catch (error) {
    console.error(`Error creating ${ucwords(ModuleName)}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});

/**
 * @swagger
 * /v1/example/{id}:
 *   put:
 *     summary: Update an existing example
 *     description: Update an existing example with the provided data. Name must be unique within the client if changed.<br>👉 Refer to the sample code in <code>'server/modules/example/*'</code>.
 *     tags:
 *       - Example
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Example name (must be unique within client)
 *                 example: "Updated Example Name"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Example description
 *                 example: "Updated description"
 *               external:
 *                 type: boolean
 *                 nullable: true
 *                 description: External flag
 *                 example: false
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata
 *                 example: {"key": "value"}
 *               status_id:
 *                 type: integer
 *                 description: Status ID (0 = active, 1 = inactive)
 *                 example: 0
 *     responses:
 *       200:
 *         description: Example updated successfully
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
 *                   example: "Example updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Example ID
 *                     clientId:
 *                       type: string
 *                       description: Client ID
 *                     name:
 *                       type: string
 *                       description: Updated example name
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       description: Updated example description
 *                     external:
 *                       type: boolean
 *                       nullable: true
 *                       description: Updated external flag
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Original creation timestamp
 *                     statusId:
 *                       type: integer
 *                       description: Updated status ID
 *                       example: 0
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 *                   example: "Insufficient permissions"
 *       404:
 *         description: Example not found
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
 *                   example: "Example not found"
 *       409:
 *         description: Conflict - Example with same name already exists
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
 *                   example: "Example with this name \"Updated Example Name\" already exists"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.put('/:id', requirePermission(ModuleName, PermissionAction.EDIT), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;
    const { name, description, external, metadata, status_id } = req.body;

    // Check if exists
    const existingData = await prisma.examples.findUnique({
      where: {
        id,
        client_id: clientId,
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: `${ucwords(ModuleName)} not found`
      });
    }

    // Check if another data with same name exists (if name is being updated)
    if (name && name !== existingData.name) {
      const duplicateData = await prisma.examples.findFirst({
        where: {
          name,
          client_id: clientId,
          status_id: 0, // Only check active data
          id: { not: id } // Exclude current data
        }
      });

      if (duplicateData) {
        return res.status(409).json({
          success: false,
          message: `${ucwords(ModuleName)} with this name "${name}" already exists`
        });
      }
    }

    // Update data
    const updatedData = await prisma.examples.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(external !== undefined && { external }),
        ...(metadata !== undefined && { metadata }),
        ...(status_id !== undefined && { status_id }),
      },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        external: true,
        created_at: true,
        status_id: true
      }
    });

    res.json({
      success: true,
      message: `${ucwords(ModuleName)} updated successfully`,
      data: {
        id: updatedData.id,
        clientId: updatedData.client_id,
        name: updatedData.name,
        description: updatedData.description,
        external: updatedData.external,
        createdAt: updatedData.created_at,
        statusId: updatedData.status_id
      }
    });
  } catch (error) {
    console.error(`Error updating ${ucwords(ModuleName)}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }

});

/**
 * @swagger
 * /v1/example/{id}:
 *   delete:
 *     summary: Delete an example (soft delete)
 *     description: Soft delete an example by setting its status_id to 1 (inactive). The example will no longer appear in active lists but remains in the database.<br>👉 Refer to the sample code in <code>'server/modules/example/*'</code>.
 *     tags:
 *       - Example
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID to delete
 *     responses:
 *       200:
 *         description: Example deleted successfully
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
 *                   example: "Example deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Unauthorized access"
 *       403:
 *         description: Forbidden - Insufficient permissions (requires MANAGE permission)
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
 *                   example: "Insufficient permissions"
 *       404:
 *         description: Example not found
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
 *                   example: "Example not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.delete('/:id', requirePermission(ModuleName, PermissionAction.MANAGE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  try {
    const { id } = req.params;

    if (!isValidUUIDv7(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${id}`
      });
    }

    // Check if exists
    const existingData = await prisma.examples.findUnique({
      where: {
        id,
        client_id: clientId,
        status_id: {
          not: 1
        }
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: `${ucwords(ModuleName)} not found`
      });
    }

    // Soft delete by updating status_id
    await prisma.examples.update({
      where: { id },
      data: {
        status_id: 1 // 1 = deleted/inactive
      }
    });

    res.json({
      success: true,
      message: `${ucwords(ModuleName)} '${existingData.name}' deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting ${ucwords(ModuleName)}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
