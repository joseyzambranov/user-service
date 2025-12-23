/**
 * User Response DTO
 *
 * 📚 EXAMEN AWS: API Response Format
 * - Formato estandarizado para respuestas
 * - Oculta detalles de implementación interna
 * - Compatible con OpenAPI/Swagger
 *
 * 🎯 PATRÓN: DTO + Mapper + Schema
 * - Schema Zod: validación y generación de OpenAPI
 * - DTO: tipo TypeScript inferido del schema
 * - Mapper: convierte entidad de dominio a DTO
 */

import { z } from 'zod';
import { User } from '@domain/entities/User';

/**
 * Schema Zod para UserResponse
 *
 * 📚 EXAMEN AWS: Schema-First Development
 * - Define estructura de datos con Zod
 * - Genera OpenAPI spec automáticamente
 * - Tipo TypeScript inferido (DRY)
 */
export const UserResponseSchema = z.object({
  /**
   * ID único del usuario (UUID v4)
   */
  id: z.string({
    description: 'User unique identifier',
  }),

  /**
   * Email del usuario
   */
  email: z.string().email({
    message: 'Invalid email format',
  }).describe('User email address'),

  /**
   * Nombre del usuario
   */
  firstName: z.string({
    description: 'User first name',
  }),

  /**
   * Apellido del usuario
   */
  lastName: z.string({
    description: 'User last name',
  }),

  /**
   * Nombre completo del usuario (calculado)
   */
  fullName: z.string({
    description: 'User full name (computed from firstName + lastName)',
  }),

  /**
   * Estado activo del usuario
   */
  isActive: z.boolean({
    description: 'Whether the user account is active',
  }),

  /**
   * Fecha de creación (ISO 8601)
   */
  createdAt: z.string().datetime({
    message: 'Invalid datetime format',
  }).describe('Timestamp when the user was created (ISO 8601)'),

  /**
   * Fecha de última actualización (ISO 8601)
   */
  updatedAt: z.string().datetime({
    message: 'Invalid datetime format',
  }).describe('Timestamp when the user was last updated (ISO 8601)'),
});

/**
 * Tipo TypeScript inferido del schema
 *
 * 🎯 VENTAJA: El tipo se deriva automáticamente del schema
 * Si cambias el schema, el tipo se actualiza automáticamente
 */
export type UserResponseDto = z.infer<typeof UserResponseSchema>;

/**
 * Mapper para convertir entidad User a UserResponseDto
 *
 * 🎯 PATRÓN: Mapper Pattern
 * - Separa la lógica de conversión
 * - Facilita testing
 * - Mantiene el dominio desacoplado
 */
export class UserMapper {
  /**
   * Convierte una entidad User a UserResponseDto
   *
   * @param user - Entidad de dominio User
   * @returns DTO de respuesta
   *
   * @example
   * ```typescript
   * const user = User.create({ email: 'john@example.com', ... });
   * const dto = UserMapper.toResponseDto(user);
   * // { id: '...', email: 'john@example.com', fullName: 'John Doe', ... }
   * ```
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Convierte un array de entidades User a array de DTOs
   *
   * @param users - Array de entidades de dominio
   * @returns Array de DTOs de respuesta
   *
   * @example
   * ```typescript
   * const users = [user1, user2, user3];
   * const dtos = UserMapper.toResponseDtoList(users);
   * ```
   */
  static toResponseDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }
}

/**
 * Ejemplo de respuesta API:
 *
 * ```json
 * {
 *   "id": "user-a3bb189e-8bf9-3888-9912-ace4e6543002",
 *   "email": "john.doe@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "fullName": "John Doe",
 *   "isActive": true,
 *   "createdAt": "2024-01-15T10:30:00.000Z",
 *   "updatedAt": "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
