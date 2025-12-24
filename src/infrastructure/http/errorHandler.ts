/**
 * Error Handler for HTTP APIs
 *
 * 📚 EXAMEN AWS: Error Handling in Lambda
 * - Mapea errores de dominio a códigos HTTP
 * - Logs errores para CloudWatch
 * - Sanitiza errores en producción
 *
 * 🎯 PATRÓN: Error Mapping Strategy
 * - Separa errores de negocio (4xx) de errores técnicos (5xx)
 * - Protege información sensible en producción
 */

import { ZodError } from 'zod';
import { ILogger, LogMetadata } from '@shared/logger/ILogger';
import { DomainError } from '@shared/errors/DomainError';
import { DuplicateUserError } from '@domain/errors/DuplicateUserError';
import { InvalidUserDataError } from '@domain/errors/InvalidUserDataError';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { APIGatewayResponse, commonResponses } from './apiResponse';

/**
 * Información del error procesado
 */
interface ErrorInfo {
  message: string;
  statusCode: number;
  code: string;
  details?: unknown;
  isOperational: boolean; // Si es un error esperado del negocio
}

/**
 * Extrae información relevante del error
 *
 * @param error - Error capturado
 * @returns Información estructurada del error
 */
function extractErrorInfo(error: unknown): ErrorInfo {
  // 1. Errores de dominio (business logic)
  if (error instanceof UserNotFoundError) {
    return {
      message: error.message,
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      isOperational: true,
    };
  }

  if (error instanceof DuplicateUserError) {
    return {
      message: error.message,
      statusCode: 409,
      code: 'DUPLICATE_USER',
      details: { email: error.email },
      isOperational: true,
    };
  }

  if (error instanceof InvalidUserDataError) {
    return {
      message: error.message,
      statusCode: 400,
      code: 'INVALID_USER_DATA',
      details: error.field ? { field: error.field } : undefined,
      isOperational: true,
    };
  }

  // Cualquier DomainError genérico
  if (error instanceof DomainError) {
    return {
      message: error.message,
      statusCode: 400,
      code: 'DOMAIN_ERROR',
      isOperational: true,
    };
  }

  // 2. Errores de validación (Zod)
  if (error instanceof ZodError) {
    return {
      message: 'Validation failed',
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
      isOperational: true,
    };
  }

  // 3. Errores de JavaScript estándar
  if (error instanceof Error) {
    // Errores conocidos que son operacionales
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return {
        message: error.message,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        isOperational: true,
      };
    }

    // Error genérico no esperado
    return {
      message: error.message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      isOperational: false,
    };
  }

  // 4. String error
  if (typeof error === 'string') {
    return {
      message: error,
      statusCode: 500,
      code: 'UNKNOWN_ERROR',
      isOperational: false,
    };
  }

  // 4. Error desconocido
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    isOperational: false,
  };
}

/**
 * Maneja errores y retorna respuesta HTTP apropiada
 *
 * 📚 EXAMEN AWS: Lambda Error Handling Best Practices
 * - Log errores para debugging
 * - Sanitiza errores en producción (no expone stack traces)
 * - Mapea correctamente errores de negocio vs técnicos
 *
 * @param error - Error capturado
 * @param logger - Logger para CloudWatch
 * @param context - Contexto adicional para logging
 * @returns Response HTTP formateada
 *
 * @example
 * ```typescript
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   try {
 *     const user = await getUserById(id);
 *     return commonResponses.ok(user);
 *   } catch (error) {
 *     return handleError(error, logger, { operation: 'getUser', userId: id });
 *   }
 * };
 * ```
 */
