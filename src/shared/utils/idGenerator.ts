/**
 * ID Generator Utilities
 *
 * 📚 EXAMEN AWS: Unique Identifiers
 * - Generación de IDs únicos (UUID v4)
 * - Para primary keys en DynamoDB
 * - Para tracking y correlación de requests
 *
 * 💡 UUID v4: Universally Unique Identifier
 * - 128 bits de aleatoriedad criptográfica
 * - Probabilidad de colisión casi cero
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un UUID v4 único
 *
 * @returns String UUID en formato estándar (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
 *
 * @example
 * ```typescript
 * const userId = generateId();
 * // "a3bb189e-8bf9-3888-9912-ace4e6543002"
 * ```
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Genera un UUID con prefijo
 *
 * Útil para identificar el tipo de entidad en DynamoDB
 *
 * @param prefix - Prefijo para el ID (ej: "user", "order")
 * @returns String con formato: prefix_uuid
 *
 * @example
 * ```typescript
 * const userId = generateIdWithPrefix('user');
 * // "user_a3bb189e-8bf9-3888-9912-ace4e6543002"
 *
 * const orderId = generateIdWithPrefix('order');
 * // "order_f7cc289a-9cf0-4999-0023-bdf5f7654113"
 * ```
 */
export function generateIdWithPrefix(prefix: string): string {
  return `${prefix}_${uuidv4()}`;
}

/**
 * Valida si un string es un UUID válido
 *
 * @param id - String a validar
 * @returns true si es un UUID válido (v1, v3, v4, o v5)
 *
 * @example
 * ```typescript
 * isValidUUID('a3bb189e-8bf9-3888-9912-ace4e6543002'); // true
 * isValidUUID('invalid-id'); // false
 * ```
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Genera un ID corto (sin guiones)
 *
 * @returns String UUID sin guiones
 *
 * @example
 * ```typescript
 * const shortId = generateShortId();
 * // "a3bb189e8bf938889912ace4e6543002"
 * ```
 */
export function generateShortId(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Genera un correlation ID para tracking de requests
 *
 * Útil para X-Ray tracing y debugging distribuido
 *
 * @returns String UUID prefijado con "req_"
 *
 * @example
 * ```typescript
 * const correlationId = generateCorrelationId();
 * // "req_a3bb189e-8bf9-3888-9912-ace4e6543002"
 * ```
 */
export function generateCorrelationId(): string {
  return generateIdWithPrefix('req');
}
