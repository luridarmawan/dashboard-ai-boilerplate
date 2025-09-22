import express from 'express';
import { mcpController } from '../../controller/mcp/mcpController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MCPRequest:
 *       type: object
 *       required:
 *         - jsonrpc
 *         - method
 *       properties:
 *         jsonrpc:
 *           type: string
 *           example: "2.0"
 *           description: JSON-RPC version
 *         id:
 *           oneOf:
 *             - type: string
 *             - type: number
 *           example: "1"
 *           description: Request identifier
 *         method:
 *           type: string
 *           example: "initialize"
 *           description: MCP method name
 *         params:
 *           type: object
 *           description: Method parameters
 *         stream:
 *           type: boolean
 *           example: false
 *           description: Whether to stream the response
 *     MCPResponse:
 *       type: object
 *       required:
 *         - jsonrpc
 *       properties:
 *         jsonrpc:
 *           type: string
 *           example: "2.0"
 *         id:
 *           oneOf:
 *             - type: string
 *             - type: number
 *           example: "1"
 *         result:
 *           type: object
 *           description: Success result
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: number
 *               example: -32601
 *             message:
 *               type: string
 *               example: "Method not found"
 *             data:
 *               type: object
 *   tags:
 *     - name: MCP
 *       description: Model Context Protocol endpoints
 */

