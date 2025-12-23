/**
 * User List Response DTO
 *
 * 📚 EXAMEN AWS: Paginated API Response
 * - Lista de usuarios con paginación
 * - nextToken para cursor-based pagination (DynamoDB)
 * - Compatible con OpenAPI/Swagger
 *
 * 🎯 PATRÓN: DTO + Schema
 * - Schema Zod: validación y generación de OpenAPI
 * - DTO: tipo TypeScript inferido del schema
 */

import { z } from 'zod';
import { UserResponseSchema } from './UserResponseDto';

/**
 * Schema Zod para UserListResponse
 *
 * 📚 EXAMEN AWS: DynamoDB Pagination
 * - users: Array de usuarios
 * - nextToken: Token de paginación de DynamoDB (LastEvaluatedKey)
 * - count: Número de usuarios retornados en esta página
 * - limit: Límite de usuarios solicitado
 *
 * Cursor-based pagination:
 * - Cliente envía nextToken de respuesta anterior
 * - Servidor retorna siguiente página
 * - Si nextToken es undefined, no hay más páginas
 */
export const UserListResponseSchema = z.object({
  /**
   * Array de usuarios
   */
  users: z.array(UserResponseSchema, {
    description: 'Array of user objects',
  }),

  /**
   * Token de paginación (opcional)
   * Presente solo si hay más páginas disponibles
   */
  nextToken: z.string({
    description: 'Pagination token for next page (DynamoDB LastEvaluatedKey)',
  }).optional(),

  /**
   * Número de usuarios retornados en esta página
   */
  count: z.number({
    description: 'Number of users returned in this page',
  }),

  /**
   * Límite de usuarios solicitado
   */
  limit: z.number({
    description: 'Maximum number of users requested per page',
  }),
});

/**
 * Tipo TypeScript inferido del schema
 *
 * 🎯 VENTAJA: El tipo se deriva automáticamente del schema
 * Si cambias el schema, el tipo se actualiza automáticamente
 */
export type UserListResponseDto = z.infer<typeof UserListResponseSchema>;

/**
 * Ejemplo de respuesta API:
 *
 * ```json
 * // Primera página (con más resultados)
 * {
 *   "users": [
 *     {
 *       "id": "user-123",
 *       "email": "john@example.com",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "fullName": "John Doe",
 *       "isActive": true,
 *       "createdAt": "2024-01-15T10:30:00.000Z",
 *       "updatedAt": "2024-01-15T10:30:00.000Z"
 *     },
 *     {
 *       "id": "user-456",
 *       "email": "jane@example.com",
 *       "firstName": "Jane",
 *       "lastName": "Smith",
 *       "fullName": "Jane Smith",
 *       "isActive": true,
 *       "createdAt": "2024-01-16T14:20:00.000Z",
 *       "updatedAt": "2024-01-16T14:20:00.000Z"
 *     }
 *   ],
 *   "nextToken": "eyJpZCI6InVzZXItNDU2In0=",
 *   "count": 2,
 *   "limit": 10
 * }
 *
 * // Última página (sin más resultados)
 * {
 *   "users": [
 *     {
 *       "id": "user-789",
 *       "email": "bob@example.com",
 *       "firstName": "Bob",
 *       "lastName": "Johnson",
 *       "fullName": "Bob Johnson",
 *       "isActive": false,
 *       "createdAt": "2024-01-17T09:15:00.000Z",
 *       "updatedAt": "2024-01-17T09:15:00.000Z"
 *     }
 *   ],
 *   "count": 1,
 *   "limit": 10
 * }
 * ```
 *
 * 📚 EXAMEN AWS: DynamoDB Pagination Pattern
 *
 * Query params para paginación:
 * - limit: Número máximo de items por página (default: 20)
 * - nextToken: Token de la página anterior (para obtener siguiente página)
 *
 * Ejemplo de uso:
 * ```
 * GET /users?limit=10
 * GET /users?limit=10&nextToken=eyJpZCI6InVzZXItNDU2In0=
 * ```
 */
