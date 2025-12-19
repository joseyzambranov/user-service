/**
 * DuplicateUserError - Domain Error
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Error handling
 * - Errores de reglas de negocio
 * - Idempotencia y validación (importante para el examen)
 * - DynamoDB: Conditional writes para evitar duplicados
 */

import { DomainError } from '@shared/errors/DomainError';

export class DuplicateUserError extends DomainError {
  public readonly code: string = 'DUPLICATE_USER';
  public readonly statusCode: number = 409; // Conflict
  public readonly email: string;

  constructor(email: string) {
    super(`User with email '${email}' already exists`);
    this.email = email;
  }
}
