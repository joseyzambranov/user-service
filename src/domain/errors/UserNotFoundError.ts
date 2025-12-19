/**
 * UserNotFoundError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Error handling
 * - Errores específicos de dominio
 * - Separación de errores técnicos vs errores de negocio
 * - Facilita troubleshooting (Dominio 4.1)
 */

import { DomainError } from '@shared/errors/DomainError';

export class UserNotFoundError extends DomainError {
  public readonly code: string = 'USER_NOT_FOUND';
  public readonly statusCode: number = 404;
  public readonly userId: string;

  constructor(userId: string) {
    super(`User with ID '${userId}' not found`);
    this.userId = userId;
  }
}
