/**
 * Schema Validator - Wrapper de Zod
 *
 * 📚 EXAMEN AWS: Input Validation
 * - Validación de entrada antes de procesar
 * - Previene inyecciones y datos malformados
 * - Retorna errores descriptivos
 *
 * 🎯 PATRÓN: Facade Pattern
 * - Simplifica el uso de Zod
 * - Centraliza la lógica de validación
 */

import { z, ZodError, ZodSchema } from 'zod';

/**
 * Error de validación personalizado
 */
export class ValidationError extends Error {
  public readonly errors: Array<{
    field: string;
    message: string;
  }>;

  constructor(zodError: ZodError) {
    const formattedErrors = zodError.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    super(`Validation failed: ${formattedErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
    this.name = 'ValidationError';
    this.errors = formattedErrors;

    // Mantiene el stack trace correcto
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Validador de esquemas usando Zod
 *
 * Proporciona una API simple para validar datos contra schemas Zod
 */
export class SchemaValidator {
  /**
   * Valida datos contra un schema Zod
   *
   * @param schema - Schema Zod para validar
   * @param data - Datos a validar
   * @returns Datos validados y tipados
   * @throws ValidationError si la validación falla
   *
   * @example
   * ```typescript
   * const UserSchema = z.object({
   *   email: z.string().email(),
   *   firstName: z.string().min(2),
   * });
   *
   * const validatedData = SchemaValidator.validate(UserSchema, rawData);
   * // validatedData está tipado correctamente
   * ```
   */
  static validate<T>(schema: ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error);
      }
      throw error;
    }
  }

  /**
   * Valida datos y retorna un resultado en lugar de lanzar error
   *
   * @param schema - Schema Zod para validar
   * @param data - Datos a validar
   * @returns Objeto con success y data o errors
   *
   * @example
   * ```typescript
   * const result = SchemaValidator.safeParse(UserSchema, rawData);
   * if (result.success) {
   *   console.log(result.data);
   * } else {
   *   console.log(result.errors);
   * }
   * ```
   */
  static safeParse<T>(
    schema: ZodSchema<T>,
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; errors: Array<{ field: string; message: string }> } {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      errors: result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  }

  /**
   * Valida datos parcialmente (útil para updates)
   *
   * @param schema - Schema Zod Object para validar
   * @param data - Datos parciales a validar
   * @returns Datos validados y tipados como Partial<T>
   * @throws ValidationError si la validación falla
   *
   * @example
   * ```typescript
   * const UserSchema = z.object({
   *   email: z.string().email(),
   *   firstName: z.string(),
   *   lastName: z.string(),
   * });
   *
   * // Solo valida los campos presentes
   * const validatedData = SchemaValidator.validatePartial(UserSchema, {
   *   email: 'new@example.com'
   * });
   * ```
   */
  static validatePartial<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    data: unknown,
  ): Partial<z.infer<z.ZodObject<T>>> {
    try {
      return schema.partial().parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error);
      }
      throw error;
    }
  }
}
