/**
 * Date Utilities
 *
 * 📚 EXAMEN AWS: Timestamp Management
 * - Manejo consistente de fechas en UTC
 * - Formato ISO 8601 para APIs
 * - Utilidades para auditoría (createdAt, updatedAt)
 *
 * 💡 BEST PRACTICE: Siempre usar UTC en el backend
 */

/**
 * Obtiene la fecha/hora actual en UTC
 *
 * @returns Date object en UTC
 *
 * @example
 * ```typescript
 * const now = getCurrentDate();
 * console.log(now.toISOString()); // "2024-01-15T10:30:00.000Z"
 * ```
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Formatea una fecha a string ISO 8601
 *
 * @param date - Fecha a formatear
 * @returns String en formato ISO 8601 (UTC)
 *
 * @example
 * ```typescript
 * const dateStr = formatToISO(new Date());
 * // "2024-01-15T10:30:00.000Z"
 * ```
 */
export function formatToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parsea un string ISO 8601 a Date
 *
 * @param dateString - String en formato ISO 8601
 * @returns Date object
 * @throws Error si el string no es válido
 *
 * @example
 * ```typescript
 * const date = parseFromISO("2024-01-15T10:30:00.000Z");
 * ```
 */
export function parseFromISO(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Verifica si una fecha es válida
 *
 * @param date - Fecha a verificar
 * @returns true si la fecha es válida
 *
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate(new Date('invalid')); // false
 * ```
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Agrega días a una fecha
 *
 * @param date - Fecha base
 * @param days - Número de días a agregar (puede ser negativo)
 * @returns Nueva fecha con los días agregados
 *
 * @example
 * ```typescript
 * const tomorrow = addDays(new Date(), 1);
 * const yesterday = addDays(new Date(), -1);
 * ```
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agrega horas a una fecha
 *
 * @param date - Fecha base
 * @param hours - Número de horas a agregar (puede ser negativo)
 * @returns Nueva fecha con las horas agregadas
 *
 * @example
 * ```typescript
 * const inOneHour = addHours(new Date(), 1);
 * ```
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Calcula la diferencia en días entre dos fechas
 *
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Diferencia en días (puede ser negativo)
 *
 * @example
 * ```typescript
 * const diff = diffInDays(new Date('2024-01-20'), new Date('2024-01-15'));
 * console.log(diff); // 5
 * ```
 */
export function diffInDays(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc1 - utc2) / msPerDay);
}

/**
 * Verifica si una fecha está en el pasado
 *
 * @param date - Fecha a verificar
 * @returns true si la fecha está en el pasado
 *
 * @example
 * ```typescript
 * isPast(new Date('2020-01-01')); // true
 * isPast(new Date('2030-01-01')); // false
 * ```
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Verifica si una fecha está en el futuro
 *
 * @param date - Fecha a verificar
 * @returns true si la fecha está en el futuro
 *
 * @example
 * ```typescript
 * isFuture(new Date('2030-01-01')); // true
 * isFuture(new Date('2020-01-01')); // false
 * ```
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Obtiene el inicio del día (00:00:00.000)
 *
 * @param date - Fecha base
 * @returns Nueva fecha al inicio del día
 *
 * @example
 * ```typescript
 * const startOfDay = getStartOfDay(new Date('2024-01-15T10:30:00Z'));
 * // 2024-01-15T00:00:00.000Z
 * ```
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtiene el fin del día (23:59:59.999)
 *
 * @param date - Fecha base
 * @returns Nueva fecha al fin del día
 *
 * @example
 * ```typescript
 * const endOfDay = getEndOfDay(new Date('2024-01-15T10:30:00Z'));
 * // 2024-01-15T23:59:59.999Z
 * ```
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
