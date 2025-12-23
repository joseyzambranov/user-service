/**
 * Error Response DTO
 *
 * 📚 EXAMEN AWS: API Error Response Format
 * - Formato estandarizado para errores
 * - Compatible con OpenAPI/Swagger
 * - Coincide con la estructura de apiResponse.ts
 *
 * 🎯 PATRÓN: DTO + Schema
 * - Schema Zod: validación y generación de OpenAPI
 * - DTO: tipo TypeScript inferido del schema
 */

import { z } from 'zod';

/**
 * Schema Zod para ErrorResponse
 *
 * 📚 EXAMEN AWS: Schema-First Development
 * - Define estructura de errores con Zod
 * - Genera OpenAPI spec automáticamente
 * - Tipo TypeScript inferido (DRY)
 *
 * Estructura:
 * {
 *   "success": false,
 *   "error": {
 *     "message": "User not found",
 *     "code": "USER_NOT_FOUND",
 *     "details": { ... }
 *   }
 * }
 */
export const ErrorResponseSchema = z.object({
  /**
   * Indicador de éxito (siempre false para errores)
   */
  success: z.literal(false).describe('Always false for error responses'),

  /**
   * Detalles del error
   */
  error: z.object({
    /**
     * Mensaje de error legible para humanos
     */
    message: z.string({
      description: 'Human-readable error message',
    }),

    /**
     * Código de error para identificación programática
     */
    code: z.string({
      description: 'Machine-readable error code',
    }).optional(),

    /**
     * Detalles adicionales del error (validaciones, campos afectados, etc.)
     */
    details: z.any({
      description: 'Additional error details (validation errors, affected fields, etc.)',
    }).optional(),
  }),
});

/**
 * Tipo TypeScript inferido del schema
 *
 * 🎯 VENTAJA: El tipo se deriva automáticamente del schema
 * Si cambias el schema, el tipo se actualiza automáticamente
 */
export type ErrorResponseDto = z.infer<typeof ErrorResponseSchema>;

/**
 * Ejemplos de respuestas de error:
 *
 * ```json
 * // Error 404 - Not Found
 * {
 *   "success": false,
 *   "error": {
 *     "message": "User not found",
 *     "code": "USER_NOT_FOUND"
 *   }
 * }
 *
 * // Error 409 - Conflict
 * {
 *   "success": false,
 *   "error": {
 *     "message": "User with this email already exists",
 *     "code": "DUPLICATE_USER",
 *     "details": {
 *       "email": "john.doe@example.com"
 *     }
 *   }
 * }
 *
 * // Error 422 - Validation Error
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Validation failed",
 *     "code": "VALIDATION_ERROR",
 *     "details": [
 *       {
 *         "path": "email",
 *         "message": "Invalid email format"
 *       },
 *       {
 *         "path": "firstName",
 *         "message": "First name must be at least 2 characters"
 *       }
 *     ]
 *   }
 * }
 *
 * // Error 500 - Internal Server Error
 * {
 *   "success": false,
 *   "error": {
 *     "message": "An internal server error occurred",
 *     "code": "INTERNAL_SERVER_ERROR"
 *   }
 * }
 * ```
 */
