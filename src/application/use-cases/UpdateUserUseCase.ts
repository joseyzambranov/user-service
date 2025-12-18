/**
 * Update User Use Case
 *
 * 📚 EXAMEN AWS: Update Operations
 * - Actualiza un usuario existente
 * - Partial update (solo campos enviados)
 * - Validación de email único si se cambia
 *
 * 🎯 PATRÓN: Use Case Pattern
 */

import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { ILogger } from '@shared/logger/ILogger';
import { UpdateUserDto } from '../dtos/UpdateUserDto';
import { UserResponseDto, UserMapper } from '../dtos/UserResponseDto';

/**
 * Caso de uso: Actualizar un usuario existente
 *
 * Flujo:
 * 1. Buscar usuario existente
 * 2. Si se cambia el email, validar que sea único
 * 3. Actualizar perfil usando método de dominio
 * 4. Persistir cambios
 * 5. Retornar DTO de respuesta
 */
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly logger: ILogger,
  ) {}

  /**
   * Ejecuta el caso de uso de actualizar usuario
   *
   * @param userId - ID del usuario a actualizar
   * @param dto - Datos para actualizar (parcial)
   * @returns Usuario actualizado como DTO
   * @throws UserNotFoundError si el usuario no existe
   * @throws DuplicateUserError si el nuevo email ya existe
   * @throws InvalidUserDataError si los datos son inválidos
   *
   * @example
   * ```typescript
   * const useCase = new UpdateUserUseCase(repository, domainService, logger);
   * const userDto = await useCase.execute('user-123', {
   *   firstName: 'Jane',
   *   email: 'jane@example.com'
   * });
   * ```
   */
  async execute(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.info('Updating user', {
      userId,
      fields: Object.keys(dto),
    });

    // 1. Buscar usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('User not found for update', { userId });
      throw new UserNotFoundError(userId);
    }

    // 2. Si se cambia el email, validar que sea único
    if (dto.email && dto.email !== user.email) {
      this.logger.info('Email change detected, validating uniqueness', {
        userId,
        oldEmail: user.email,
        newEmail: dto.email,
      });
      await this.userDomainService.ensureEmailIsUnique(dto.email);
    }

    // 3. Actualizar perfil usando método de dominio
    user.update({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // 4. Actualizar estado activo si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    // 5. Persistir cambios
    const updatedUser = await this.userRepository.update(user);

    this.logger.info('User updated successfully', {
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    // 6. Convertir a DTO de respuesta
    return UserMapper.toResponseDto(updatedUser);
  }
}
