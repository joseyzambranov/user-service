/**
 * Common Types
 *
 * 📚 EXAMEN AWS: Type Safety
 * - Tipos compartidos en toda la aplicación
 * - Mejora la seguridad de tipos
 * - Documenta contratos de datos
 */

/**
 * Resultado de operaciones con paginación
 *
 * 📚 EXAMEN AWS: DynamoDB Pagination
 * - Pattern estándar para APIs con paginación
 * - Compatible con DynamoDB LastEvaluatedKey
 *
 * @example
 * ```typescript
 * const result: PaginatedResult<User> = {
 *   items: [user1, user2],
 *   nextToken: 'eyJpZCI6Imxhc3QtaWQifQ==',
 *   total: 100
 * };
 * ```
 */
export interface PaginatedResult<T> {
  /**
   * Items de la página actual
   */
  items: T[];

  /**
   * Token para obtener la siguiente página
   * undefined si no hay más páginas
   */
  nextToken?: string;

  /**
   * Total de items (opcional, puede ser costoso de calcular en DynamoDB)
   */
  total?: number;
}

/**
 * Opciones para consultas con paginación
 *
 * @example
 * ```typescript
 * const options: PaginationOptions = {
 *   limit: 20,
 *   nextToken: 'eyJpZCI6Imxhc3QtaWQifQ=='
 * };
 * ```
 */
export interface PaginationOptions {
  /**
   * Número máximo de items por página
   * @default 20
   */
  limit?: number;

  /**
   * Token de la página anterior (para continuar paginación)
   */
  nextToken?: string;
}

/**
 * Resultado de operaciones (Success/Failure pattern)
 *
 * 🎯 PATRÓN: Result Pattern (alternativa a exceptions)
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { success: false, error: 'Division by zero' };
 *   }
 *   return { success: true, data: a / b };
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Omite campos específicos de un tipo
 *
 * Útil para crear DTOs sin campos sensibles
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   email: string;
 *   password: string;
 *   role: string;
 * }
 *
 * type PublicUser = OmitFields<User, 'password'>;
 * // { id: string; email: string; role: string; }
 * ```
 */
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

/**
 * Hace campos específicos opcionales
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   email: string;
 *   firstName: string;
 *   lastName: string;
 * }
 *
 * type CreateUserInput = PartialFields<User, 'id'>;
 * // { id?: string; email: string; firstName: string; lastName: string; }
 * ```
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Hace campos específicos requeridos
 *
 * @example
 * ```typescript
 * interface User {
 *   id?: string;
 *   email?: string;
 *   firstName: string;
 * }
 *
 * type FullUser = RequiredFields<User, 'id' | 'email'>;
 * // { id: string; email: string; firstName: string; }
 * ```
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Valores primitivos permitidos en metadata
 */
export type PrimitiveValue = string | number | boolean | null | undefined;

/**
 * Objeto con valores primitivos (útil para metadata)
 */
export type PrimitiveObject = {
  [key: string]: PrimitiveValue | PrimitiveValue[] | PrimitiveObject;
};

/**
 * Tipo para timestamps de auditoría
 *
 * 📚 EXAMEN AWS: Audit Trail
 * - Rastrea creación y modificación de entidades
 * - Best practice para compliance
 */
export interface AuditTimestamps {
  /**
   * Fecha de creación (UTC)
   */
  createdAt: Date;

  /**
   * Fecha de última actualización (UTC)
   */
  updatedAt: Date;
}

/**
 * Metadata extendida de auditoría
 *
 * Incluye información de quién realizó las operaciones
 */
export interface ExtendedAuditInfo extends AuditTimestamps {
  /**
   * Usuario que creó el registro
   */
  createdBy?: string;

  /**
   * Usuario que actualizó por última vez
   */
  updatedBy?: string;
}

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Deep Partial - hace todos los campos opcionales recursivamente
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Función asíncrona genérica
 */
export type AsyncFunction<T = void, Args extends unknown[] = []> = (...args: Args) => Promise<T>;
