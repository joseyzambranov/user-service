/**
 * DeleteUser Lambda Handler
 *
 * 📚 EXAMEN AWS: API Gateway + Lambda Integration
 * - DELETE request (idempotent)
 * - Path parameters
 * - 204 No Content response
 *
 * 🎯 PATRÓN: Thin Controller Pattern
 * - Extrae ID del path
 * - Delega eliminación a Use Case
 * - Retorna 204 (no body needed)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
import { DeleteUserUseCase } from '@application/use-cases/DeleteUserUseCase';
import { UserDomainService } from '@domain/services/UserDomainService';
import { commonResponses } from '@infrastructure/http/apiResponse';
import { handleError } from '@infrastructure/http/errorHandler';
import { awsConfig } from '@infrastructure/config/awsConfig';

/**
 * Lambda Handler: Delete User
 *
 * 📚 EXAMEN AWS: DELETE Operations
 * - DELETE es idempotente (eliminar N veces = mismo resultado)
 * - Retorna 204 No Content si exitoso
 * - Retorna 404 si recurso no existe
 *
 * @param event - API Gateway Proxy Event
 * @returns API Gateway Proxy Result
 *
 * @example Request:
 * DELETE /users/usr_abc123
 *
 * @example Success Response (204):
 * (sin body - solo status code 204)
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
  const logger = new CloudWatchLogger({ context: 'DeleteUserHandler' });

  try {
    logger.info('DeleteUser handler invoked', {
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

    // 2. Inicializar dependencias
    const userRepository = new DynamoDBUserRepository(
      awsConfig.tableName,
      logger,
      awsConfig.region,
    );

    const userDomainService = new UserDomainService(userRepository);
    const deleteUserUseCase = new DeleteUserUseCase(
      userRepository,
      userDomainService,
      logger,
    );

    // 3. Ejecutar caso de uso
    logger.info('Executing DeleteUserUseCase', { userId });

    await deleteUserUseCase.execute(userId);

    // 4. Retornar respuesta exitosa (204 No Content)
    logger.info('User deleted successfully', { userId });

    return commonResponses.noContent();
  } catch (error) {
    // 5. Manejo centralizado de errores
    // UserNotFoundError → 404
    // Otros errores → 500
    return handleError(error, logger, {
      operation: 'deleteUser',
      userId: event.pathParameters?.id,
    });
  }
};

/**
 * 📚 EXAMEN AWS: Puntos clave de DELETE requests
 *
 * 1. Idempotencia:
 *    - DELETE es idempotente
 *    - Primera llamada: elimina recurso (204)
 *    - Llamadas posteriores: recurso ya no existe (404 o 204 según implementación)
 *    - Nuestra implementación: 404 en llamadas posteriores (UserNotFoundError)
 *
 * 2. Status Codes:
 *    - 204 No Content: Eliminación exitosa, sin body en response
 *    - 200 OK: Alternativa si se retorna info del recurso eliminado
 *    - 404 Not Found: Recurso no existe
 *    - 400 Bad Request: ID inválido o faltante
 *
 * 3. Soft Delete vs Hard Delete:
 *    - Hard Delete: Elimina físicamente del DB (nuestra implementación)
 *    - Soft Delete: Marca como eliminado (flag isDeleted=true)
 *    - Soft delete permite:
 *      - Auditoría (quién eliminó, cuándo)
 *      - Recuperación (undelete)
 *      - Compliance (retención de datos)
 *
 * 4. DynamoDB Delete Patterns:
 *    - DeleteItem: elimina por PK+SK
 *    - Conditional delete: attribute_exists(PK) para error si no existe
 *    - No requiere read antes de delete
 *    - ReturnValues: 'ALL_OLD' para retornar datos eliminados
 *
 * 5. Cascade Deletes (avanzado):
 *    - Si user tiene recursos relacionados (orders, posts, etc.)
 *    - Opción 1: Cascade delete (eliminar todo en transacción)
 *    - Opción 2: Prevent delete si hay dependencias (409 Conflict)
 *    - Opción 3: Soft delete + background cleanup
 *
 * 6. Security:
 *    - Validar autorización (usuario puede eliminar este recurso?)
 *    - Logging para auditoría (quién eliminó qué)
 *    - Backup/snapshot antes de deletes masivos
 *
 * 7. Best Practices:
 *    - ✅ Log operación para auditoría
 *    - ✅ Validar autorización
 *    - ✅ Considerar soft delete para datos críticos
 *    - ✅ Retornar 204 sin body (eficiente)
 *    - ⚠️ No eliminar datos sin validación
 */