export function handleError(
  error: unknown,
  logger: ILogger,
  context?: Record<string, unknown>,
): APIGatewayResponse {
  const errorInfo = extractErrorInfo(error);
  const isProduction = process.env.NODE_ENV === 'production';

  // Log del error para CloudWatch
  if (errorInfo.isOperational) {
    // Errores de negocio (esperados) → log como warning
    const metadata: LogMetadata = {
      code: errorInfo.code,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      ...context,
    };
    if (errorInfo.details) {
      metadata.details = errorInfo.details as object;
    }
    logger.warn('Operational error occurred', metadata);
  } else {
    // Errores técnicos (no esperados) → log como error con stack trace
    logger.error('Unexpected error occurred', error as Error, {
      code: errorInfo.code,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      ...context,
    });
  }

  // Sanitizar mensaje en producción para errores no operacionales
  const clientMessage = isProduction && !errorInfo.isOperational
    ? 'An internal server error occurred'
    : errorInfo.message;

  // Retornar respuesta HTTP apropiada
  switch (errorInfo.statusCode) {
    case 400:
      return commonResponses.badRequest(clientMessage, errorInfo.details);

    case 404:
      return commonResponses.notFound(clientMessage);

    case 409:
      return commonResponses.conflict(clientMessage, errorInfo.details);

    case 422:
      return commonResponses.unprocessableEntity(clientMessage, errorInfo.details);

    case 500:
    default:
      return commonResponses.internalServerError(clientMessage);
  }
}

/**
 * Wrapper para handlers de Lambda con manejo automático de errores
 *
 * 📚 EXAMEN AWS: Lambda Handler Pattern
 * - Centraliza try/catch
 * - Logging consistente
 * - Error handling estandarizado
 *
 * @param handler - Handler function
 * @param logger - Logger instance
 * @returns Wrapped handler con error handling
 *
 * @example
 * ```typescript
 * export const handler = withErrorHandler(
 *   async (event, logger) => {
 *     const user = await getUserUseCase.execute(event.pathParameters.id);
 *     return commonResponses.ok(user);
 *   },
 *   logger
 * );
 * ```
 */
export function withErrorHandler<TEvent>(
  handler: (event: TEvent, logger: ILogger) => Promise<APIGatewayResponse>,
  logger: ILogger,
): (event: TEvent) => Promise<APIGatewayResponse> {
  return async (event: TEvent): Promise<APIGatewayResponse> => {
    try {
      // Solo log de metadatos del event, no todo el event
      logger.info('Lambda handler invoked');
      const response = await handler(event, logger);
      logger.info('Lambda handler completed successfully', {
        statusCode: response.statusCode,
      });
      return response;
    } catch (error) {
      return handleError(error, logger);
    }
  };
}

/**
 * Ejemplo completo de uso en Lambda:
 *
 * ```typescript
 * import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
 * import { handleError, withErrorHandler } from '@infrastructure/http/errorHandler';
 * import { commonResponses } from '@infrastructure/http/apiResponse';
 * import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
 *
 * const logger = new CloudWatchLogger({ context: 'GetUserHandler' });
 *
 * // Opción 1: Error handling manual
 * export const handler = async (
 *   event: APIGatewayProxyEvent
 * ): Promise<APIGatewayProxyResult> => {
 *   try {
 *     const userId = event.pathParameters?.id;
 *     if (!userId) {
 *       return commonResponses.badRequest('User ID is required');
 *     }
 *
 *     const user = await getUserUseCase.execute(userId);
 *     return commonResponses.ok(user);
 *   } catch (error) {
 *     return handleError(error, logger, { userId: event.pathParameters?.id });
 *   }
 * };
 *
 * // Opción 2: Con wrapper (más limpio)
 * export const handler = withErrorHandler(
 *   async (event: APIGatewayProxyEvent, logger) => {
 *     const userId = event.pathParameters?.id;
 *     if (!userId) {
 *       return commonResponses.badRequest('User ID is required');
 *     }
 *
 *     const user = await getUserUseCase.execute(userId);
 *     return commonResponses.ok(user);
 *   },
 *   logger
 * );
 * ```
 *
 * 📚 EXAMEN AWS: Error Handling Strategies
 *
 * Errores Operacionales (4xx) - Esperados:
 * - UserNotFoundError → 404
 * - DuplicateUserError → 409
 * - InvalidUserDataError → 400
 * - ZodError (validation) → 422
 *
 * Errores Técnicos (5xx) - No esperados:
 * - Database connection error → 500
 * - AWS SDK errors → 500
 * - Unexpected exceptions → 500
 *
 * Best Practices:
 * ✅ Log todos los errores para debugging
 * ✅ Sanitiza errores técnicos en producción
 * ✅ Retorna errores de negocio con detalles útiles
 * ✅ Usa códigos HTTP correctos
 * ✅ Incluye CORS headers en respuestas de error
 */
