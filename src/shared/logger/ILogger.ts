/**
 * Logger Interface
 *
 * 📚 EXAMEN AWS: Structured Logging
 * - Define la abstracción para logging estructurado
 * - Permite cambiar implementación sin afectar el código
 * - Facilita testing con mocks
 *
 * 🎯 PATRÓN: Dependency Inversion Principle
 * - La capa de dominio depende de esta interfaz
 * - La implementación concreta está en infrastructure
 */

/**
 * Niveles de log estructurado
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Metadata adicional para logs estructurados
 */
export interface LogMetadata {
  [key: string]: string | number | boolean | undefined | null | object;
}

/**
 * Interfaz de Logger
 *
 * Todos los loggers deben implementar esta interfaz para
 * mantener consistencia en toda la aplicación.
 */
export interface ILogger {
  /**
   * Log a nivel debug (desarrollo)
   */
  debug(message: string, metadata?: LogMetadata): void;

  /**
   * Log a nivel info (operaciones normales)
   */
  info(message: string, metadata?: LogMetadata): void;

  /**
   * Log a nivel warning (situaciones anómalas pero no errores)
   */
  warn(message: string, metadata?: LogMetadata): void;

  /**
   * Log a nivel error (errores que requieren atención)
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void;
}
