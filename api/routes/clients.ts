import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { generateUUIDv7 } from '../utils/uuid';
import { seedGroup, seedCategory, seedConfiguration } from '../database/seeder';
import { logs, errors } from '../utils/logs'

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes
router.use(authenticateToken);
router.use(permissionMiddleware);

/**
 * @swagger
 * /v1/client:
 *   get:
 *     summary: Get clients for authenticated user
 *     description: Retrieve a list of clients. If user has 'canManage("clients")' permission, shows all clients. Otherwise, shows only clients associated with the user through client_user_maps.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: Search term to filter clients by name or description
 *         schema:
 *           type: string
 *           example: company
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
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
 *                   example: Clients retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     clients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 01234567-89ab-cdef-0123-456789abcdef
 *                           name:
 *                             type: string
 *                             example: Company ABC
 *                           description:
 *                             type: string
 *                             example: Main client company
 *                           parentId:
 *                             type: string
 *                             nullable: true
 *                             example: 01234567-89ab-cdef-0123-456789abcdef
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           statusId:
 *                             type: integer
 *                             example: 1
 *                           userRole:
 *                             type: string
 *                             nullable: true
 *                             example: admin
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     canManage:
 *                       type: boolean
 *                       example: false
 *                       description: Indicates if the user has manage permission for clients
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', requirePermission('clients', PermissionAction.READ), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { q } = req.query;
    const currentClientId = req.headers['x-client-id'];

    // Check if user can manage all clients
    const canManageClients = await req.permissions!.canManage('clients');

    // Build where clause for search
    const clientWhereClause: any = {
      status_id: { not: 1 } // Exclude deleted clients (1 = deleted)
    };

    // Add search filter if query parameter 'q' is provided
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      clientWhereClause.OR = [
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

    let clients;
    let clientRoleMap = new Map();

    if (canManageClients) {
      // User can manage clients - show all clients
      clients = await prisma.clients.findMany({
        where: clientWhereClause,
        select: {
          id: true,
          parent_id: true,
          name: true,
          description: true,
          metadata: true,
          created_at: true,
          status_id: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      // For managers, we still want to show their role if they have one
      const userClientMaps = await prisma.client_user_maps.findMany({
        where: {
          user_id: userId,
          status_id: { not: 1 }
        }
      });

      userClientMaps.forEach(mapping => {
        clientRoleMap.set(mapping.client_id, mapping.role_id);
      });

    } else {
      // Regular user - only show clients they're mapped to
      const clientUserMaps = await prisma.client_user_maps.findMany({
        where: {
          user_id: userId,
          status_id: { not: 1 } // Exclude deleted mappings
        }
      });

      // Get client IDs from the mappings
      const clientIds = clientUserMaps.map(mapping => mapping.client_id);

      if (clientIds.length === 0) {
        return res.json({
          success: true,
          message: 'No clients found for this user',
          data: {
            clients: [],
            total: 0,
            canManage: false
          }
        });
      }

      // Get clients data
      clients = await prisma.clients.findMany({
        where: {
          id: { in: clientIds },
          ...clientWhereClause
        },
        select: {
          id: true,
          parent_id: true,
          name: true,
          description: true,
          metadata: true,
          created_at: true,
          status_id: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      // Create a map of client_id to role_id for quick lookup
      clientUserMaps.forEach(mapping => {
        clientRoleMap.set(mapping.client_id, mapping.role_id);
      });
    }

    // Format response data
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      description: client.description,
      parentId: client.parent_id,
      metadata: client.metadata,
      createdAt: client.created_at,
      statusId: client.status_id,
      userRole: clientRoleMap.get(client.id) || null
    }));

    res.json({
      success: true,
      message: 'Clients retrieved successfully',
      data: {
        clients: formattedClients,
        total: formattedClients.length,
        canManage: canManageClients
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Untuk client list di footer sideber
 * fitur sama dengan "/" tetapi khusus hanya ke specific user client
 */
