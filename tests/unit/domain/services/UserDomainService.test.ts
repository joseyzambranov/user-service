/**
 * UserDomainService - BDD Tests with Cucumber
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Testing
 * - Tests de reglas de negocio complejas
 * - Validaciones de dominio
 * - Mocking de repositorios (Dependency Injection)
 * - Test fixtures para DRY (Don't Repeat Yourself)
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { UserDomainService } from '@domain/services/UserDomainService';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User } from '@domain/entities/User';
import { DuplicateUserError } from '@domain/errors/DuplicateUserError';
import { InvalidUserDataError } from '@domain/errors/InvalidUserDataError';
import path from 'path';
import {
  TEST_USER_DATA,
  DOMAIN_SERVICE_TEST_DATA,
  UserFixtures
} from '../../../fixtures/userFixtures';

const feature = loadFeature(path.join(__dirname, './user-domain-service.feature'));

// Mock del repositorio
const createMockRepository = (): jest.Mocked<IUserRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  existsByEmail: jest.fn(),
});

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let domainService: UserDomainService;

  beforeEach(() => {
    mockRepository = createMockRepository();
    domainService = new UserDomainService(mockRepository);
  });

  // ============================================
  // Scenario: Ensure email is unique when no existing user
  // ============================================
  test('Ensure email is unique when no existing user', ({ given, when, then }) => {
    let error: Error | null = null;
    let testEmail: string;

    given(/^no user exists with email "(.*)"$/, (email) => {
      testEmail = email;
      mockRepository.findByEmail.mockResolvedValue(null);
    });

    when('I check if the email is unique', async () => {
      try {
        await domainService.ensureEmailIsUnique(testEmail);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the validation should pass without errors', () => {
      expect(error).toBeNull();
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(testEmail);
    });
  });

  // ============================================
  // Scenario: Prevent duplicate email registration
  // ============================================
  test('Prevent duplicate email registration', ({ given, when, then }) => {
    let error: DuplicateUserError | null = null;
    const email = DOMAIN_SERVICE_TEST_DATA.existingUser.email;

    given(/^a user already exists with email "(.*)"$/, () => {
      const existingUser = User.reconstitute(UserFixtures.withId(DOMAIN_SERVICE_TEST_DATA.existingUser.id));
      mockRepository.findByEmail.mockResolvedValue(existingUser);
    });

    when('I check if the email is unique', async () => {
      try {
        await domainService.ensureEmailIsUnique(email);
      } catch (e) {
        error = e as DuplicateUserError;
      }
    });

    then('it should throw a DuplicateUserError with the email', () => {
      expect(error).toBeInstanceOf(DuplicateUserError);
      expect(error?.message).toContain(email);
      expect(error?.code).toBe('DUPLICATE_USER');
    });
  });

  // ============================================
  // Scenario: Validate user data with valid full name
  // ============================================
  test('Validate user data with valid full name', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('a user with fullName length of 50 characters', () => {
      user = User.create({
        ...TEST_USER_DATA,
        firstName: 'A'.repeat(25),
        lastName: 'B'.repeat(24), // 25 + 1 (space) + 24 = 50
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the validation should pass without errors', () => {
      expect(error).toBeNull();
    });
  });

  // ============================================
  // Scenario: Reject user with full name too long
  // ============================================
  test('Reject user with full name too long', ({ given, when, then }) => {
    let user: User;
    let error: InvalidUserDataError | null = null;

    given('a user with fullName length of 101 characters', () => {
      user = User.create({
        email: TEST_USER_DATA.email,
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(50), // 50 + 1 (space) + 50 = 101
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError for field "(.*)"$/, (field) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.field).toBe(field);
      expect(error?.message).toContain('Full name is too long');
    });
  });

  // ============================================
  // Scenario: Accept user with allowed email domain
  // ============================================
  test('Accept user with allowed email domain', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given(/^a user with email "(.*)"$/, (email) => {
      user = User.create({
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the validation should pass without errors', () => {
      expect(error).toBeNull();
    });
  });

  // ============================================
  // Scenario: Reject user with blacklisted email domain - tempmail
  // ============================================
  test('Reject user with blacklisted email domain - tempmail', ({ given, when, then }) => {
    let user: User;
    let error: InvalidUserDataError | null = null;

    given(/^a user with email "(.*)"$/, (email) => {
      user = User.create({
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message containing "(.*)"$/, (domain) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toContain(domain);
      expect(error?.message).toContain('not allowed');
    });
  });

  // ============================================
  // Scenario: Reject user with blacklisted email domain - throwaway
  // ============================================
  test('Reject user with blacklisted email domain - throwaway', ({ given, when, then }) => {
    let user: User;
    let error: InvalidUserDataError | null = null;

    given(/^a user with email "(.*)"$/, (email) => {
      user = User.create({
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message containing "(.*)"$/, (domain) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toContain(domain);
    });
  });

  // ============================================
  // Scenario: Reject user with blacklisted email domain - guerrillamail
  // ============================================
  test('Reject user with blacklisted email domain - guerrillamail', ({ given, when, then }) => {
    let user: User;
    let error: InvalidUserDataError | null = null;

    given(/^a user with email "(.*)"$/, (email) => {
      user = User.create({
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      });
    });

    when('I validate the user data', () => {
      try {
        domainService.validateUserData(user);
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message containing "(.*)"$/, (domain) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toContain(domain);
    });
  });

  // ============================================
  // Scenario: Check if user can be deleted
  // ============================================
  test('Check if user can be deleted', ({ given, when, then }) => {
    let canDelete: boolean;

    given(/^a user with id "(.*)"$/, () => {
      // No setup needed, service always returns true for now
    });

    when('I check if the user can be deleted', async () => {
      canDelete = await domainService.canBeDeleted('user-123');
    });

    then('it should return true', () => {
      expect(canDelete).toBe(true);
    });
  });

  // ============================================
  // Scenario: Transfer data between active users
  // ============================================
  test('Transfer data between active users', ({ given, and, when, then }) => {
    let error: Error | null = null;
    let sourceUser: User;
    let targetUser: User;

    given(/^an active user with id "(.*)"$/, (id) => {
      sourceUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.sourceUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.sourceUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.sourceUser.lastName,
      });
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === id) return sourceUser;
        return null;
      });
    });

    and(/^an active user with id "(.*)"$/, (id) => {
      targetUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.targetUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.targetUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.targetUser.lastName,
      });
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === 'user-source') return sourceUser;
        if (userId === id) return targetUser;
        return null;
      });
    });

    when('I transfer data from source to target', async () => {
      try {
        await domainService.transferUserData('user-source', 'user-target');
      } catch (e) {
        error = e as Error;
      }
    });

    then('the operation should complete successfully', () => {
      expect(error).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('user-source');
      expect(mockRepository.findById).toHaveBeenCalledWith('user-target');
    });
  });

  // ============================================
  // Scenario: Cannot transfer data from inactive source user
  // ============================================
  test('Cannot transfer data from inactive source user', ({ given, and, when, then }) => {
    let error: InvalidUserDataError | null = null;
    let sourceUser: User;
    let targetUser: User;

    given(/^an inactive user with id "(.*)"$/, (id) => {
      sourceUser = User.reconstitute({
        ...UserFixtures.inactiveUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.sourceUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.sourceUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.sourceUser.lastName,
      });
    });

    and(/^an active user with id "(.*)"$/, (id) => {
      targetUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.targetUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.targetUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.targetUser.lastName,
      });
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === 'user-source') return sourceUser;
        if (userId === id) return targetUser;
        return null;
      });
    });

    when('I try to transfer data from source to target', async () => {
      try {
        await domainService.transferUserData('user-source', 'user-target');
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message "(.*)"$/, (expectedMessage) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Cannot transfer data to inactive target user
  // ============================================
  test('Cannot transfer data to inactive target user', ({ given, and, when, then }) => {
    let error: InvalidUserDataError | null = null;
    let sourceUser: User;
    let targetUser: User;

    given(/^an active user with id "(.*)"$/, (id) => {
      sourceUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.sourceUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.sourceUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.sourceUser.lastName,
      });
    });

    and(/^an inactive user with id "(.*)"$/, (id) => {
      targetUser = User.reconstitute({
        ...UserFixtures.inactiveUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.targetUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.targetUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.targetUser.lastName,
      });
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === 'user-source') return sourceUser;
        if (userId === id) return targetUser;
        return null;
      });
    });

    when('I try to transfer data from source to target', async () => {
      try {
        await domainService.transferUserData('user-source', 'user-target');
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message "(.*)"$/, (expectedMessage) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Cannot transfer data when source user not found
  // ============================================
  test('Cannot transfer data when source user not found', ({ given, and, when, then }) => {
    let error: InvalidUserDataError | null = null;
    let targetUser: User;

    given(/^no user exists with id "(.*)"$/, () => {
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === 'non-existent-source') return null;
        if (userId === 'user-target') return targetUser;
        return null;
      });
    });

    and(/^an active user with id "(.*)"$/, (id) => {
      targetUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.targetUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.targetUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.targetUser.lastName,
      });
    });

    when('I try to transfer data from non-existent source to target', async () => {
      try {
        await domainService.transferUserData('non-existent-source', 'user-target');
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message "(.*)"$/, (expectedMessage) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Cannot transfer data when target user not found
  // ============================================
  test('Cannot transfer data when target user not found', ({ given, and, when, then }) => {
    let error: InvalidUserDataError | null = null;
    let sourceUser: User;

    given(/^an active user with id "(.*)"$/, (id) => {
      sourceUser = User.reconstitute({
        ...UserFixtures.activeUser(),
        id,
        email: DOMAIN_SERVICE_TEST_DATA.sourceUser.email,
        firstName: DOMAIN_SERVICE_TEST_DATA.sourceUser.firstName,
        lastName: DOMAIN_SERVICE_TEST_DATA.sourceUser.lastName,
      });
    });

    and(/^no user exists with id "(.*)"$/, () => {
      mockRepository.findById.mockImplementation(async (userId: string) => {
        if (userId === 'user-source') return sourceUser;
        if (userId === 'non-existent-target') return null;
        return null;
      });
    });

    when('I try to transfer data from source to non-existent target', async () => {
      try {
        await domainService.transferUserData('user-source', 'non-existent-target');
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then(/^it should throw InvalidUserDataError with message "(.*)"$/, (expectedMessage) => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toBe(expectedMessage);
    });
  });
});
