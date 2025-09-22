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
 * /v1/messages:
 *   post:
 *     summary: Create a new message
 *     description: Add a new message to an existing conversation
 *     tags: [Messages]
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
 *               - conversation_id
 *               - content
 *               - role
 *             properties:
 *               conversation_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               content:
 *                 type: string
 *                 example: "This is a message content"
 *               role:
 *                 type: string
 *                 enum: [user, assistant, system]
 *                 example: "user"
 *               model:
 *                 type: string
 *                 example: "gpt-3.5-turbo"
 *               prompt_tokens:
 *                 type: integer
 *                 example: 10
 *               completion_tokens:
 *                 type: integer
 *                 example: 20
 *               total_tokens:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Message created successfully
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
 *                   example: Message created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     content:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 */
router.post('/', async (req, res) => {
  try {
    const {
      conversation_id,
      parent_id,
      content,
      role,
      model,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      latency_ms,
      status_code
    } = req.body;
    const userId = req.user?.id;
    const clientId = req.headers['x-client-id'] as string;

    // Validate required fields
    if (!conversation_id || !content || !role) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID, content, and role are required'
      });
    }

    // Check if conversation exists
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversation_id }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create message
    const message = await prisma.messages.create({
      data: {
        id: generateUUIDv7(),
        conversation_id,
        parent_id,
        role,
        user_id: role === 'user' ? userId : null,
        client_id: clientId,
        content,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        latency_ms,
        status_code,
        status_id: 0
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/messages/streaming:
 *   post:
 *     summary: Create a streaming assistant message
 *     description: Create an empty assistant message for streaming updates
 *     tags: [Messages]
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
 *               - conversation_id
 *             properties:
 *               conversation_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               model:
 *                 type: string
 *                 example: "gpt-3.5-turbo"
 *     responses:
 *       201:
 *         description: Streaming message created successfully
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
 *                   example: Streaming message created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 */
router.post('/streaming', async (req, res) => {
  try {
    const { conversation_id, parent_id, model } = req.body;
    const clientId = req.headers['x-client-id'] as string;

    // Validate required fields
    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Check if conversation exists
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversation_id }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create empty assistant message for streaming
    const message = await prisma.messages.create({
      data: {
        id: generateUUIDv7(),
        conversation_id,
        client_id: clientId,
        parent_id,
        role: 'assistant',
        content: '',
        model,
        status_id: 0 // In progress
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Streaming message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Error creating streaming message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create streaming message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/messages/{id}:
 *   patch:
 *     summary: Update a message
 *     description: Update an existing message (used for streaming updates)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated content"
 *               prompt_tokens:
 *                 type: integer
 *                 example: 10
 *               completion_tokens:
 *                 type: integer
 *                 example: 20
 *               total_tokens:
 *                 type: integer
 *                 example: 30
 *               latency_ms:
 *                 type: integer
 *                 example: 500
 *               status_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Message updated successfully
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
 *                   example: Message updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      content,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      latency_ms,
      status_id
    } = req.body;
    const clientId = req.headers['x-client-id'] as string;

    // Check if message exists
    const existingMessage = await prisma.messages.findUnique({
      where: { id }
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message
    const message = await prisma.messages.update({
      where: { id },
      data: {
        content: content !== undefined ? content : undefined,
        client_id: clientId,
        prompt_tokens: prompt_tokens !== undefined ? prompt_tokens : undefined,
        completion_tokens: completion_tokens !== undefined ? completion_tokens : undefined,
        total_tokens: total_tokens !== undefined ? total_tokens : undefined,
        latency_ms: latency_ms !== undefined ? latency_ms : undefined,
        status_id: status_id !== undefined ? status_id : undefined,
        updated_at: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;