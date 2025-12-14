/**
 * UserDomainService - Domain Service
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Desarrollo de aplicaciones
 * - Domain Services: Lógica de negocio que NO pertenece a una entidad específica
 * - Orquesta operaciones que involucran múltiples entidades o validaciones complejas
 *
 * ¿Cuándo usar Domain Service vs Entity?
 * - Entity: Lógica que pertenece a UN solo usuario (ej: user.activate())
 * - Domain Service: Lógica que involucra MÚLTIPLES usuarios o reglas complejas
 */

import { User } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';
import { DuplicateUserError } from '../errors/DuplicateUserError';
import { InvalidUserDataError } from '../errors/InvalidUserDataError';

export class UserDomainService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Validar que el email sea único antes de crear usuario
   * 📚 EXAMEN: Business rule validation
   * - Regla de negocio: No puede haber dos usuarios con el mismo email
   * - Se valida ANTES de intentar guardar (fail fast)
   */
  async ensureEmailIsUnique(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new DuplicateUserError(email);
    }
  }

  /**
   * Validar datos del usuario según reglas de negocio
   * 📚 EXAMEN: Domain validation vs Input validation
   * - Input validation: Formato (se hace en DTOs con Zod)
   * - Domain validation: Reglas de negocio (se hace aquí)
   */
  validateUserData(user: User): void {
    // Validar que el nombre completo no sea demasiado largo
    if (user.fullName.length > 100) {
      throw new InvalidUserDataError(
        'Full name is too long (max 100 characters)',
        'fullName'
      );
    }

    // Aquí podrían ir otras validaciones de negocio complejas
    // Ejemplo: validar contra lista negra de dominios de email
    this.validateEmailDomain(user.email);
  }

  /**
   * Validar dominio de email (ejemplo de regla de negocio)
   * 📚 EXAMEN: Business rules encapsulation
   */
  private validateEmailDomain(email: string): void {
    const blacklistedDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();

    if (domain && blacklistedDomains.includes(domain)) {
      throw new InvalidUserDataError(
        `Email domain '${domain}' is not allowed`,
        'email'
      );
    }
  }

  /**
   * Verificar si un usuario puede ser eliminado
   * 📚 EXAMEN: Complex business rules
   * - Ejemplo: No se puede eliminar si tiene órdenes pendientes
   * - En este microservicio simple, siempre retorna true
   * - En un sistema real, consultaría otros servicios/agregados
   */
  async canBeDeleted(_userId: string): Promise<boolean> {
    // En un sistema real, validaríamos:
    // - ¿Tiene órdenes pendientes?
    // - ¿Tiene pagos en proceso?
    // - ¿Es un admin?
    // etc.

    // Por ahora, siempre permitimos (userId se usará cuando implementemos las validaciones)
    return true;
  }

  /**
   * Transferir datos de un usuario a otro (ejemplo de operación compleja)
   * 📚 EXAMEN: Multi-entity operations
   * - Operaciones que involucran múltiples entidades
   * - NO pertenece a una sola entidad
   */
  async transferUserData(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    // Validar que ambos usuarios existan
    const fromUser = await this.userRepository.findById(fromUserId);
    const toUser = await this.userRepository.findById(toUserId);

    if (!fromUser || !toUser) {
      throw new InvalidUserDataError('One or both users not found');
    }

    // Validar reglas de negocio
    if (!fromUser.isActive) {
      throw new InvalidUserDataError('Source user must be active');
    }

    if (!toUser.isActive) {
      throw new InvalidUserDataError('Target user must be active');
    }

    // En un sistema real, aquí transferiríamos:
    // - Órdenes
    // - Pagos
    // - Preferencias
    // etc.

    // Este es solo un ejemplo para demostrar Domain Services
  }
}
