/**
 * CloudWatch Logger Implementation
 *
 * 📚 EXAMEN AWS: Structured Logging for CloudWatch
 * - Logs en formato JSON para CloudWatch Logs Insights
 * - Incluye contexto, metadata y timestamps
 * - Compatible con X-Ray tracing
 *
 * 🎯 PATRÓN: Adapter Pattern
 * - Adapta console.log a la interfaz ILogger
 * - Puede extenderse para usar CloudWatch Logs SDK directamente
 */

import { ILogger, LogLevel, LogMetadata } from '@shared/logger/ILogger';

/**
 * Configuración del CloudWatch Logger
 */
export interface CloudWatchLoggerConfig {
  /**
   * Contexto del logger (ej: "CreateUserHandler", "UserService")
   */
  context?: string;

  /**
   * Nivel mínimo de log
   * @default LogLevel.INFO en producción, DEBUG en desarrollo
   */
  minLevel?: LogLevel;

  /**
   * Incluir timestamps (útil para desarrollo local)
   * En Lambda, CloudWatch ya agrega timestamps automáticamente
   * @default false (Lambda maneja timestamps)
   */
  includeTimestamp?: boolean;
}

/**
 * Logger para producción en AWS Lambda + CloudWatch
 *
 * 📚 EXAMEN AWS: CloudWatch Logs
 * - Lambda captura console.log/error automáticamente
 * - Formato JSON permite queries con CloudWatch Logs Insights
 * - Structured logging facilita debugging y monitoring
 *
 * Ejemplo de query en CloudWatch Logs Insights:
 * ```
 * fields @timestamp, level, message, userId, email
 * | filter level = "ERROR"
 * | filter userId = "user-123"
 * | sort @timestamp desc
 * ```
 */
export class CloudWatchLogger implements ILogger {
  private readonly context: string;
  private readonly minLevel: LogLevel;
  private readonly includeTimestamp: boolean;

  constructor(config: CloudWatchLoggerConfig = {}) {
    this.context = config.context ?? 'App';
    this.minLevel = config.minLevel ?? this.getDefaultLogLevel();
    this.includeTimestamp = config.includeTimestamp ?? false;
  }

  /**
   * Log a nivel debug
   *
   * 📚 EXAMEN: Útil para desarrollo, filtrado en producción
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Log a nivel info
   *
   * 📚 EXAMEN: Operaciones normales, flujo del negocio
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, metadata);
    }
  }

  /**
   * Log a nivel warning
   *
   * 📚 EXAMEN: Situaciones anómalas pero no errores
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, metadata);
    }
  }

  /**
   * Log a nivel error
   *
   * 📚 EXAMEN: Errores que requieren atención
   * - Incluye stack trace si hay error
   * - CloudWatch puede generar alarmas basadas en esto
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
   * Escribe el log en formato JSON estructurado
   *
   * 📚 EXAMEN AWS: CloudWatch Logs Insights
   * - JSON permite queries complejas
   * - Cada campo es searchable
   * - Facilita debugging distribuido
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const logEntry: Record<string, any> = {
      level,
      context: this.context,
      message,
      ...metadata,
    };

    // Agregar timestamp solo si está configurado
    // Lambda ya agrega @timestamp automáticamente
    if (this.includeTimestamp) {
      logEntry.timestamp = new Date().toISOString();
    }

    // Agregar información de Lambda si está disponible
    // 📚 EXAMEN: Lambda context information
    if (process.env.AWS_EXECUTION_ENV) {
      logEntry.lambdaInfo = {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        region: process.env.AWS_REGION,
      };
    }

    // Agregar X-Ray trace ID si está disponible
    // 📚 EXAMEN: X-Ray tracing integration
    const traceId = process.env._X_AMZN_TRACE_ID;
    if (traceId) {
      logEntry.traceId = traceId;
    }

    // Output como JSON en una sola línea
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(JSON.stringify(logEntry));
  }

  /**
   * Obtiene el método de console apropiado
   *
   * 📚 EXAMEN AWS: Lambda captura stdout/stderr
   * - console.log → CloudWatch con nivel INFO
   * - console.error → CloudWatch con nivel ERROR
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

  /**
   * Determina el nivel de log por defecto según el ambiente
   *
   * 📚 EXAMEN: Environment-based configuration
   * - Producción: INFO (menos verbose)
   * - Desarrollo: DEBUG (más información)
   */
  private getDefaultLogLevel(): LogLevel {
    const env = process.env.NODE_ENV || 'development';
    const logLevel = process.env.LOG_LEVEL;

    // Si hay LOG_LEVEL explícito, usarlo
    if (logLevel) {
      return (logLevel.toUpperCase() as LogLevel) || LogLevel.INFO;
    }

    // Por defecto según ambiente
    return env === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
}

/**
 * Ejemplo de uso en Lambda:
 *
 * ```typescript
 * const logger = new CloudWatchLogger({
 *   context: 'CreateUserHandler'
 * });
 *
 * logger.info('Processing request', {
 *   userId: '123',
 *   action: 'create'
 * });
 *
 * // Output en CloudWatch:
 * {
 *   "level": "INFO",
 *   "context": "CreateUserHandler",
 *   "message": "Processing request",
 *   "userId": "123",
 *   "action": "create",
 *   "lambdaInfo": {
 *     "functionName": "user-service-createUser",
 *     "functionVersion": "$LATEST",
 *     "memorySize": "256",
 *     "region": "us-east-1"
 *   },
 *   "traceId": "Root=1-67891234-abcdef..."
 * }
 * ```
 *
 * Query en CloudWatch Logs Insights:
 * ```
 * fields @timestamp, level, message, userId
 * | filter context = "CreateUserHandler"
 * | filter userId = "123"
 * | sort @timestamp desc
 * ```
 */
