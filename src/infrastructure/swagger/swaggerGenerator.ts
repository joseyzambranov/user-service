/**
 * Swagger/OpenAPI Generator
 *
 * 📚 EXAMEN AWS: API Documentation
 * - Genera especificación OpenAPI 3.0 desde Zod schemas
 * - Schema-first development (código → documentación)
 * - Usa los DTOs existentes sin modificarlos
 */

import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateUserSchema } from '@application/dtos/CreateUserDto';
import { UpdateUserSchema } from '@application/dtos/UpdateUserDto';
import { UserResponseSchema } from '@application/dtos/UserResponseDto';
import { ErrorResponseSchema } from '@application/dtos/ErrorResponseDto';
import { UserListResponseSchema } from '@application/dtos/UserListResponseDto';
import { UserIdParamSchema } from '@application/dtos/UserIdParamDto';
import { ListUsersQuerySchema } from '@application/dtos/ListUsersQueryDto';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

/**
 * 📚 EXAMEN AWS: OpenAPI Registry
 *
 * Registry centralizado para:
 * - Schemas (DTOs)
 * - Paths (endpoints)
 * - Components (reutilizables)
 */
const registry = new OpenAPIRegistry();

// ============================================
// 1. Register Schemas (usando DTOs existentes)
// ============================================

/**
 * Schema: CreateUserRequest
 * Reutiliza CreateUserSchema existente
 */
registry.register('CreateUserRequest', CreateUserSchema);

/**
 * Schema: UpdateUserRequest
 * Reutiliza UpdateUserSchema existente
 */
registry.register('UpdateUserRequest', UpdateUserSchema);

/**
 * Schema: UserResponse
 * Reutiliza UserResponseSchema existente
 */
registry.register('UserResponse', UserResponseSchema);

/**
 * Schema: ErrorResponse
 * Reutiliza ErrorResponseSchema existente
 */
registry.register('ErrorResponse', ErrorResponseSchema);

/**
 * Schema: UserListResponse
 * Reutiliza UserListResponseSchema existente
 */
registry.register('UserListResponse', UserListResponseSchema);

// ============================================
// 2. Register API Paths (Endpoints)
// ============================================

/**
 * POST /users - Create a new user
 */
registry.registerPath({
  method: 'post',
  path: '/users',
  summary: 'Create a new user',
  description: 'Creates a new user in the system with email validation and uniqueness check',
  tags: ['Users'],
  request: {
    body: {
      description: 'User data to create',
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request data (validation error)',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'User with this email already exists',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /users - List users with pagination
 */
registry.registerPath({
  method: 'get',
  path: '/users',
  summary: 'List users',
  description: 'Retrieves a paginated list of users',
  tags: ['Users'],
  request: {
    query: ListUsersQuerySchema,
  },
  responses: {
    200: {
      description: 'List of users retrieved successfully',
      content: {
        'application/json': {
          schema: UserListResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /users/{id} - Get user by ID
 */
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get user by ID',
  description: 'Retrieves a single user by their unique identifier',
  tags: ['Users'],
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      description: 'User retrieved successfully',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * PUT /users/{id} - Update user
 */
registry.registerPath({
  method: 'put',
  path: '/users/{id}',
  summary: 'Update user',
  description: 'Updates an existing user\'s information',
  tags: ['Users'],
  request: {
    params: UserIdParamSchema,
    body: {
      description: 'User data to update',
      content: {
        'application/json': {
          schema: UpdateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request data (validation error)',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * DELETE /users/{id} - Delete user
 */
registry.registerPath({
  method: 'delete',
  path: '/users/{id}',
  summary: 'Delete user',
  description: 'Deletes a user from the system',
  tags: ['Users'],
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    204: {
      description: 'User deleted successfully (no content)',
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================
// 3. Generate OpenAPI Specification
// ============================================

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiSpec = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'User Service API',
    version: '1.0.0',
    description: `RESTful API for user management built with AWS Lambda, API Gateway, and DynamoDB.

## Features
- CRUD operations for users
- Email validation and uniqueness check
- Pagination support
- Clean Architecture
- Serverless (AWS Lambda)
- NoSQL database (DynamoDB)

## AWS Resources
- **Lambda Functions**: 5 functions (Create, Get, Update, Delete, List)
- **API Gateway**: REST API with CORS enabled
- **DynamoDB**: Single-table design with GSI`,
    contact: {
      name: 'Dev Team',
      email: 'dev@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://api.example.com/dev',
      description: 'Development environment',
    },
    {
      url: 'https://api.example.com/prod',
      description: 'Production environment',
    },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management operations',
    },
  ],
});

/**
 * Generate Swagger UI HTML
 *
 * 📚 EXAMEN AWS: Static HTML served via S3 + CloudFront
 * - HTML carga CSS/JS desde CDN (no bundle local)
 * - openapi.json se carga desde mismo origen S3
 */
function generateSwaggerUIHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="User Service API Documentation">
  <title>User Service API - Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .swagger-ui .topbar { display: none; }
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .custom-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    }
    .custom-header p {
      margin: 0;
      font-size: 1rem;
      opacity: 0.9;
    }
    .custom-header .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🚀 User Service API</h1>
    <p>RESTful API for User Management - AWS Certified Developer Project</p>
    <span class="badge">AWS Lambda + DynamoDB + API Gateway</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: false,
        syntaxHighlight: { activate: true, theme: "monokai" }
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Generate and save OpenAPI spec and Swagger UI HTML
 *
 * 📚 EXAMEN AWS: Schema-First Development
 * - Genera documentación desde código (single source of truth)
 * - OpenAPI JSON para APIs/tools
 * - HTML para developers (Swagger UI)
 */
export function generateOpenApiSpec(): object {
  const specJson = JSON.stringify(openApiSpec, null, 2);
  const swaggerUiPath = join(__dirname, '../../../docs/swagger-ui');

  // 1. Generate OpenAPI JSON
  const openApiOutputPath = join(swaggerUiPath, 'openapi.json');
  writeFileSync(openApiOutputPath, specJson, 'utf-8');
  console.log(`✅ OpenAPI spec generated: ${openApiOutputPath}`);

  // 2. Generate Swagger UI HTML
  const htmlOutputPath = join(swaggerUiPath, 'index.html');
  const html = generateSwaggerUIHtml();
  writeFileSync(htmlOutputPath, html, 'utf-8');
  console.log(`✅ Swagger UI HTML generated: ${htmlOutputPath}`);

  return openApiSpec;
}

/**
 * Export for programmatic access
 */
export function getOpenApiSpec(): object {
  return openApiSpec;
}

// Run generator if executed directly
if (require.main === module) {
  generateOpenApiSpec();
}
