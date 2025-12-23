/**
 * User ID Path Parameter DTO
 *
 * 📚 EXAMEN AWS: Path Parameter Validation
 * - Valida el ID del usuario en path params
 * - Compatible con OpenAPI/Swagger
 * - Reutilizable en GET, PUT, DELETE endpoints
 *
 * 🎯 PATRÓN: DTO + Schema
 * - Schema Zod: validación de path parameters
 * - DTO: tipo TypeScript inferido del schema
 */

import { z } from 'zod';

/**
 * Schema Zod para User ID path parameter
 *
 * 📚 EXAMEN AWS: API Gateway Path Parameters
 * - Path params siempre son strings
 * - Validación de formato y longitud
 * - Usado en: GET /users/{id}, PUT /users/{id}, DELETE /users/{id}
 */
export const UserIdParamSchema = z.object({
  /**
   * ID único del usuario (path parameter)
   */
  id: z.string({
    required_error: 'User ID is required',
    invalid_type_error: 'User ID must be a string',
  })
    .min(1, 'User ID cannot be empty')
    .describe('User unique identifier (UUID)'),
});

/**
 * Tipo TypeScript inferido del schema
 */
export type UserIdParamDto = z.infer<typeof UserIdParamSchema>;

/**
 * Ejemplo de uso en Lambda handler:
 *
 * ```typescript
 * import { SchemaValidator } from '@shared/validators/SchemaValidator';
 * import { UserIdParamSchema, UserIdParamDto } from './UserIdParamDto';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   // Validar path parameters
 *   const params: UserIdParamDto = SchemaValidator.validate(
 *     UserIdParamSchema,
 *     event.pathParameters
 *   );
 *
 *   const userId = params.id;
 *   // ... usar userId
 * };
 * ```
 *
 * Ejemplo de path parameter en request:
 * ```
 * GET /users/user-a3bb189e-8bf9-3888-9912-ace4e6543002
 * PUT /users/user-a3bb189e-8bf9-3888-9912-ace4e6543002
 * DELETE /users/user-a3bb189e-8bf9-3888-9912-ace4e6543002
 * ```
 */
