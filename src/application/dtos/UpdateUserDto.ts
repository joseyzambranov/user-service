/**
 * Update User DTO
 *
 * 📚 EXAMEN AWS: Partial Updates
 * - Permite actualizar solo los campos enviados
 * - Validación de cada campo que se actualiza
 * - PATCH vs PUT semantics
 *
 * 🎯 PATRÓN: DTO (Data Transfer Object)
 */

import { z } from 'zod';

/**
 * Schema Zod para actualizar un usuario
 *
 * NOTA: Todos los campos son opcionales (partial update)
 * pero si se envían, deben cumplir las reglas de validación
 */
export const UpdateUserSchema = z.object({
  /**
   * Email del usuario (opcional)
   */
  email: z
    .string({
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim()
    .optional(),

  /**
   * Nombre del usuario (opcional)
   */
  firstName: z
    .string({
      invalid_type_error: 'First name must be a string',
    })
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'First name contains invalid characters')
    .trim()
    .optional(),

  /**
   * Apellido del usuario (opcional)
   */
  lastName: z
    .string({
      invalid_type_error: 'Last name must be a string',
    })
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Last name contains invalid characters')
    .trim()
    .optional(),

  /**
   * Estado activo del usuario (opcional)
   */
  isActive: z
    .boolean({
      invalid_type_error: 'isActive must be a boolean',
    })
    .optional(),
})
  .strict() // No permite campos adicionales no definidos
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Tipo TypeScript inferido del schema
 */
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * Ejemplo de uso:
 *
 * ```typescript
 * // Actualizar solo el email
 * const dto: UpdateUserDto = {
 *   email: 'newemail@example.com'
 * };
 *
 * // Actualizar múltiples campos
 * const dto: UpdateUserDto = {
 *   firstName: 'Jane',
 *   lastName: 'Smith',
 *   isActive: false
 * };
 *
 * // Error: Al menos un campo es requerido
 * const dto: UpdateUserDto = {}; // ❌ Falla la validación
 * ```
 */
