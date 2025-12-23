/**
 * List Users Query Parameters DTO
 *
 * 📚 EXAMEN AWS: Query Parameter Validation
 * - Parámetros de paginación para GET /users
 * - limit: número de items por página
 * - nextToken: cursor para siguiente página
 *
 * 🎯 PATRÓN: DTO + Schema
 * - Schema Zod: validación de query parameters
 * - DTO: tipo TypeScript inferido del schema
 */

import { z } from 'zod';

/**
 * Schema Zod para List Users query parameters
 *
 * 📚 EXAMEN AWS: API Gateway Query Parameters
 * - Query params siempre son strings (convertir a number si necesario)
 * - limit: default 20, max 100
 * - nextToken: opaque pagination token
 */
export const ListUsersQuerySchema = z.object({
  /**
   * Número máximo de usuarios a retornar
   * Default: 20, Min: 1, Max: 100
   */
  limit: z
    .string({
      description: 'Maximum number of users to return per page',
    })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
    ),

  /**
   * Token de paginación (cursor)
   * Opcional - solo presente al solicitar páginas siguientes
   */
  nextToken: z
    .string({
      description: 'Pagination cursor token from previous response',
    })
    .optional(),
});

/**
 * Tipo TypeScript inferido del schema
 * Nota: limit es number después de la transformación
 */
export type ListUsersQueryDto = z.infer<typeof ListUsersQuerySchema>;

/**
 * Ejemplo de uso en Lambda handler:
 *
 * ```typescript
 * import { SchemaValidator } from '@shared/validators/SchemaValidator';
 * import { ListUsersQuerySchema, ListUsersQueryDto } from './ListUsersQueryDto';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   // Validar query parameters
 *   const queryParams: ListUsersQueryDto = SchemaValidator.validate(
 *     ListUsersQuerySchema,
 *     event.queryStringParameters || {}
 *   );
 *
 *   const { limit, nextToken } = queryParams;
 *   // limit es number, nextToken es string | undefined
 * };
 * ```
 *
 * Ejemplos de query strings:
 * ```
 * GET /users
 * → limit=20, nextToken=undefined
 *
 * GET /users?limit=10
 * → limit=10, nextToken=undefined
 *
 * GET /users?limit=50&nextToken=eyJpZCI6InVzZXItMTIzIn0=
 * → limit=50, nextToken="eyJpZCI6InVzZXItMTIzIn0="
 *
 * GET /users?limit=200
 * → Error: Limit cannot exceed 100
 *
 * GET /users?limit=abc
 * → Error: Limit must be an integer
 * ```
 */
