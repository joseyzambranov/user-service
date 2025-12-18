/**
 * List Users Use Case
 *
 * 📚 EXAMEN AWS: DynamoDB Pagination
 * - Lista usuarios con paginación
 * - Usa Scan de DynamoDB con limit
 * - Retorna nextToken para siguiente página
 *
 * 🎯 PATRÓN: Use Case Pattern + Pagination
 */

import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ILogger } from '@shared/logger/ILogger';
import { PaginatedResult, PaginationOptions } from '@shared/types/common';
import { UserResponseDto, UserMapper } from '../dtos/UserResponseDto';

/**
 * Caso de uso: Listar usuarios con paginación
 *
 * Flujo:
 * 1. Obtener usuarios del repositorio (paginados)
 * 2. Convertir a DTOs
 * 3. Retornar resultado paginado
 */
export class ListUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
  ) {}

  /**
   * Ejecuta el caso de uso de listar usuarios
   *
   * @param options - Opciones de paginación
   * @returns Resultado paginado con usuarios como DTOs
   *
   * @example
   * ```typescript
   * const useCase = new ListUsersUseCase(repository, logger);
   *
   * // Primera página (20 usuarios)
   * const page1 = await useCase.execute({ limit: 20 });
   *
   * // Segunda página usando nextToken
   * const page2 = await useCase.execute({
   *   limit: 20,
   *   nextToken: page1.nextToken
   * });
   * ```
   */
  async execute(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<UserResponseDto>> {
    const limit = options.limit ?? 20; // Default 20 items por página
    const nextToken = options.nextToken;

    this.logger.info('Listing users', {
      limit,
      hasNextToken: !!nextToken,
    });

    // 1. Obtener usuarios del repositorio
    const result = await this.userRepository.list({
      limit,
      lastEvaluatedKey: nextToken,
    });

    this.logger.info('Users listed successfully', {
      count: result.count,
      hasMore: !!result.lastEvaluatedKey,
    });

    // 2. Convertir a DTOs
    const userDtos = UserMapper.toResponseDtoList(result.users);

    // 3. Retornar resultado paginado
    return {
      items: userDtos,
      nextToken: result.lastEvaluatedKey,
      total: result.count,
    };
  }
}

/**
 * Ejemplo de respuesta API paginada:
 *
 * ```json
 * {
 *   "items": [
 *     {
 *       "id": "user-1",
 *       "email": "john@example.com",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "fullName": "John Doe",
 *       "isActive": true,
 *       "createdAt": "2024-01-15T10:30:00.000Z",
 *       "updatedAt": "2024-01-15T10:30:00.000Z"
 *     },
 *     ...
 *   ],
 *   "nextToken": "eyJpZCI6InVzZXItMjAifQ==",
 *   "total": 100
 * }
 * ```
 *
 * 📚 EXAMEN AWS: DynamoDB Pagination
 * - DynamoDB retorna LastEvaluatedKey después de un Scan/Query
 * - Convertimos ese key a un token opaco (base64)
 * - El cliente envía ese token para la siguiente página
 * - No necesitas calcular el total (costoso en DynamoDB)
 */
