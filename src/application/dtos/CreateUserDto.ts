/**
 * Create User DTO
 *
 * 📚 EXAMEN AWS: Input Validation
 * - Validación de entrada con Zod
 * - Previene inyecciones y datos malformados
 * - Schema-first development
 *
 * 🎯 PATRÓN: DTO (Data Transfer Object)
 * - Separa la capa de presentación del dominio
 * - Validación explícita de entrada
 */

import { z } from 'zod';

/**
 * Schema Zod para crear un usuario
 *
 * 📚 EXAMEN AWS: Validación de API Gateway
 * - Este schema se puede convertir a OpenAPI 3.0
 * - Documenta automáticamente la API
 */
export const CreateUserSchema = z.object({
  /**
   * Email del usuario (requerido, formato email válido)
   */
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim(),

  /**
   * Nombre del usuario (requerido)
   */
  firstName: z
    .string({
      required_error: 'First name is required',
      invalid_type_error: 'First name must be a string',
    })
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'First name contains invalid characters')
    .trim(),

  /**
   * Apellido del usuario (requerido)
   */
  lastName: z
    .string({
      required_error: 'Last name is required',
      invalid_type_error: 'Last name must be a string',
    })
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Last name contains invalid characters')
    .trim(),
});

/**
 * Tipo TypeScript inferido del schema
 *
 * 🎯 VENTAJA: El tipo se deriva automáticamente del schema
 * Si cambias el schema, el tipo se actualiza automáticamente
 */
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Ejemplo de uso:
 *
 * ```typescript
 * import { SchemaValidator } from '@shared/validators/SchemaValidator';
 * import { CreateUserSchema, CreateUserDto } from './CreateUserDto';
 *
 * const rawData = JSON.parse(event.body);
 * const dto: CreateUserDto = SchemaValidator.validate(CreateUserSchema, rawData);
 * // dto está validado y tipado
 * ```
 */
