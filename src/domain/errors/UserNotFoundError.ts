/**
 * UserNotFoundError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Error handling
 * - Errores específicos de dominio
 * - Separación de errores técnicos vs errores de negocio
 * - Facilita troubleshooting (Dominio 4.1)
 */

export class UserNotFoundError extends Error {
  public readonly code: string = 'USER_NOT_FOUND';
  public readonly statusCode: number = 404;

  constructor(userId: string) {
    super(`User with ID '${userId}' not found`);
    this.name = 'UserNotFoundError';

    // Mantiene el stack trace correcto en V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}
