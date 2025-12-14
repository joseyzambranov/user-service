/**
 * IUserRepository - Repository Interface (Domain Layer)
 *
 * 📚 EXAMEN AWS: Dominio 1.3 - Data stores
 * - Repository Pattern: Abstracción del almacenamiento de datos
 * - Dependency Inversion Principle: El dominio define la interfaz
 * - La implementación (DynamoDB) estará en Infrastructure layer
 *
 * 📚 EXAMEN AWS: Clean Architecture
 * - Domain no depende de AWS SDK
 * - Facilita testing con mocks
 * - Permite cambiar de DynamoDB a otra DB sin afectar el dominio
 */

import { User } from '../entities/User';

/**
 * Opciones de listado con paginación
 * 📚 EXAMEN: DynamoDB pagination (importante para el examen)
 */
export interface ListUsersOptions {
  limit?: number;
  lastEvaluatedKey?: string; // Para pagination en DynamoDB
}

/**
 * Resultado de listado paginado
 * 📚 EXAMEN: Pagination pattern
 */
export interface ListUsersResult {
  users: User[];
  lastEvaluatedKey?: string;
  count: number;
}

/**
 * Interfaz del repositorio de usuarios
 * Define las operaciones CRUD que el dominio necesita
 */
export interface IUserRepository {
  /**
   * Guardar un nuevo usuario
   * 📚 EXAMEN: DynamoDB PutItem operation
   * - Debe validar que el email no exista (conditional write)
   * - Lanza DuplicateUserError si el email ya existe
   */
  save(user: User): Promise<User>;

  /**
   * Buscar usuario por ID
   * 📚 EXAMEN: DynamoDB GetItem operation
   * - Query por partition key
   * - Retorna null si no existe
   */
  findById(id: string): Promise<User | null>;

  /**
   * Buscar usuario por email
   * 📚 EXAMEN: DynamoDB Query con GSI (Global Secondary Index)
   * - Email será un GSI para búsquedas eficientes
   * - Importante: Query vs Scan (Query es más eficiente)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Actualizar usuario existente
   * 📚 EXAMEN: DynamoDB UpdateItem operation
   * - Update condicional (solo si existe)
   * - Optimistic locking (puede implementarse con version number)
   */
  update(user: User): Promise<User>;

  /**
   * Eliminar usuario por ID
   * 📚 EXAMEN: DynamoDB DeleteItem operation
   * - Delete condicional
   * - Soft delete vs hard delete (este será hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Listar usuarios con paginación
   * 📚 EXAMEN: DynamoDB Scan con pagination
   * - Importante: Scan es costoso, usar con cuidado
   * - LastEvaluatedKey para pagination
   * - Limit para controlar tamaño de respuesta
   */
  list(options?: ListUsersOptions): Promise<ListUsersResult>;

  /**
   * Verificar si existe un usuario por email
   * 📚 EXAMEN: Query eficiente
   * - Útil para validaciones antes de crear
   * - Evita leer toda la entidad si solo necesitamos saber si existe
   */
  existsByEmail(email: string): Promise<boolean>;
}
