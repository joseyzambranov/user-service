/**
 * Base DomainError
 *
 * 📚 EXAMEN AWS: Error Hierarchy
 * - Errores de dominio vs errores técnicos
 * - Permite diferenciar errores esperados (4xx) de no esperados (5xx)
 *
 * 🎯 PATRÓN: Error Hierarchy
 * - Todos los errores de dominio extienden de esta clase
 * - Facilita error handling centralizado
 */

export abstract class DomainError extends Error {
  /**
   * Código único del error para identificación
   */
  public abstract readonly code: string;

  /**
   * Código HTTP sugerido para este error
   */
  public abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Mantiene el stack trace correcto en V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}
