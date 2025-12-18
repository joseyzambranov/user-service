/**
 * User Response DTO
 *
 * 📚 EXAMEN AWS: API Response Format
 * - Formato estandarizado para respuestas
 * - Oculta detalles de implementación interna
 * - Compatible con OpenAPI/Swagger
 *
 * 🎯 PATRÓN: DTO + Mapper
 * - DTO: estructura de datos para API
 * - Mapper: convierte entidad de dominio a DTO
 */

import { User } from '@domain/entities/User';

/**
 * DTO de respuesta para un usuario
 *
 * Incluye solo la información que debe ser visible para el cliente
 */
export interface UserResponseDto {
  /**
   * ID único del usuario
   */
  id: string;

  /**
   * Email del usuario
   */
  email: string;

  /**
   * Nombre del usuario
   */
  firstName: string;

  /**
   * Apellido del usuario
   */
  lastName: string;

  /**
   * Nombre completo del usuario (calculado)
   */
  fullName: string;

  /**
   * Estado activo del usuario
   */
  isActive: boolean;

  /**
   * Fecha de creación (ISO 8601)
   */
  createdAt: string;

  /**
   * Fecha de última actualización (ISO 8601)
   */
  updatedAt: string;
}

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
