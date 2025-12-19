/**
 * UpdateUser Lambda Handler
 *
 * 📚 EXAMEN AWS: API Gateway + Lambda Integration
 * - PUT request (idempotent update)
 * - Path parameters + Request body
 * - Partial updates con validación
 *
 * 🎯 PATRÓN: Thin Controller Pattern
 * - Combina path param (ID) con body (datos)
 * - Validación de input
 * - Delega a Use Case
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
import { UpdateUserUseCase } from '@application/use-cases/UpdateUserUseCase';
import { UserDomainService } from '@domain/services/UserDomainService';
import { UpdateUserSchema, UpdateUserDto } from '@application/dtos/UpdateUserDto';
import { commonResponses } from '@infrastructure/http/apiResponse';
import { handleError } from '@infrastructure/http/errorHandler';
import { awsConfig } from '@infrastructure/config/awsConfig';

/**
 * Lambda Handler: Update User
 *
 * 📚 EXAMEN AWS: Lambda Handler for Updates
 * - PUT es idempotente (múltiples llamadas con mismos datos = mismo resultado)
 * - Partial updates (solo campos enviados se actualizan)
 * - Validación antes de actualizar
 *
 * @param event - API Gateway Proxy Event
 * @returns API Gateway Proxy Result
 *
 * @example Request:
 * PUT /users/usr_abc123
 * {
 *   "name": "Jane Doe",
 *   "age": 31
 * }
 *
 * @example Success Response (200):
 * {
 *   "success": true,
 *   "message": "User updated successfully",
 *   "data": {
 *     "id": "usr_abc123",
 *     "name": "Jane Doe",
 *     "email": "john@example.com",
 *     "age": 31,
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T11:45:00.000Z"
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
  const logger = new CloudWatchLogger({ context: 'UpdateUserHandler' });

  try {
    logger.info('UpdateUser handler invoked', {
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // 1. Extraer y validar path parameter
    const userId = event.pathParameters?.id;

    if (!userId) {
      logger.warn('User ID path parameter is missing');
      return commonResponses.badRequest('User ID is required');
    }

    if (userId.trim().length === 0) {
      logger.warn('User ID is empty', { userId });
      return commonResponses.badRequest('User ID cannot be empty');
    }

    // 2. Validar que existe body
    if (!event.body) {
      logger.warn('Request body is missing');
      return commonResponses.badRequest('Request body is required');
    }

    // 3. Parse y validar JSON
    let updateData: UpdateUserDto;
    try {
      const parsedBody = JSON.parse(event.body);
      updateData = UpdateUserSchema.parse(parsedBody);
    } catch (error) {
      logger.warn('Invalid request body format');
      return handleError(error, logger, { operation: 'updateUser', userId });
    }

    // 4. Inicializar dependencias
    const userRepository = new DynamoDBUserRepository(
      awsConfig.tableName,
      logger,
      awsConfig.region,
    );

    const userDomainService = new UserDomainService(userRepository);
    const updateUserUseCase = new UpdateUserUseCase(
      userRepository,
      userDomainService,
      logger,
    );

    // 5. Ejecutar caso de uso
    logger.info('Executing UpdateUserUseCase', {
      userId,
      fields: Object.keys(updateData),
    });

    const updatedUser = await updateUserUseCase.execute(userId, updateData);

    // 6. Retornar respuesta exitosa
    logger.info('User updated successfully', {
      userId: updatedUser.id,
      updatedFields: Object.keys(updateData),
    });

    return commonResponses.ok(updatedUser, 'User updated successfully');
  } catch (error) {
    // 7. Manejo centralizado de errores
    // UserNotFoundError → 404
    // InvalidUserDataError → 400
    // DuplicateUserError → 409 (si se intenta cambiar email a uno existente)
    return handleError(error, logger, {
      operation: 'updateUser',
      userId: event.pathParameters?.id,
    });
  }
};

/**
 * 📚 EXAMEN AWS: Puntos clave de UPDATE requests
 *
 * 1. Idempotencia:
 *    - PUT es idempotente
 *    - Múltiples llamadas con mismos datos = mismo resultado
 *    - DynamoDB UpdateItem es idempotente por naturaleza
 *
 * 2. Partial vs Full Updates:
 *    - PATCH: partial update (solo campos enviados)
 *    - PUT: tradicionalmente full replacement, aquí usamos partial
 *    - DynamoDB UpdateExpression permite partial updates eficientemente
 *
 * 3. Optimistic Locking (avanzado):
 *    - Usar version field para prevenir lost updates
 *    - DynamoDB conditional writes: attribute_exists(version)
 *    - Incrementar version en cada update
 *
 * 4. Error Handling:
 *    - 400: Datos inválidos, body vacío
 *    - 404: Usuario no existe
 *    - 409: Email duplicado (si se intenta cambiar)
 *    - 422: Validación falla (Zod errors)
 *
 * 5. DynamoDB Update Patterns:
 *    - UpdateItem solo modifica atributos especificados
 *    - No requiere leer antes de escribir
 *    - Retorna valores nuevos con ReturnValues: 'ALL_NEW'
 *    - Más eficiente que Get + Put
 *
 * 6. Security:
 *    - Validar que usuario tiene permiso para actualizar (authn/authz)
 *    - No permitir actualizar campos sensibles (id, createdAt)
 *    - Sanitizar email antes de actualizar GSI
 */
