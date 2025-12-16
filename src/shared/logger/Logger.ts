/**
 * Console Logger Implementation
 *
 * 📚 EXAMEN AWS: Structured Logging
 * - Logs estructurados en formato JSON
 * - Preparado para CloudWatch Logs
 * - Incluye contexto y metadata
 *
 * 💡 NOTA: Esta es una implementación básica para desarrollo.
 * En producción, se usará CloudWatchLogger (infrastructure layer)
 */

import { ILogger, LogLevel, LogMetadata } from './ILogger';

/**
 * Configuración del logger
 */
export interface LoggerConfig {
  /**
   * Contexto del logger (ej: "UserService", "CreateUserUseCase")
   */
  context?: string;

  /**
   * Nivel mínimo de log a mostrar
   */
  minLevel?: LogLevel;
}

/**
 * Logger de consola con output estructurado
 *
 * Ideal para desarrollo local y testing
 */
export class Logger implements ILogger {
  private context: string;
  private minLevel: LogLevel;

  constructor(config: LoggerConfig = {}) {
    this.context = config.context ?? 'App';
    this.minLevel = config.minLevel ?? LogLevel.DEBUG;
  }

  /**
   * Log a nivel debug
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Log a nivel info
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, metadata);
    }
  }

  /**
   * Log a nivel warning
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, metadata);
    }
  }

  /**
   * Log a nivel error
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMetadata: LogMetadata = {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      };
      this.log(LogLevel.ERROR, message, errorMetadata);
    }
  }

  /**
   * Determina si se debe loggear según el nivel mínimo
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Escribe el log en formato estructurado (JSON)
   *
   * 📚 EXAMEN AWS: CloudWatch Logs acepta JSON estructurado
   * que permite búsquedas y filtros avanzados
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...metadata,
    };

    // En desarrollo, usar console con colores
    const logMethod = this.getConsoleMethod(level);
    logMethod(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Obtiene el método de console apropiado según el nivel
   */
  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }
}
