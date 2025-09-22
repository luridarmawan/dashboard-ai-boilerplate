import { Request, Response } from 'express';
import { prisma } from '../../database/init';

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPCapabilities {
  experimental?: Record<string, any>;
  logging?: Record<string, any>;
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
}

interface MCPServerInfo {
  name: string;
  version: string;
}

interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

// MCP Controller Class
export class MCPController {
  private serverInfo: MCPServerInfo = {
    name: "MCP Server",
    version: "1.0.0"
  };

  private capabilities: MCPCapabilities = {
    experimental: {},
    logging: {},
    prompts: {
      listChanged: true
    },
    resources: {
      subscribe: true,
      listChanged: true
    },
    tools: {
      listChanged: true
    }
  };

  /**
   * Handle MCP initialization
   */
  public initialize = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      
      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: this.capabilities,
          serverInfo: this.serverInfo
        } as MCPInitializeResult
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'initialize');
    }
  };

  /**
   * List available prompts
   */
  public listPrompts = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      
      const prompts = [
        {
          name: "example-prompt",
          description: "An example prompt for demonstration",
          arguments: [
            {
              name: "topic",
              description: "The topic to discuss",
              required: true
            }
          ]
        }
      ];

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          prompts
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'listPrompts');
    }
  };

  /**
   * Get a specific prompt
   */
  public getPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      const { name, arguments: args } = mcpRequest.params || {};

      if (!name) {
        return this.sendError(req, res, -32602, "Invalid params: name is required");
      }

      // Example prompt handling
      let messages: any[] = [];
      if (name === "example-prompt") {
        const topic = args?.topic || "general topic";
        messages = [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please discuss the following topic: ${topic}`
            }
          }
        ];
      } else {
        return this.sendError(req, res, -32601, `Unknown prompt: ${name}`);
      }

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          description: `Generated prompt for ${name}`,
          messages
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'getPrompt');
    }
  };

  /**
   * List available resources
   */
  public listResources = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      
      const resources = [
        {
          uri: "file://example.txt",
          name: "Example Resource",
          description: "An example resource for demonstration",
          mimeType: "text/plain"
        }
      ];

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          resources
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'listResources');
    }
  };

  /**
   * Read a specific resource
   */
  public readResource = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      const { uri } = mcpRequest.params || {};

      if (!uri) {
        return this.sendError(req, res, -32602, "Invalid params: uri is required");
      }

      // Example resource handling
      let contents: any[] = [];
      if (uri === "file://example.txt") {
        contents = [
          {
            uri,
            mimeType: "text/plain",
            text: "This is an example resource content."
          }
        ];
      } else {
        return this.sendError(req, res, -32601, `Unknown resource: ${uri}`);
      }

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          contents
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'readResource');
    }
  };

  /**
   * List available tools
   */
  public listTools = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      
      const tools = [
        {
          name: "echo",
          description: "Echo back the input text",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "Text to echo back"
              }
            },
            required: ["text"]
          }
        },
        {
          name: "get_active_users_this_week",
          description: "Get list of users who were active this week",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of users to return (default: 10)",
                default: 10
              }
            }
          }
        },
        {
          name: "get_user_activity",
          description: "Get detailed activity information for a specific user",
          inputSchema: {
            type: "object",
            properties: {
              userId: {
                type: "string",
                description: "User ID to get activity for"
              },
              days: {
                type: "number",
                description: "Number of days to look back (default: 7)",
                default: 7
              }
            },
            required: ["userId"]
          }
        },
        {
          name: "get_activity_summary",
          description: "Get summary of user activity for a time period",
          inputSchema: {
            type: "object",
            properties: {
              period: {
                type: "string",
                enum: ["today", "week", "month"],
                description: "Time period for activity summary",
                default: "week"
              }
            }
          }
        }
      ];

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          tools
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'listTools');
    }
  };

  /**
   * Call a specific tool
   */
  public callTool = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      const { name, arguments: args } = mcpRequest.params || {};

      if (!name) {
        return this.sendError(req, res, -32602, "Invalid params: name is required");
      }

      let content: any[] = [];

      if (name === "echo") {
        const text = args?.text || "";
        content = [
          {
            type: "text",
            text: `Echo: ${text}`
          }
        ];
      } else if (name === "get_active_users_this_week") {
        const limit = args?.limit || 10;
        const result = await this.getActiveUsersThisWeek(limit);
        content = [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ];
      } else if (name === "get_user_activity") {
        const { userId, days = 7 } = args || {};
        if (!userId) {
          return this.sendError(req, res, -32602, "Invalid params: userId is required");
        }
        const result = await this.getUserActivity(userId, days);
        content = [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ];
      } else if (name === "get_activity_summary") {
        const period = args?.period || "week";
        const result = await this.getActivitySummary(period);
        content = [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ];
      } else {
        return this.sendError(req, res, -32601, `Unknown tool: ${name}`);
      }

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        result: {
          content,
          isError: false
        }
      };

      if (this.shouldStream(req)) {
        this.sendStreamResponse(res, response);
      } else {
        res.json(response);
      }
    } catch (error) {
      this.handleError(req, res, error, 'callTool');
    }
  };

  /**
   * Handle generic MCP requests
   */
  public handleRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const mcpRequest: MCPRequest = req.body;
      
      if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== "2.0") {
        return this.sendError(req, res, -32600, "Invalid Request: jsonrpc must be '2.0'");
      }

      if (!mcpRequest.method) {
        return this.sendError(req, res, -32600, "Invalid Request: method is required");
      }

      // Route to appropriate handler based on method
      switch (mcpRequest.method) {
        case "initialize":
          return this.initialize(req, res);
        case "prompts/list":
          return this.listPrompts(req, res);
        case "prompts/get":
          return this.getPrompt(req, res);
        case "resources/list":
          return this.listResources(req, res);
        case "resources/read":
          return this.readResource(req, res);
        case "tools/list":
          return this.listTools(req, res);
        case "tools/call":
          return this.callTool(req, res);
        default:
          return this.sendError(req, res, -32601, `Method not found: ${mcpRequest.method}`);
      }
    } catch (error) {
      this.handleError(req, res, error, 'handleRequest');
    }
  };

  /**
   * Check if response should be streamed
   */
  private shouldStream(req: Request): boolean {
    return req.body?.stream === true || req.query?.stream === 'true';
  }

  /**
   * Send streaming response
   */
  private sendStreamResponse(res: Response, data: any): void {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Send data as JSON lines (JSONL)
    const jsonLine = JSON.stringify(data) + '\n';
    res.write(jsonLine);
    res.end();
  }

  /**
   * Send error response
   */
  private sendError(req: Request, res: Response, code: number, message: string, data?: any): void {
    const mcpRequest: MCPRequest = req.body || {};
    
    const errorResponse: MCPResponse = {
      jsonrpc: "2.0",
      id: mcpRequest.id,
      error: {
        code,
        message,
        data
      }
    };

    if (this.shouldStream(req)) {
      this.sendStreamResponse(res, errorResponse);
    } else {
      res.status(400).json(errorResponse);
    }
  }

  /**
   * Handle errors
   */
  private handleError(req: Request, res: Response, error: any, method: string): void {
    console.error(`MCP ${method} error:`, error);
    this.sendError(req, res, -32603, "Internal error", { method, error: error.message });
  }

  /**
   * Get users who were active this week
   */
  private async getActiveUsersThisWeek(limit: number = 10) {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const activeUsers = await prisma.users.findMany({
        where: {
          last_seen: {
            gte: oneWeekAgo
          },
          status_id: 0 // Active users only
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          alias: true,
          last_seen: true,
          ip: true
        },
        orderBy: {
          last_seen: 'desc'
        },
        take: limit
      });

      return {
        success: true,
        message: `Found ${activeUsers.length} active users this week`,
        data: {
          period: "last 7 days",
          total_active_users: activeUsers.length,
          users: activeUsers.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            alias: user.alias,
            last_seen: user.last_seen,
            last_ip: user.ip
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get active users",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get detailed activity for a specific user
   */
  private async getUserActivity(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          alias: true,
          last_seen: true,
          ip: true,
          created_at: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      // Check if user was active in the specified period
      const isActiveInPeriod = user.last_seen && user.last_seen >= startDate;

      return {
        success: true,
        message: `Activity data for user ${user.first_name} ${user.last_name}`,
        data: {
          user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            alias: user.alias
          },
          activity: {
            period: `last ${days} days`,
            is_active_in_period: isActiveInPeriod,
            last_seen: user.last_seen,
            last_ip: user.ip,
            account_created: user.created_at
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get user activity",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get activity summary for a time period
   */
  private async getActivitySummary(period: string = "week") {
    try {
      let startDate = new Date();
      let periodLabel = "";

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          periodLabel = "today";
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          periodLabel = "this week";
          break;
        case "month":
          startDate.setDate(startDate.getDate() - 30);
          periodLabel = "this month";
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
          periodLabel = "this week";
      }

      // Get total users
      const totalUsers = await prisma.users.count({
        where: { status_id: 0 }
      });

      // Get active users in period
      const activeUsers = await prisma.users.count({
        where: {
          last_seen: {
            gte: startDate
          },
          status_id: 0
        }
      });

      // Get new users in period
      const newUsers = await prisma.users.count({
        where: {
          created_at: {
            gte: startDate
          },
          status_id: 0
        }
      });

      return {
        success: true,
        message: `Activity summary for ${periodLabel}`,
        data: {
          period: periodLabel,
          date_range: {
            from: startDate.toISOString(),
            to: new Date().toISOString()
          },
          statistics: {
            total_users: totalUsers,
            active_users: activeUsers,
            new_users: newUsers,
            activity_rate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get activity summary",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Export singleton instance
export const mcpController = new MCPController();