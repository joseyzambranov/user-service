/**
 * ListUsers Lambda Handler
 *
 * 📚 EXAMEN AWS: API Gateway + Lambda Integration
 * - GET request con query parameters
 * - Paginación (cursor-based pagination)
 * - DynamoDB Scan con límite
 *
 * 🎯 PATRÓN: Thin Controller Pattern + Pagination
 * - Extrae query params (limit, nextToken)
 * - Delega a Use Case
 * - Retorna datos paginados con nextToken
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase';
import { commonResponses } from '@infrastructure/http/apiResponse';
import { handleError } from '@infrastructure/http/errorHandler';
import { awsConfig } from '@infrastructure/config/awsConfig';

/**
 * Schema de validación para query parameters
 *
 * 📚 EXAMEN AWS: Query Parameter Validation
 * - limit: cuántos items retornar (default 20, max 100)
 * - nextToken: cursor para siguiente página (opaque token)
 */
const listUsersQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  nextToken: z.string().optional(),
});

type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/**
 * Lambda Handler: List Users (Paginated)
 *
 * 📚 EXAMEN AWS: Pagination Best Practices
 * - Cursor-based pagination (más eficiente que offset)
 * - Opaque nextToken (no expone estructura interna)
 * - Límite configurable con máximo (previene abuse)
 *
 * @param event - API Gateway Proxy Event
 * @returns API Gateway Proxy Result
 *
 * @example Request (primera página):
 * GET /users?limit=10
 *
 * @example Request (siguiente página):
 * GET /users?limit=10&nextToken=eyJQSyI6IlVTRVIjLCJTSyI6InVzcl94eXoifQ==
 *
 * @example Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "users": [
 *       {
 *         "id": "usr_abc123",
 *         "name": "John Doe",
 *         "email": "john@example.com",
 *         "age": 30,
 *         "createdAt": "2024-01-15T10:30:00.000Z",
 *         "updatedAt": "2024-01-15T10:30:00.000Z"
 *       },
 *       // ... más usuarios
 *     ],
 *     "nextToken": "eyJQSyI6IlVTRVIjLCJTSyI6InVzcl94eXoifQ==",
 *     "hasMore": true
 *   },
 *   "metadata": {
 *     "count": 10,
 *     "limit": 10
 *   }
 * }
 *
 * @example Last Page Response:
 * {
 *   "success": true,
 *   "data": {
 *     "users": [...],
 *     "nextToken": null,
 *     "hasMore": false
 *   },
 *   "metadata": {
 *     "count": 5,
 *     "limit": 10
 *   }
 * }
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const logger = new CloudWatchLogger({ context: 'ListUsersHandler' });

  try {
    logger.info('ListUsers handler invoked', {
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // 1. Parse y validar query parameters
    let queryParams: ListUsersQuery;
    try {
      queryParams = listUsersQuerySchema.parse(
        event.queryStringParameters || {},
      );
    } catch (error) {
      logger.warn('Invalid query parameters');
      return handleError(error, logger, { operation: 'listUsers' });
    }

    // 2. Inicializar dependencias
    const userRepository = new DynamoDBUserRepository(
      awsConfig.tableName,
      logger,
      awsConfig.region,
    );

    const listUsersUseCase = new ListUsersUseCase(userRepository, logger);

    // 3. Ejecutar caso de uso
    logger.info('Executing ListUsersUseCase', {
      limit: queryParams.limit,
      hasNextToken: !!queryParams.nextToken,
    });

    const result = await listUsersUseCase.execute({
      limit: queryParams.limit,
      nextToken: queryParams.nextToken,
    });

    // 4. Retornar respuesta paginada
    logger.info('Users listed successfully', {
      count: result.items.length,
      hasNextToken: !!result.nextToken,
    });

    return commonResponses.ok({
      users: result.items,
      nextToken: result.nextToken,
      count: result.items.length,
      limit: queryParams.limit,
    });
  } catch (error) {
    // 5. Manejo centralizado de errores
    return handleError(error, logger, { operation: 'listUsers' });
  }
};

/**
 * 📚 EXAMEN AWS: Puntos clave de LIST/PAGINATION
 *
 * 1. Pagination Strategies:
 *
 *    A) Offset-based (NO recomendado):
 *       - ?page=2&limit=10
 *       - Pros: Simple, URLs predecibles
 *       - Cons: Ineficiente en DB (skip N records), inconsistente si hay cambios
 *       - DynamoDB no soporta offset nativo
 *
 *    B) Cursor-based (✅ RECOMENDADO):
 *       - ?limit=10&nextToken=xyz
 *       - Pros: Eficiente, consistente, escala bien
 *       - Cons: No se puede saltar a página arbitraria
 *       - DynamoDB usa LastEvaluatedKey (cursor natural)
 *
 * 2. DynamoDB Pagination:
 *    - Scan retorna max 1MB de datos (antes de filtros)
 *    - LastEvaluatedKey = cursor para siguiente página
 *    - Codificar como base64 opaque token (seguridad)
 *    - Limit en request = máximo items a retornar
 *
 * 3. Query Parameters:
 *    - event.queryStringParameters es Record<string, string> | null
 *    - Valores siempre son strings (convertir a number si necesario)
 *    - Validar y sanitizar (prevenir injection, abuse)
 *    - Limit máximo previene overload
 *
 * 4. Performance Considerations:
 *
 *    ⚠️ SCAN es costoso:
 *    - Lee toda la tabla (charged por data scanned)
 *    - No usa índices (full table scan)
 *    - Mejor alternativa: Query con GSI si es posible
 *
 *    ✅ Optimizaciones:
 *    - Limit pequeño (10-50 items)
 *    - Considerar filtros en aplicación si es viable
 *    - Para búsquedas: usar Query + GSI
 *    - Para analytics: export a S3 + Athena
 *
 * 5. Response Format:
 *    - Incluir metadata (count, limit, hasMore)
 *    - nextToken nullable (null = última página)
 *    - hasMore boolean (UX convenience)
 *    - Considerar HATEOAS (links a next/prev pages)
 *
 * 6. Caching:
 *    - Lista puede cachearse en API Gateway
 *    - Cache key incluye query params
 *    - TTL corto (datos cambian frecuentemente)
 *    - Invalidar cache en create/update/delete
 *
 * 7. Alternative Patterns:
 *
 *    A) Keyset Pagination (similar a cursor):
 *       - ?after_id=usr_xyz&limit=10
 *       - Query: PK = USER AND SK > usr_xyz
 *       - Más intuitivo pero requiere índice ordenado
 *
 *    B) Search/Filter:
 *       - Para búsquedas: ElasticSearch, OpenSearch
 *       - Para analytics: DynamoDB Streams → S3 → Athena
 *       - Para full-text: CloudSearch, Algolia
 *
 * 8. Error Handling:
 *    - 400: Query params inválidos (limit > 100, token malformado)
 *    - 500: DynamoDB errors, token decoding errors
 *
 * 9. Security:
 *    - Validar que nextToken no sea manipulado
 *    - Rate limiting (prevenir scraping)
 *    - Autenticación (quién puede listar usuarios)
 *    - Filtrar campos sensibles según permisos
 *
 * 10. Best Practices para el Examen:
 *     ✅ Usar cursor-based pagination
 *     ✅ Limit máximo configurable
 *     ✅ Opaque tokens (no exponer estructura interna)
 *     ✅ Incluir hasMore/nextToken en response
 *     ✅ Validar query parameters
 *     ✅ Log para debugging
 *     ⚠️ Scan es costoso - considerar Query si es posible
 *     ⚠️ 1MB limit en DynamoDB responses
 */
