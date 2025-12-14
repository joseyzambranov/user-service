/**
 * DuplicateUserError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Error handling
 * - Errores de reglas de negocio
 * - Idempotencia y validación (importante para el examen)
 * - DynamoDB: Conditional writes para evitar duplicados
 */

export class DuplicateUserError extends Error {
  public readonly code: string = 'DUPLICATE_USER';
  public readonly statusCode: number = 409; // Conflict

  constructor(email: string) {
    super(`User with email '${email}' already exists`);
    this.name = 'DuplicateUserError';

    // Mantiene el stack trace correcto en V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}
