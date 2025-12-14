/**
 * InvalidUserDataError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Validation
 * - Validación de datos en el dominio
 * - Separación de validación de formato vs validación de negocio
 */

export class InvalidUserDataError extends Error {
  public readonly code: string = 'INVALID_USER_DATA';
  public readonly statusCode: number = 400; // Bad Request

  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'InvalidUserDataError';

    // Mantiene el stack trace correcto en V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}