router.get('/scope', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { q } = req.query;
    const currentClientId = req.headers['x-client-id'];

    // Check if user can manage all clients
    const canManageClients = await req.permissions!.canManage('clients');

    // Build where clause for search
    const clientWhereClause: any = {
      status_id: 0
    };

    // Add search filter if query parameter 'q' is provided
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      clientWhereClause.OR = [
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

    let clients;
    let clientRoleMap = new Map();

    if (canManageClients) {
      // User can manage clients - show all clients
      clients = await prisma.clients.findMany({
        where: clientWhereClause,
        select: {
          id: true,
          parent_id: true,
          name: true,
          description: true,
          metadata: true,
          created_at: true,
          status_id: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      // For managers, we still want to show their role if they have one
      const userClientMaps = await prisma.client_user_maps.findMany({
        where: {
          user_id: userId,
          status_id: 0
        }
      });

      userClientMaps.forEach(mapping => {
        clientRoleMap.set(mapping.client_id, mapping.role_id);
      });

    } else {
      // Regular user - only show clients they're mapped to
      const clientUserMaps = await prisma.client_user_maps.findMany({
        where: {
          user_id: userId,
          status_id: 0
        }
      });

      // Get client IDs from the mappings
      const clientIds = clientUserMaps.map(mapping => mapping.client_id);

      if (clientIds.length === 0) {
        return res.json({
          success: true,
          message: 'No clients found for this user',
          data: {
            clients: [],
            total: 0,
            canManage: false
          }
        });
      }

      // Get clients data
      clients = await prisma.clients.findMany({
        where: {
          id: { in: clientIds },
          ...clientWhereClause
        },
        select: {
          id: true,
          parent_id: true,
          name: true,
          description: true,
          metadata: true,
          created_at: true,
          status_id: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      // Create a map of client_id to role_id for quick lookup
      clientUserMaps.forEach(mapping => {
        clientRoleMap.set(mapping.client_id, mapping.role_id);
      });
    }

    // Format response data
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      description: client.description,
      parentId: client.parent_id,
      metadata: client.metadata,
      createdAt: client.created_at,
      statusId: client.status_id,
      userRole: clientRoleMap.get(client.id) || null
    }));

    res.json({
      success: true,
      message: 'Clients retrieved successfully',
      data: {
        clients: formattedClients,
        total: formattedClients.length,
        canManage: canManageClients
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * @swagger
 * /v1/client/{id}:
 *   get:
 *     summary: Get specific client
 *     description: Retrieve information about a specific client by ID (requires read permission on clients resource)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Client retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', requirePermission('clients', PermissionAction.READ), async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.clients.findUnique({
      where: { id },
      select: {
        id: true,
        parent_id: true,
        name: true,
        description: true,
        metadata: true,
        created_at: true,
        status_id: true
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client retrieved successfully',
      data: {
        id: client.id,
        name: client.name,
        description: client.description,
        parentId: client.parent_id,
        metadata: client.metadata,
        createdAt: client.created_at,
        statusId: client.status_id
      }
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/client:
 *   post:
 *     summary: Create new client
 *     description: Create a new client (requires create permission on clients resource)
 *     tags: [Clients]
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
 *                 example: Company ABC
 *               description:
 *                 type: string
 *                 example: Main client company
 *               parentId:
 *                 type: string
 *                 example: 01234567-89ab-cdef-0123-456789abcdef
 *               metadata:
 *                 type: object
 *                 example: {}
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict - Client already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', requirePermission('clients', PermissionAction.CREATE), async (req, res) => {
  try {
    const { name, description, parentId, metadata } = req.body;
    const currentClientId = req.headers['x-client-id'] as string;

    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Client name is required'
      });
    }

    // Check if client with same name already exists
    const existingClient = await prisma.clients.findFirst({
      where: { 
        name: name.trim(),
        status_id: { not: 1 } // Exclude deleted clients
      }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Client with this name already exists'
      });
    }

    const clientId = generateUUIDv7();

    // Create new client
    const newClient = await prisma.clients.create({
      data: {
        id: clientId,
        name: name.trim(),
        description: description?.trim() || null,
        parent_id: currentClientId || null,
        metadata: metadata || null,
        status_id: 0 // 0 = active
      },
      select: {
        id: true,
        parent_id: true,
        name: true,
        description: true,
        metadata: true,
        created_at: true,
        status_id: true
      }
    });

    // Seed groups for the new client
    try {
      await seedCategory(clientId);
      await seedGroup(clientId, false);
      await seedConfiguration(clientId, false);
      logs(`Groups seeded successfully for client: ${newClient.name}`);
    } catch (seedError) {
      errors('Error seeding groups for new client:', seedError);
      // Continue execution even if seeding fails
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        id: newClient.id,
        name: newClient.name,
        description: newClient.description,
        parentId: newClient.parent_id,
        metadata: newClient.metadata,
        createdAt: newClient.created_at,
        statusId: newClient.status_id
      }
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/client/{id}:
 *   put:
 *     summary: Update client
 *     description: Update an existing client (requires edit permission on clients resource)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
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
 *                 example: Updated Company Name
 *               description:
 *                 type: string
 *                 example: Updated description
 *               parentId:
 *                 type: string
 *                 example: 01234567-89ab-cdef-0123-456789abcdef
 *               metadata:
 *                 type: object
 *                 example: {}
 *               statusId:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Client updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 *       409:
 *         description: Conflict - Client name already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id', requirePermission('clients', PermissionAction.EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, metadata, statusId } = req.body;

    // Check if client exists
    const existingClient = await prisma.clients.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingClient.name) {
      const duplicateClient = await prisma.clients.findFirst({
        where: { 
          name: name.trim(),
          id: { not: id }, // Exclude current client
          status_id: { not: 1 } // Exclude deleted clients
        }
      });

      if (duplicateClient) {
        return res.status(409).json({
          success: false,
          message: 'Client with this name already exists'
        });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (parentId !== undefined) updateData.parent_id = parentId || null;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (statusId !== undefined) updateData.status_id = statusId;

    // Update client
    const updatedClient = await prisma.clients.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        parent_id: true,
        name: true,
        description: true,
        metadata: true,
        created_at: true,
        status_id: true
      }
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: {
        id: updatedClient.id,
        name: updatedClient.name,
        description: updatedClient.description,
        parentId: updatedClient.parent_id,
        metadata: updatedClient.metadata,
        createdAt: updatedClient.created_at,
        statusId: updatedClient.status_id
      }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/client/{id}:
 *   delete:
 *     summary: Delete client
 *     description: Soft delete a client by setting status_id to 1 (requires manage permission on clients resource)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Client ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requirePermission('clients', PermissionAction.MANAGE), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existingClient = await prisma.clients.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Soft delete by updating status_id
    await prisma.clients.update({
      where: { id },
      data: {
        status_id: 1 // 1 = deleted
      }
    });

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;