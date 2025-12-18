/**
 * Get User Use Case
 *
 * 📚 EXAMEN AWS: Read Operations
 * - Recupera un usuario por ID
 * - Manejo de errores (usuario no encontrado)
 * - Query pattern en DynamoDB
 *
 * 🎯 PATRÓN: Use Case Pattern
 */

import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { ILogger } from '@shared/logger/ILogger';
import { UserResponseDto, UserMapper } from '../dtos/UserResponseDto';

/**
 * Caso de uso: Obtener un usuario por ID
 *
 * Flujo:
 * 1. Buscar usuario en el repositorio
 * 2. Si no existe, lanzar error
 * 3. Convertir a DTO de respuesta
 */
export class GetUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
  ) {}

  /**
   * Ejecuta el caso de uso de obtener usuario
   *
   * @param userId - ID del usuario a buscar
   * @returns Usuario encontrado como DTO
   * @throws UserNotFoundError si el usuario no existe
   *
   * @example
   * ```typescript
   * const useCase = new GetUserUseCase(repository, logger);
   * const userDto = await useCase.execute('user-123');
   * ```
   */
  async execute(userId: string): Promise<UserResponseDto> {
    this.logger.info('Getting user', { userId });

    // 1. Buscar usuario en el repositorio
    const user = await this.userRepository.findById(userId);

    // 2. Validar que existe
    if (!user) {
      this.logger.warn('User not found', { userId });
      throw new UserNotFoundError(userId);
    }

    this.logger.info('User retrieved successfully', {
      userId: user.id,
      email: user.email,
    });

    // 3. Convertir a DTO de respuesta
    return UserMapper.toResponseDto(user);
  }
}
