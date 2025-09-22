import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../middleware/permission';
import { configuration, clearConfigurationCache } from '../../utils/configuration';
import { aiFetch, AIFetch } from '../../utils/ai';
import { getTenant } from '../../utils/tenant';

const prisma = new PrismaClient();
const router = Router();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);

/**
 * @swagger
 * /v1/ai/chat/completions:
 *   post:
 *     summary: AI Chat Completions
 *     description: Proxy endpoint for AI chat completions. Forwards requests to the configured AI service.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 example: "carik/gpt-6-mini"
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     content:
 *                       type: string
 *                       example: "Hello, how are you?"
 *               temperature:
 *                 type: number
 *                 example: 0.7
 *               stream:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Successful response from AI service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/chat/completions', requirePermission('ai', PermissionAction.CREATE), async (req: Request, res: Response) => {
  try {
    // Get client ID from the authenticated user
    const clientId = (req.user as any).clientId || null;
    const tenantInfo = await getTenant(clientId);
    let tenantName = tenantInfo?.name || 'default';
    tenantName = tenantName || 'global';
    tenantName = tenantName.toLowerCase();
    tenantName = tenantName.replace(/\s+/g, '_');

    // Get AI configuration
    clearConfigurationCache("ai.baseurl");
    clearConfigurationCache("ai.key");
    clearConfigurationCache("ai.model");
    clearConfigurationCache("ai.stream");
    clearConfigurationCache("ai.system_prompt");
    const AIAPIURL = await configuration('ai.baseurl', '', clientId, true);
    const AIAPIKey = await configuration('ai.key', '', clientId, true);
    const AIAPIModel = await configuration('ai.model', '', clientId, true);
    const AIAPISystemPrompt = await configuration('ai.system_prompt', '', clientId, true);

    // Check if AI feature is enabled
    const aiEnabled = await configuration('ai.enable', 'false', clientId);
    if (aiEnabled !== 'true') {
      return res.status(400).json({
        error: 'AI feature is not enabled'
      });
    }

    // Check if API key is provided
    if (!AIAPIKey) {
      return res.status(400).json({
        error: 'AI feature cannot be used because API key is not configured'
      });
    }

    // Prepare the request body
    const requestBody = { ...req.body };

    // Check if streaming is requested
    const isStreaming = requestBody.stream === true;

    // If no model is specified in the request, use the configured model
    if (!requestBody.model && AIAPIModel) {
      requestBody.model = AIAPIModel;
    }

    // If system prompt is configured and not already in messages, add it
    if (AIAPISystemPrompt && requestBody.messages && Array.isArray(requestBody.messages)) {
      // Check if there's already a system message
      const hasSystemMessage = requestBody.messages.some((msg: any) => msg.role === 'system');
      if (!hasSystemMessage) {
        requestBody.messages.unshift({
          role: 'system',
          content: AIAPISystemPrompt
        });
      }
    }

    requestBody.user = req.user;
    requestBody.tenant = tenantName;

    // Forward the request to the AI service using aiFetch
    // Create an instance with the base URL and default headers
    const aiClient = new AIFetch(AIAPIURL, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AIAPIKey}`
    });

    // Use the aiFetch instance to make the request
    const response = await aiClient.post('/chat/completions', requestBody);

    // Handle streaming response
    if (isStreaming && response.body) {
      // Set appropriate headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Check if response.body is a Node.js stream or a web stream
      if ('pipe' in response.body && typeof response.body.pipe === 'function') {
        // Node.js stream
        response.body.pipe(res);
      } else {
        // Web stream - handle manually
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        res.on('close', () => {
          reader.cancel().catch(() => { });
        });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);

            // Flush the response if possible
            if (typeof (res as any).flush === 'function') {
              (res as any).flush();
            }
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
        } finally {
          reader.releaseLock();
          if (!res.writableEnded) {
            res.end();
          }
        }
      }
    } else {
      // Handle regular (non-streaming) response
      // AIFetch has already processed non-streaming responses and created a new Response object
      const responseText = await response.text();

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = responseText;
      }

      res.status(response.status).json(responseData);
    }
  } catch (error) {
    console.error('❗️ AI Chat Completions Error:', error, '--');
    // Check if headers have already been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error while processing AI request',
      });
    }
  }
});

export default router;
