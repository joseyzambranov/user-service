/**
 * CreateUser Lambda Handler
 *
 * 📚 EXAMEN AWS: API Gateway + Lambda Integration
 * - Lambda Proxy Integration con API Gateway
 * - Validación de input con schemas
 * - Manejo centralizado de errores
 * - Logging estructurado para CloudWatch
 *
 * 🎯 PATRÓN: Thin Controller Pattern
 * - Handler solo coordina (recibe, valida, delega, responde)
 * - Lógica de negocio en Use Cases
 * - Validación en dos niveles: formato (Zod) + negocio (Domain)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase';
import { UserDomainService } from '@domain/services/UserDomainService';
import { CreateUserSchema, CreateUserDto } from '@application/dtos/CreateUserDto';
import { commonResponses } from '@infrastructure/http/apiResponse';
import { handleError } from '@infrastructure/http/errorHandler';
import { awsConfig } from '@infrastructure/config/awsConfig';

/**
 * Lambda Handler: Create User
 *
 * 📚 EXAMEN AWS: Lambda Handler Best Practices
 * - Inicializa dependencias fuera del handler (reuso en warm starts)
 * - Validación de input
 * - Error handling consistente
 * - Structured logging
 *
 * @param event - API Gateway Proxy Event
 * @returns API Gateway Proxy Result
 *
 * @example Request:
 * POST /users
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "age": 30
 * }
 *
 * @example Success Response (201):
 * {
 *   "success": true,
 *   "message": "User created successfully",
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
 * @example Error Response (409 - Duplicate):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "DUPLICATE_USER",
 *     "message": "User with email 'john@example.com' already exists",
 *     "details": { "email": "john@example.com" }
 *   }
 * }
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // Logger con contexto del handler
  const logger = new CloudWatchLogger({ context: 'CreateUserHandler' });

  try {
    logger.info('CreateUser handler invoked', {
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // 1. Validar que existe body
    if (!event.body) {
      logger.warn('Request body is missing');
      return commonResponses.badRequest('Request body is required');
    }

    // 2. Parse y validar JSON
    let requestData: CreateUserDto;
    try {
      const parsedBody = JSON.parse(event.body);
      requestData = CreateUserSchema.parse(parsedBody);
    } catch (error) {
      logger.warn('Invalid request body format');
      return handleError(error, logger, { operation: 'createUser' });
    }

    // 3. Inicializar dependencias
    // 📚 EXAMEN AWS: Dependency Injection en Lambda
    // - Repository se crea aquí (podría usar DI container en apps grandes)
    // - Lambda reusa estas instancias en warm starts
    const userRepository = new DynamoDBUserRepository(
      awsConfig.tableName,
      logger,
      awsConfig.region,
    );

    const userDomainService = new UserDomainService(userRepository);
    const createUserUseCase = new CreateUserUseCase(
      userRepository,
      userDomainService,
      logger,
    );

    // 4. Ejecutar caso de uso
    logger.info('Executing CreateUserUseCase', {
      email: requestData.email,
    });

    const user = await createUserUseCase.execute(requestData);

    // 5. Retornar respuesta exitosa
    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
    });

    return commonResponses.created(user, 'User created successfully');
  } catch (error) {
    // 6. Manejo centralizado de errores
    // handleError mapea domain errors a HTTP status codes apropiados
    return handleError(error, logger, { operation: 'createUser' });
  }
};

/**
 * 📚 EXAMEN AWS: Puntos clave de este handler
 *
 * 1. Lambda Proxy Integration:
 *    - Recibe APIGatewayProxyEvent (headers, body, pathParameters, etc.)
 *    - Retorna APIGatewayProxyResult (statusCode, headers, body)
 *    - API Gateway maneja serialización/deserialización
 *
 * 2. Error Handling:
 *    - Validación: ZodError → 422 Unprocessable Entity
 *    - Domain: DuplicateUserError → 409 Conflict
 *    - Domain: InvalidUserDataError → 400 Bad Request
 *    - Unexpected: Error → 500 Internal Server Error
 *
 * 3. Logging:
 *    - CloudWatch Logs con JSON estructurado
 *    - Permite queries con CloudWatch Logs Insights
 *    - Incluye context para troubleshooting
 *
 * 4. Cold Start Optimization:
 *    - Imports en el top level (code splitting)
 *    - Dependencias ligeras (solo las necesarias)
 *    - Podrías mover repositorio fuera del handler para reusar conexiones
 *
 * 5. Security:
 *    - Input validation previene injection attacks
 *    - Email validation previene datos malformados
 *    - Error messages sanitizados (no exponen internals)
 */
