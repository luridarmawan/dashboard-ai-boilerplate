import swaggerJSDoc from 'swagger-jsdoc';
import { OpenAPIV3 } from 'openapi-types';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Dashboard Management API',
      version: '1.0.0',
      description: 'A comprehensive API for user authentication and management with role-based permissions',
      contact: {
        name: 'API Support',
        email: 'app@carik.id'
      }
    },
    // servers: [
    //   {
    //     url: 'http://localhost:3001',
    //     description: 'Development server'
    //   }
    // ],
    schemes:[
      "http","https"
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              example: '01234567-89ab-cdef-0123-456789abcdef',
              description: 'Unique user identifier (UUIDv7)'
            },
            email: { 
              type: 'string', 
              format: 'email', 
              example: 'user@example.com' 
            },
            phone: { 
              type: 'string', 
              example: '+1234567890' 
            },
            firstName: { 
              type: 'string', 
              example: 'John' 
            },
            lastName: { 
              type: 'string', 
              example: 'Doe' 
            },
            alias: { 
              type: 'string', 
              nullable: true, 
              example: 'johndoe' 
            },
            description: { 
              type: 'string', 
              nullable: true, 
              example: 'Software Developer' 
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time', 
              example: '2024-01-01T00:00:00.000Z' 
            }
          }
        },
        UserWithStatus: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                lastSeen: { 
                  type: 'string', 
                  format: 'date-time', 
                  nullable: true, 
                  example: '2024-01-01T12:00:00.000Z' 
                },
                ip: { 
                  type: 'string', 
                  nullable: true, 
                  example: '192.168.1.1' 
                },
                statusId: { 
                  type: 'integer', 
                  example: 1,
                  description: 'User status: 0=inactive/deleted, 1=active'
                },
                updatedAt: { 
                  type: 'string', 
                  format: 'date-time', 
                  nullable: true, 
                  example: '2024-01-01T12:00:00.000Z' 
                }
              }
            }
          ]
        },
        Error: {
          type: 'object',
          properties: {
            success: { 
              type: 'boolean', 
              example: false 
            },
            message: { 
              type: 'string', 
              example: 'Error message description' 
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { 
              type: 'boolean', 
              example: true 
            },
            message: { 
              type: 'string', 
              example: 'Operation completed successfully' 
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Invalid input data' }
                    }
                  }
                ]
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Invalid or missing authentication token' }
                    }
                  }
                ]
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Insufficient permissions to access this resource' }
                    }
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Resource not found' }
                    }
                  }
                ]
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - Resource already exists',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Resource already exists' }
                    }
                  }
                ]
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      message: { example: 'Internal server error' }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './api/routes/*.ts',
    './api/routes/**/*.ts',
    './api/modules/**/routes/**/*.ts',
    './modules/**/routes/**/*.ts',
    './api/index.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);

export function getOpenAPISpec(): OpenAPIV3.Document {
  return swaggerSpec as OpenAPIV3.Document;
}