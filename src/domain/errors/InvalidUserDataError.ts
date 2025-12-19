/**
 * InvalidUserDataError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Validation
 * - Validación de datos en el dominio
 * - Separación de validación de formato vs validación de negocio
 */

import { DomainError } from '@shared/errors/DomainError';

export class InvalidUserDataError extends DomainError {
  public readonly code: string = 'INVALID_USER_DATA';
  public readonly statusCode: number = 400; // Bad Request

  constructor(message: string, public readonly field?: string) {
    super(message);
  }
}
