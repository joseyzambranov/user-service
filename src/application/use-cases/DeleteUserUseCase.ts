/**
 * Delete User Use Case
 *
 * 📚 EXAMEN AWS: Delete Operations
 * - Elimina un usuario del sistema
 * - Soft delete vs Hard delete considerations
 * - Validaciones antes de eliminar
 *
 * 🎯 PATRÓN: Use Case Pattern
 */

import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { ILogger } from '@shared/logger/ILogger';

/**
 * Caso de uso: Eliminar un usuario
 *
 * Flujo:
 * 1. Buscar usuario existente
 * 2. Validar que se puede eliminar (reglas de negocio)
 * 3. Eliminar del repositorio
 *
 * NOTA: Esta implementación hace hard delete.
 * En producción, considera usar soft delete (isActive = false)
 */
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly logger: ILogger,
  ) {}

  /**
   * Ejecuta el caso de uso de eliminar usuario
   *
   * @param userId - ID del usuario a eliminar
   * @returns void
   * @throws UserNotFoundError si el usuario no existe
   *
   * @example
   * ```typescript
   * const useCase = new DeleteUserUseCase(repository, domainService, logger);
   * await useCase.execute('user-123');
   * ```
   */
  async execute(userId: string): Promise<void> {
    this.logger.info('Deleting user', { userId });

    // 1. Buscar usuario existente
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn('User not found for deletion', { userId });
      throw new UserNotFoundError(userId);
    }

    // 2. Validar que se puede eliminar (regla de negocio)
    const canDelete = await this.userDomainService.canBeDeleted(userId);
    if (!canDelete) {
      this.logger.warn('User cannot be deleted (business rule)', {
        userId,
        isActive: user.isActive,
      });
      // En este caso simple siempre se puede eliminar,
      // pero en producción podrías tener reglas como:
      // - No eliminar si tiene órdenes pendientes
      // - No eliminar si es admin
      // - etc.
    }

    // 3. Eliminar del repositorio
    await this.userRepository.delete(userId);

    this.logger.info('User deleted successfully', {
      userId,
      email: user.email,
    });
  }
}

/**
 * Alternativa: Soft Delete
 *
 * En lugar de eliminar permanentemente, desactiva el usuario:
 *
 * ```typescript
 * async execute(userId: string): Promise<void> {
 *   const user = await this.userRepository.findById(userId);
 *   if (!user) throw new UserNotFoundError(userId);
 *
 *   user.deactivate();
 *   await this.userRepository.update(user);
 * }
 * ```
 *
 * Ventajas del Soft Delete:
 * - Datos auditables (cumplimiento)
 * - Posibilidad de restaurar
 * - Historial completo
 *
 * Desventajas:
 * - Más datos en DynamoDB
 * - Necesitas filtrar users activos en queries
 */
