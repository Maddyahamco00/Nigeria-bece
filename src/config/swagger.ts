import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nigeria BECE Management System API',
    version: '2.0.0',
    description: 'Enterprise-grade API for managing BECE student registrations, payments, and results',
    contact: {
      name: 'API Support',
      email: 'support@nigeria-bece.gov.ng'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.nigeria-bece.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Error message'
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR'
          }
        }
      },
      Student: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          studentCode: { type: 'string', example: 'KAD001001' },
          gender: { type: 'string', enum: ['Male', 'Female'] },
          paymentStatus: { type: 'string', enum: ['pending', 'paid'] },
          school: { $ref: '#/components/schemas/School' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      School: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Government Secondary School' },
          address: { type: 'string', example: '123 Main Street' },
          state: { $ref: '#/components/schemas/State' },
          lga: { $ref: '#/components/schemas/LGA' },
          studentCount: { type: 'integer', example: 150 }
        }
      },
      State: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Kaduna' },
          code: { type: 'string', example: 'KD' }
        }
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          reference: { type: 'string', example: 'PAY_123456789' },
          amount: { type: 'number', example: 5000.00 },
          status: { type: 'string', enum: ['pending', 'success', 'failed'] },
          student: { $ref: '#/components/schemas/Student' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { type: 'object' }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 10 }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};