/**
 * @swagger
 * /v1/mcp:
 *   post:
 *     summary: Handle MCP requests
 *     description: Main endpoint for Model Context Protocol requests. Supports both JSON and streaming responses.
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MCPRequest'
 *           examples:
 *             initialize:
 *               summary: Initialize MCP server
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "1"
 *                 method: "initialize"
 *                 params:
 *                   protocolVersion: "2024-11-05"
 *                   capabilities: {}
 *                   clientInfo:
 *                     name: "example-client"
 *                     version: "1.0.0"
 *             listPrompts:
 *               summary: List available prompts
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "2"
 *                 method: "prompts/list"
 *             getPrompt:
 *               summary: Get a specific prompt
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "3"
 *                 method: "prompts/get"
 *                 params:
 *                   name: "example-prompt"
 *                   arguments:
 *                     topic: "artificial intelligence"
 *             listResources:
 *               summary: List available resources
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "4"
 *                 method: "resources/list"
 *             readResource:
 *               summary: Read a specific resource
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "5"
 *                 method: "resources/read"
 *                 params:
 *                   uri: "file://example.txt"
 *             listTools:
 *               summary: List available tools
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "6"
 *                 method: "tools/list"
 *             callTool:
 *               summary: Call a specific tool
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "7"
 *                 method: "tools/call"
 *                 params:
 *                   name: "echo"
 *                   arguments:
 *                     text: "Hello, MCP!"
 *             streamRequest:
 *               summary: Request with streaming response
 *               value:
 *                 jsonrpc: "2.0"
 *                 id: "8"
 *                 method: "initialize"
 *                 stream: true
 *     responses:
 *       200:
 *         description: MCP response (JSON or streaming)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 *             examples:
 *               initializeResponse:
 *                 summary: Initialize response
 *                 value:
 *                   jsonrpc: "2.0"
 *                   id: "1"
 *                   result:
 *                     protocolVersion: "2024-11-05"
 *                     capabilities:
 *                       prompts:
 *                         listChanged: true
 *                       resources:
 *                         subscribe: true
 *                         listChanged: true
 *                       tools:
 *                         listChanged: true
 *                     serverInfo:
 *                       name: "MCP Server"
 *                       version: "1.0.0"
 *           text/plain:
 *             schema:
 *               type: string
 *               description: JSONL streaming response
 *             example: |
 *               {"jsonrpc":"2.0","id":"1","result":{"protocolVersion":"2024-11-05","capabilities":{},"serverInfo":{"name":"MCP Server","version":"1.0.0"}}}
 *       400:
 *         description: Bad request or MCP error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 *             examples:
 *               invalidRequest:
 *                 summary: Invalid request
 *                 value:
 *                   jsonrpc: "2.0"
 *                   id: null
 *                   error:
 *                     code: -32600
 *                     message: "Invalid Request"
 *               methodNotFound:
 *                 summary: Method not found
 *                 value:
 *                   jsonrpc: "2.0"
 *                   id: "1"
 *                   error:
 *                     code: -32601
 *                     message: "Method not found: unknown_method"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * @swagger
 * /v1/mcp:
 *   get:
 *     summary: MCP Server Information
 *     description: Get information about the MCP server and available endpoints
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: MCP server information
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
 *                   example: "MCP Server is running"
 *                 data:
 *                   type: object
 *                   properties:
 *                     serverInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "MCP Server"
 *                         version:
 *                           type: string
 *                           example: "1.0.0"
 *                         protocolVersion:
 *                           type: string
 *                           example: "2024-11-05"
 *                     endpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           method:
 *                             type: string
 *                           endpoint:
 *                             type: string
 *                           description:
 *                             type: string
 *                     usage:
 *                       type: object
 *                       properties:
 *                         note:
 *                           type: string
 *                           example: "All MCP endpoints require POST requests with JSON-RPC 2.0 format"
 *                         example:
 *                           type: string
 *                           example: "POST /api/mcp with {\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"initialize\"}"
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: "MCP Server is running",
    data: {
      serverInfo: {
        name: "MCP Server",
        version: "1.0.0",
        protocolVersion: "2024-11-05"
      },
      endpoints: [
        {
          method: "initialize",
          endpoint: "POST /api/mcp/initialize",
          description: "Initialize MCP server"
        },
        {
          method: "prompts/list",
          endpoint: "POST /api/mcp/prompts/list",
          description: "List available prompts"
        },
        {
          method: "prompts/get",
          endpoint: "POST /api/mcp/prompts/get",
          description: "Get specific prompt"
        },
        {
          method: "resources/list",
          endpoint: "POST /api/mcp/resources/list",
          description: "List available resources"
        },
        {
          method: "resources/read",
          endpoint: "POST /api/mcp/resources/read",
          description: "Read specific resource"
        },
        {
          method: "tools/list",
          endpoint: "POST /api/mcp/tools/list",
          description: "List available tools"
        },
        {
          method: "tools/call",
          endpoint: "POST /api/mcp/tools/call",
          description: "Call specific tool"
        }
      ],
      usage: {
        note: "All MCP endpoints require POST requests with JSON-RPC 2.0 format",
        example: "POST /api/mcp with {\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"initialize\"}",
        documentation: "Visit /api/docs for complete API documentation"
      }
    }
  });
});

router.post('/', mcpController.handleRequest);

/**
 * @swagger
 * /v1/mcp/initialize:
 *   post:
 *     summary: Initialize MCP server
 *     description: Initialize the MCP server with client capabilities and information
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jsonrpc:
 *                 type: string
 *                 example: "2.0"
 *               id:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: "1"
 *               method:
 *                 type: string
 *                 example: "initialize"
 *               params:
 *                 type: object
 *                 properties:
 *                   protocolVersion:
 *                     type: string
 *                     example: "2024-11-05"
 *                   capabilities:
 *                     type: object
 *                   clientInfo:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "example-client"
 *                       version:
 *                         type: string
 *                         example: "1.0.0"
 *               stream:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Initialization successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/initialize', mcpController.initialize);

/**
 * @swagger
 * /v1/mcp/prompts/list:
 *   post:
 *     summary: List available prompts
 *     description: Get a list of all available prompts from the MCP server
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MCPRequest'
 *     responses:
 *       200:
 *         description: List of prompts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/prompts/list', mcpController.listPrompts);

/**
 * @swagger
 * /v1/mcp/prompts/get:
 *   post:
 *     summary: Get a specific prompt
 *     description: Retrieve a specific prompt by name with optional arguments
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/MCPRequest'
 *               - type: object
 *                 properties:
 *                   params:
 *                     type: object
 *                     required:
 *                       - name
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "example-prompt"
 *                       arguments:
 *                         type: object
 *                         example:
 *                           topic: "artificial intelligence"
 *     responses:
 *       200:
 *         description: Prompt details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/prompts/get', mcpController.getPrompt);

/**
 * @swagger
 * /v1/mcp/resources/list:
 *   post:
 *     summary: List available resources
 *     description: Get a list of all available resources from the MCP server
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MCPRequest'
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/resources/list', mcpController.listResources);

/**
 * @swagger
 * /v1/mcp/resources/read:
 *   post:
 *     summary: Read a specific resource
 *     description: Read the contents of a specific resource by URI
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/MCPRequest'
 *               - type: object
 *                 properties:
 *                   params:
 *                     type: object
 *                     required:
 *                       - uri
 *                     properties:
 *                       uri:
 *                         type: string
 *                         example: "file://example.txt"
 *     responses:
 *       200:
 *         description: Resource contents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/resources/read', mcpController.readResource);

/**
 * @swagger
 * /v1/mcp/tools/list:
 *   post:
 *     summary: List available tools
 *     description: Get a list of all available tools from the MCP server
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MCPRequest'
 *     responses:
 *       200:
 *         description: List of tools
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/tools/list', mcpController.listTools);

/**
 * @swagger
 * /v1/mcp/tools/call:
 *   post:
 *     summary: Call a specific tool
 *     description: Execute a specific tool with provided arguments
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/MCPRequest'
 *               - type: object
 *                 properties:
 *                   params:
 *                     type: object
 *                     required:
 *                       - name
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "echo"
 *                       arguments:
 *                         type: object
 *                         example:
 *                           text: "Hello, MCP!"
 *     responses:
 *       200:
 *         description: Tool execution result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCPResponse'
 */
router.post('/tools/call', mcpController.callTool);

export default router;