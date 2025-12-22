/**
 * Test Fixtures - User Domain
 *
 * 📚 EXAMEN AWS: Testing Best Practices
 * - DRY (Don't Repeat Yourself) en tests
 * - Test Data Builders pattern
 * - Fixtures reutilizables
 *
 * Ventajas:
 * - Un solo lugar para cambiar datos de test
 * - Tests más legibles y mantenibles
 * - Fácil crear variaciones de datos
 */

import { UserProps } from '@domain/entities/User';

/**
 * Datos base para tests de usuarios
 */
export const TEST_USER_DATA = {
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
} as const;

/**
 * Datos actualizados para tests de actualización
 * Coinciden con los datos del archivo user.feature
 */
export const UPDATED_USER_DATA = {
  email: 'new@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
} as const;

/**
 * Nombres válidos con caracteres especiales
 */
export const VALID_SPECIAL_NAMES = {
  withAccentsAndHyphen: 'José-María',
} as const;

/**
 * Datos para tests de UserDomainService
 */
export const DOMAIN_SERVICE_TEST_DATA = {
  sourceUser: {
    id: 'user-source',
    email: 'source@example.com',
    firstName: 'Source',
    lastName: 'User',
  },
  targetUser: {
    id: 'user-target',
    email: 'target@example.com',
    firstName: 'Target',
    lastName: 'User',
  },
  existingUser: {
    id: 'user-123',
    email: 'existing@example.com',
  },
} as const;

/**
 * Datos inválidos para tests de validación
 */
export const INVALID_USER_DATA = {
  invalidEmail: 'not-an-email',
  emptyEmail: '',
  longEmail: 'a'.repeat(250) + '@example.com',
  emptyFirstName: '',
  shortFirstName: 'J',
  longFirstName: 'a'.repeat(51),
  invalidFirstName: 'John123',
} as const;

/**
 * Builder para crear UserProps completo con valores por defecto
 *
 * 📚 PATRÓN: Builder Pattern para tests
 */
export class UserPropsBuilder {
  private props: UserProps;

  constructor() {
    this.props = {
      id: 'test-user-123',
      email: TEST_USER_DATA.email,
      firstName: TEST_USER_DATA.firstName,
      lastName: TEST_USER_DATA.lastName,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };
  }

  withId(id: string): this {
    this.props.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.props.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.props.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.props.lastName = lastName;
    return this;
  }

  withIsActive(isActive: boolean): this {
    this.props.isActive = isActive;
    return this;
  }

  withDates(createdAt: Date, updatedAt: Date): this {
    this.props.createdAt = createdAt;
    this.props.updatedAt = updatedAt;
    return this;
  }

  build(): UserProps {
    return { ...this.props };
  }
}

/**
 * Factory functions para casos comunes
 *
 * 📚 PATRÓN: Factory Pattern
 */
export const UserFixtures = {
  /**
   * Usuario activo básico
   */
  activeUser: (): UserProps => new UserPropsBuilder().build(),

  /**
   * Usuario inactivo
   */
  inactiveUser: (): UserProps =>
    new UserPropsBuilder()
      .withIsActive(false)
      .build(),

  /**
   * Usuario con ID específico
   */
  withId: (id: string): UserProps =>
    new UserPropsBuilder()
      .withId(id)
      .build(),

  /**
   * Usuario con email específico
   */
  withEmail: (email: string): UserProps =>
    new UserPropsBuilder()
      .withEmail(email)
      .build(),

  /**
   * Usuario con datos actualizados
   */
  updatedUser: (): UserProps =>
    new UserPropsBuilder()
      .withEmail(UPDATED_USER_DATA.email)
      .withFirstName(UPDATED_USER_DATA.firstName)
      .withLastName(UPDATED_USER_DATA.lastName)
      .build(),

  /**
   * Usuario personalizado
   */
  custom: (overrides: Partial<UserProps>): UserProps =>
    new UserPropsBuilder().build() as UserProps & typeof overrides,
};
