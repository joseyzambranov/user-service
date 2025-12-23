/**
 * GetUser Lambda Handler
 *
 * 📚 EXAMEN AWS: API Gateway + Lambda Integration
 * - Path Parameters extraction
 * - GET requests (idempotent, cacheable)
 * - 404 handling para recursos no encontrados
 *
 * 🎯 PATRÓN: Thin Controller Pattern
 * - Extrae parámetros del path
 * - Delega a Use Case
 * - Retorna respuesta formateada
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
import { GetUserUseCase } from '@application/use-cases/GetUserUseCase';
import { commonResponses } from '@infrastructure/http/apiResponse';
import { handleError } from '@infrastructure/http/errorHandler';
import { awsConfig } from '@infrastructure/config/awsConfig';
import { UserIdParamSchema, UserIdParamDto } from '@application/dtos/UserIdParamDto';

/**
 * Lambda Handler: Get User by ID
 *
 * 📚 EXAMEN AWS: Lambda + API Gateway Path Parameters
 * - Extracción de path parameters (event.pathParameters)
 * - Validación de parámetros requeridos
 * - Error 404 cuando recurso no existe
 *
 * @param event - API Gateway Proxy Event
 * @returns API Gateway Proxy Result
 *
 * @example Request:
 * GET /users/usr_abc123
 *
 * @example Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "usr_abc123",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "age": 30,
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 *
 * @example Error Response (404):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "USER_NOT_FOUND",
 *     "message": "User with ID 'usr_abc123' not found"
 *   }
 * }
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const logger = new CloudWatchLogger({ context: 'GetUserHandler' });

  try {
    logger.info('GetUser handler invoked', {
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // 1. Extraer y validar path parameter usando DTO
    let pathParams: UserIdParamDto;
    try {
      pathParams = UserIdParamSchema.parse(event.pathParameters);
    } catch (error) {
      logger.warn('Invalid path parameters');
      return handleError(error, logger, { operation: 'getUser' });
    }

    const userId = pathParams.id;

    // 2. Inicializar dependencias
    const userRepository = new DynamoDBUserRepository(
      awsConfig.tableName,
      logger,
      awsConfig.region,
    );

    const getUserUseCase = new GetUserUseCase(userRepository, logger);

    // 4. Ejecutar caso de uso
    logger.info('Executing GetUserUseCase', { userId });

    const user = await getUserUseCase.execute(userId);

    // 5. Retornar respuesta exitosa
    logger.info('User retrieved successfully', {
      userId: user.id,
      email: user.email,
    });

    return commonResponses.ok(user);
  } catch (error) {
    // 6. Manejo centralizado de errores
    // UserNotFoundError → 404
    // Otros errores → 500
    return handleError(error, logger, {
      operation: 'getUser',
      userId: event.pathParameters?.id,
    });
  }
};

/**
 * 📚 EXAMEN AWS: Puntos clave de GET requests
 *
 * 1. Idempotencia:
 *    - GET es idempotente (múltiples llamadas = mismo resultado)
 *    - Safe method (no modifica estado del servidor)
 *    - Cacheable por defecto
 *
 * 2. Path Parameters:
 *    - Definidos en API Gateway route: /users/{id}
 *    - Accesibles via event.pathParameters
 *    - Siempre validar que existen
 *
 * 3. Caching (para el examen):
 *    - API Gateway puede cachear GET requests
 *    - Cache key incluye path + query strings
 *    - TTL configurable (segundos)
 *    - Reduce llamadas a Lambda (cost optimization)
 *
 * 4. Error Handling:
 *    - 400: Parámetro inválido o faltante
 *    - 404: Recurso no encontrado (UserNotFoundError)
 *    - 500: Error inesperado
 *
 * 5. Performance:
 *    - DynamoDB GetItem es O(1) - muy rápido
 *    - Usa PK directamente: USER#${id}
 *    - No requiere scan/query
 */
