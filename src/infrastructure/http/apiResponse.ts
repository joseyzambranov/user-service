/**
 * API Response Helpers
 *
 * 📚 EXAMEN AWS: Lambda + API Gateway Response Format
 * - statusCode: HTTP status code
 * - headers: CORS headers, content-type
 * - body: JSON stringified response
 *
 * 🎯 PATRÓN: Response Factory Pattern
 * - Estandariza respuestas HTTP
 * - Maneja CORS automáticamente
 * - Serializa JSON correctamente
 */

import { ErrorResponseDto } from '@application/dtos/ErrorResponseDto';

/**
 * Lambda/API Gateway response format
 *
 * 📚 EXAMEN AWS: Este es el formato exacto que espera API Gateway
 */
export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Success response data wrapper
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response data wrapper
 * Reutiliza ErrorResponseDto para consistencia con OpenAPI
 */
export type ErrorResponse = ErrorResponseDto;

/**
 * Default CORS headers
 *
 * 📚 EXAMEN AWS: CORS es crítico para APIs públicas
 * - Access-Control-Allow-Origin: Permite cualquier origen (ajustar en prod)
 * - Access-Control-Allow-Credentials: Permite cookies/auth headers
 * - Access-Control-Allow-Methods: Métodos HTTP permitidos
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // TODO: Configurar en prod según dominio
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Crea una respuesta exitosa (2xx)
 *
 * @param data - Datos a retornar
 * @param statusCode - Código HTTP (default: 200)
 * @param message - Mensaje opcional
 *
 * @example
 * ```typescript
 * return success({ id: "123", name: "John" }, 201, "User created");
 * // → { statusCode: 201, body: '{"success":true,"data":{...}}' }
 * ```
 */
export function success<T>(
  data: T,
  statusCode: number = 200,
  message?: string,
): APIGatewayResponse {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
}

/**
 * Crea una respuesta de error (4xx, 5xx)
 *
 * @param message - Mensaje de error
 * @param statusCode - Código HTTP (default: 500)
 * @param code - Código de error custom
 * @param details - Detalles adicionales del error
 *
 * @example
 * ```typescript
 * return error("User not found", 404, "USER_NOT_FOUND");
 * // → { statusCode: 404, body: '{"success":false,"error":{...}}' }
 * ```
 */
export function error(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any,
): APIGatewayResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
}

/**
 * Respuestas comunes pre-construidas
 *
 * 📚 EXAMEN AWS: Códigos HTTP más comunes
 */
export const commonResponses = {
  /**
   * 200 OK - Operación exitosa
   */
  ok: <T>(data: T, message?: string) => success(data, 200, message),

  /**
   * 201 Created - Recurso creado exitosamente
   */
  created: <T>(data: T, message?: string) => success(data, 201, message),

  /**
   * 204 No Content - Operación exitosa sin contenido
   */
  noContent: (): APIGatewayResponse => ({
    statusCode: 204,
    headers: DEFAULT_HEADERS,
    body: '',
  }),

  /**
   * 400 Bad Request - Request inválido
   */
  badRequest: (message: string = 'Bad Request', details?: any) =>
    error(message, 400, 'BAD_REQUEST', details),

  /**
   * 401 Unauthorized - No autenticado
   */
  unauthorized: (message: string = 'Unauthorized') =>
    error(message, 401, 'UNAUTHORIZED'),

  /**
   * 403 Forbidden - No autorizado
   */
  forbidden: (message: string = 'Forbidden') =>
    error(message, 403, 'FORBIDDEN'),

  /**
   * 404 Not Found - Recurso no encontrado
   */
  notFound: (message: string = 'Not Found', resource?: string) =>
    error(message, 404, 'NOT_FOUND', resource ? { resource } : undefined),

  /**
   * 409 Conflict - Conflicto (ej: email duplicado)
   */
  conflict: (message: string = 'Conflict', details?: any) =>
    error(message, 409, 'CONFLICT', details),

  /**
   * 422 Unprocessable Entity - Validación fallida
   */
  unprocessableEntity: (message: string, validationErrors?: any) =>
    error(message, 422, 'VALIDATION_ERROR', validationErrors),

  /**
   * 500 Internal Server Error - Error del servidor
   */
  internalServerError: (message: string = 'Internal Server Error') =>
    error(message, 500, 'INTERNAL_SERVER_ERROR'),

  /**
   * 503 Service Unavailable - Servicio no disponible
   */
  serviceUnavailable: (message: string = 'Service Unavailable') =>
    error(message, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Ejemplo de uso en Lambda handler:
 *
 * ```typescript
 * import { success, error, commonResponses } from '@infrastructure/http/apiResponse';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   try {
 *     const user = await createUser(data);
 *
 *     // Opción 1: Función genérica
 *     return success(user, 201, "User created successfully");
 *
 *     // Opción 2: Helper específico
 *     return commonResponses.created(user, "User created successfully");
 *
 *   } catch (err) {
 *     if (err instanceof UserNotFoundError) {
 *       return commonResponses.notFound(err.message);
 *     }
 *
 *     if (err instanceof DuplicateUserError) {
 *       return commonResponses.conflict(err.message);
 *     }
 *
 *     return commonResponses.internalServerError();
 *   }
 * };
 * ```
 *
 * 📚 EXAMEN AWS: Lambda Response Format
 * API Gateway Lambda Proxy Integration requiere exactamente:
 * - statusCode: number
 * - headers: object (opcional, pero necesario para CORS)
 * - body: string (debe ser JSON.stringify si es objeto)
 *
 * ❌ INCORRECTO:
 * return { statusCode: 200, body: { data: user } }  // body debe ser string
 *
 * ✅ CORRECTO:
 * return { statusCode: 200, body: JSON.stringify({ data: user }) }
 */
