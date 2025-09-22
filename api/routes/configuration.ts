import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../middleware/permission';
import { generateUUIDv7 } from '../utils/uuid';
import { clearConfigurationCache } from '../utils/configuration';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);

/**
 * @swagger
 * /v1/configuration:
 *   get:
 *     summary: List all configurations
 *     description: Retrieve a list of all configurations (requires read permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
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
 *                   example: Configurations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     configurations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
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
router.get('/', requirePermission('configuration', PermissionAction.EDIT), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const configurations = await prisma.configurations.findMany({
      where: {
        client_id: clientId,
        status_id: 0 // Only active configurations
      },
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { key: 'asc' }
      ]
    });

    // Check additional permissions for enhanced response
    const canManageConfigurations = await req.permissions!.canManage('configuration');
    const canCreateConfigurations = await req.permissions!.canCreate('configuration');
    const canEditConfigurations = await req.permissions!.canEdit('configuration');

    if (process.env.VITE_DEMO_MODE === 'true') {
      // In demo mode, only return configurations with specific key in array return it with empty string
      const dangerKey = [
        'ai.key',
        'email.host', 'email.from', 'email.username', 'email.password', 'email.bcc'
      ];
      configurations.forEach(config => {
        if (dangerKey.includes(config.key)) {
          config.value = ''
        }
      })
    }

    res.json({
      success: true,
      message: 'Configurations retrieved successfully',
      data: {
        configurations: configurations.map(config => ({
          id: config.id,
          clientId: config.client_id,
          section: config.section,
          sub: config.sub,
          key: config.key,
          value: config.value,
          type: config.type,
          title: config.title,
          note: config.note,
          order: config.order,
          pro: config.pro,
          statusId: config.status_id,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        })),
        permissions: {
          canManage: canManageConfigurations,
          canCreate: canCreateConfigurations,
          canEdit: canEditConfigurations
        }
      }
    });
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/configuration/{id}:
 *   get:
 *     summary: Get specific configuration
 *     description: Retrieve information about a specific configuration by ID (requires read permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Configuration ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                   example: Configuration retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Configuration'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', requirePermission('configuration', PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;

    const configuration = await prisma.configurations.findUnique({
      where: { id, client_id: clientId }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'Configuration retrieved successfully',
      data: {
        id: configuration.id,
        clientId: configuration.client_id,
        section: configuration.section,
        sub: configuration.sub,
        key: configuration.key,
        value: configuration.value,
        title: configuration.title,
        note: configuration.note,
        type: configuration.type,
        createdAt: configuration.created_at,
        updatedAt: configuration.updated_at,
        statusId: configuration.status_id
      }
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/configuration:
 *   post:
 *     summary: Create new configuration
 *     description: Create a new configuration (requires create permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - section
 *               - key
 *               - value
 *             properties:
 *               section:
 *                 type: string
 *                 example: security
 *               key:
 *                 type: string
 *                 example: jwt.expiry
 *               value:
 *                 type: string
 *                 example: 24h
 *               description:
 *                 type: string
 *                 example: JWT token expiry time
 *               clientId:
 *                 type: string
 *                 example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       201:
 *         description: Configuration created successfully
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
 *                   example: Configuration created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Configuration'
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
router.post('/', requirePermission('configuration', PermissionAction.CREATE), async (req, res) => {
  if (process.env.VITE_DEMO_MODE === 'true') {
    return res.status(403).json({
      success: false,
      message: 'Demo mode:\nCannot create configurations'
    });
  }

  try {
    const { section, key, value, title, clientId } = req.body;

    // Basic validation
    if (!section || !key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Section, key, and value are required'
      });
    }

    // Check if configuration already exists
    const existingConfig = await prisma.configurations.findFirst({
      where: {
        section,
        key,
        client_id: clientId || null
      }
    });

    if (existingConfig) {
      return res.status(409).json({
        success: false,
        message: 'Configuration with this section and key already exists'
      });
    }

    // Create new configuration
    const newConfiguration = await prisma.configurations.create({
      data: {
        id: generateUUIDv7(),
        client_id: clientId || null,
        section,
        key,
        value,
        title: title || null,
        status_id: 1
      }
    });

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: {
        id: newConfiguration.id,
        clientId: newConfiguration.client_id,
        section: newConfiguration.section,
        key: newConfiguration.key,
        value: newConfiguration.value,
        title: newConfiguration.title,
        note: newConfiguration.note,
        type: newConfiguration.type,
        createdAt: newConfiguration.created_at,
        updatedAt: newConfiguration.updated_at,
        statusId: newConfiguration.status_id
      }
    });
  } catch (error) {
    console.error('Error creating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/configuration/{id}:
 *   put:
 *     summary: Update configuration
 *     description: Update an existing configuration (requires edit permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Configuration ID
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
 *               section:
 *                 type: string
 *                 example: security
 *               key:
 *                 type: string
 *                 example: jwt.expiry
 *               value:
 *                 type: string
 *                 example: 48h
 *               description:
 *                 type: string
 *                 example: JWT token expiry time (updated)
 *     responses:
 *       200:
 *         description: Configuration updated successfully
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
 *                   example: Configuration updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Configuration'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', requirePermission('configuration', PermissionAction.EDIT), async (req, res) => {
  if (process.env.VITE_DEMO_MODE === 'true') {
    return res.status(403).json({
      success: false,
      message: 'Demo mode:\nCannot update configurations'
    });
  }

  try {
    const { id } = req.params;
    const { section, key, value, title } = req.body;

    // Check if configuration exists
    const existingConfiguration = await prisma.configurations.findUnique({
      where: { id }
    });

    if (!existingConfiguration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Update configuration
    const updatedConfiguration = await prisma.configurations.update({
      where: { id },
      data: {
        ...(section && { section }),
        ...(key && { key }),
        ...(value && { value }),
        ...(title !== undefined && { title }),
        updated_at: new Date()
      }
    });

    clearConfigurationCache(key);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        id: updatedConfiguration.id,
        clientId: updatedConfiguration.client_id,
        section: updatedConfiguration.section,
        key: updatedConfiguration.key,
        value: updatedConfiguration.value,
        title: updatedConfiguration.title,
        note: updatedConfiguration.note,
        type: updatedConfiguration.type,
        createdAt: updatedConfiguration.created_at,
        updatedAt: updatedConfiguration.updated_at,
        statusId: updatedConfiguration.status_id
      }
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/configuration/{id}:
 *   delete:
 *     summary: Delete configuration
 *     description: Delete a configuration (requires manage permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Configuration ID
 *         schema:
 *           type: string
 *           example: 01234567-89ab-cdef-0123-456789abcdef
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
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
 *                   example: Configuration deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', requirePermission('configuration', PermissionAction.MANAGE), async (req, res) => {
  if (process.env.VITE_DEMO_MODE === 'true') {
    return res.status(403).json({
      success: false,
      message: 'Demo mode:\nCannot delete configurations'
    });
  }

  try {
    const { id } = req.params;

    // Check if configuration exists
    const existingConfiguration = await prisma.configurations.findUnique({
      where: { id }
    });

    if (!existingConfiguration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Soft delete by updating status_id
    await prisma.configurations.update({
      where: { id },
      data: {
        status_id: 0, // 0 = deleted/inactive
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/configuration/key/{key}:
 *   get:
 *     summary: Get specific configuration by key
 *     description: Retrieve a specific configuration value by key (requires read permission on configuration resource)
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Configuration key
 *         schema:
 *           type: string
 *           example: ai.stream
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                   example: Configuration retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: ai.stream
 *                     value:
 *                       type: string
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const clientId = req.user?.clientId || null;

    // Import the configuration utility function
    const { getConfiguration } = await import('../utils/configuration');

    // TODO: check permission manual.
    //   tampilkan hanya yang public saja

    // Get specific configuration value
    const value = await getConfiguration(key, clientId);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'Configuration retrieved successfully',
      data: {
        key: key,
        value: value
      }
    });
  } catch (error) {
    console.error('Error fetching configuration by key:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
