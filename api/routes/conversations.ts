import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { permissionClientCheck } from '../middleware/clientCheck';
import { generateUUIDv7 } from '../utils/uuid';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionClientCheck);

/**
 * @swagger
 * /v1/conversations:
 *   post:
 *     summary: Create a new conversation
 *     description: Create a new conversation with initial message
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Chat about AI"
 *               content:
 *                 type: string
 *                 example: "Tell me about artificial intelligence"
 *     responses:
 *       201:
 *         description: Conversation created successfully
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
 *                   example: Conversation created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     message:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         content:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [user, assistant, system]
 *                         created_at:
 *                           type: string
 *                           format: date-time
 */
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Create conversation and first message in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create conversation
      const conversation = await tx.conversations.create({
        data: {
          id:  generateUUIDv7(),
          user_id: userId || '',
          client_id: clientId || null,
          title: title || 'New Conversation',
          created_by: userId,
          participants: {
            create: [
              { user_id: userId || '', role: "owner" }
            ]
          },
          status_id: 0
        }
      });

      // Create first message (user message)
      const message = await tx.messages.create({
        data: {
          conversation_id: conversation.id,
          role: 'user',
          user_id: userId,
          client_id: clientId || null,
          content: content,
          status_id: 0
        }
      });

      return { conversation, message };
    });

    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/conversations:
 *   get:
 *     summary: Get all conversations
 *     description: Retrieve all conversations for the authenticated user with optional client filtering
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for filtering conversations
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                   example: Conversations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           last_message_at:
 *                             type: string
 *                             format: date-time
 *                           is_archived:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      user_id: userId,
      deleted_at: null,
      status_id: { not: 1 }
    };

    if (clientId) {
      whereClause.client_id = clientId;
    }

    // Get conversations with pagination
    const [conversations, total] = await Promise.all([
      prisma.conversations.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          created_at: true,
          updated_at: true,
          last_message_at: true,
          is_archived: true,
          client_id: true
        },
        orderBy: {
          updated_at: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.conversations.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/conversations/{id}:
 *   get:
 *     summary: Get a specific conversation
 *     description: Retrieve a specific conversation by ID with its messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for validation
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
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
 *                   example: Conversation retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                           role:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Conversation not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;

    // Build where clause
    const whereClause: any = {
      id,
      user_id: userId,
      deleted_at: null,
      status_id: { not: 1 }
    };

    if (clientId) {
      whereClause.client_id = clientId;
    }

    const conversation = await prisma.conversations.findFirst({
      where: whereClause,
      include: {
        messages: {
          where: {
            deleted_at: null,
            status_id: { not: 1 }
          },
          select: {
            id: true,
            content: true,
            role: true,
            created_at: true,
            updated_at: true
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/conversations/{id}:
 *   put:
 *     summary: Update a conversation
 *     description: Update conversation title and other properties
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated conversation title"
 *               is_archived:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Conversation updated successfully
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
 *                   example: Conversation updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     is_archived:
 *                       type: boolean
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Conversation not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_archived } = req.body;
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;

    // Build where clause
    const whereClause: any = {
      id,
      user_id: userId,
      deleted_at: null,
      status_id: { not: 1 }
    };

    if (clientId) {
      whereClause.client_id = clientId;
    }

    // Check if conversation exists
    const existingConversation = await prisma.conversations.findFirst({
      where: whereClause
    });

    if (!existingConversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (title !== undefined) {
      updateData.title = title;
    }

    if (is_archived !== undefined) {
      updateData.is_archived = is_archived;
    }

    // Update conversation
    const updatedConversation = await prisma.conversations.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        is_archived: true,
        updated_at: true
      }
    });

    return res.json({
      success: true,
      message: 'Conversation updated successfully',
      data: updatedConversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation
 *     description: Soft delete a conversation (sets deleted_at timestamp)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client ID for validation
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
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
 *                   example: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;

    // Build where clause
    const whereClause: any = {
      id,
      user_id: userId,
      deleted_at: null,
      status_id: { not: 1 }
    };

    if (clientId) {
      whereClause.client_id = clientId;
    }

    // Check if conversation exists
    const existingConversation = await prisma.conversations.findFirst({
      where: whereClause
    });

    if (!existingConversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Soft delete conversation and its messages
    await prisma.$transaction(async (tx) => {
      // Soft delete conversation
      await tx.conversations.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          updated_at: new Date()
        }
      });

      // Soft delete all messages in the conversation
      await tx.messages.updateMany({
        where: {
          conversation_id: id,
          deleted_at: null
        },
        data: {
          deleted_at: new Date(),
          updated_at: new Date()
        }
      });
    });

    return res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;