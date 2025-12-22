/**
 * CreateUserUseCase - BDD Tests
 *
 * 📚 EXAMEN AWS: Application Layer Testing
 * - Tests de casos de uso (orquestación)
 * - Mocking de dependencias (Repository, DomainService)
 * - Validación de DTOs con Zod
 * - Manejo de errores de dominio
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { ILogger } from '@shared/logger/ILogger';
import { User } from '@domain/entities/User';
import { DuplicateUserError } from '@domain/errors/DuplicateUserError';
import { InvalidUserDataError } from '@domain/errors/InvalidUserDataError';
import { UserResponseDto } from '@application/dtos/UserResponseDto';
import { CreateUserSchema } from '@application/dtos/CreateUserDto';
import { SchemaValidator, ValidationError } from '@shared/validators/SchemaValidator';
import path from 'path';
import { UserFixtures, TEST_USER_DATA } from '../../../fixtures/userFixtures';
import { createMockRepository, createMockLogger } from '../../../helpers/mocks';

const feature = loadFeature(path.join(__dirname, './create-user.feature'));

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let domainService: UserDomainService;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    domainService = new UserDomainService(mockRepository);
    useCase = new CreateUserUseCase(mockRepository, domainService, mockLogger);
  });

  // ============================================
  // Scenario: Successfully create a user with valid data
  // ============================================
  test('Successfully create a user with valid data', ({ given, and, when, then }) => {
    let userData: any;
    let createdUser: UserResponseDto | null = null;
    let error: Error | null = null;

    given(/^valid user data with email "(.*)", firstName "(.*)", and lastName "(.*)"$/, (email, firstName, lastName) => {
      userData = {
        email,
        firstName,
        lastName,
      };
    });

    and('no user exists with that email', () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.save.mockImplementation(async (user: User) => user);
    });

    when('I execute the CreateUser use case', async () => {
      try {
        const validatedDto = SchemaValidator.validate(CreateUserSchema, userData);
        createdUser = await useCase.execute(validatedDto);
      } catch (e) {
        error = e as Error;
      }
    });

    then('a new user should be created', () => {
      expect(error).toBeNull();
      expect(createdUser).not.toBeNull();
    });

    and('the user should have the correct email', () => {
      expect(createdUser?.email).toBe(userData.email);
    });

    and('the user should have the correct name', () => {
      expect(createdUser?.firstName).toBe(userData.firstName);
      expect(createdUser?.lastName).toBe(userData.lastName);
    });

    and('the repository save method should be called', () => {
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject creation of user with duplicate email
  // ============================================
  test('Reject creation of user with duplicate email', ({ given, and, when, then }) => {
    let userData: any;
    let error: DuplicateUserError | null = null;

    given(/^valid user data with email "(.*)"$/, (email) => {
      userData = {
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      };
    });

    and('a user already exists with that email', () => {
      const userProps = UserFixtures.withEmail(userData.email);
      const existingUser = User.reconstitute(userProps);
      mockRepository.findByEmail.mockResolvedValue(existingUser);
    });

    when('I try to execute the CreateUser use case', async () => {
      try {
        const validatedDto = SchemaValidator.validate(CreateUserSchema, userData);
        await useCase.execute(validatedDto);
      } catch (e) {
        error = e as DuplicateUserError;
      }
    });

    then('it should throw a DuplicateUserError', () => {
      expect(error).toBeInstanceOf(DuplicateUserError);
      expect(error?.code).toBe('DUPLICATE_USER');
    });

    and('the repository save method should not be called', () => {
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject creation with invalid email format
  // ============================================
  test('Reject creation with invalid email format', ({ given, when, then }) => {
    let userData: any;
    let error: Error | null = null;

    given(/^user data with invalid email "(.*)"$/, (invalidEmail) => {
      userData = {
        email: invalidEmail,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      };
    });

    when('I try to execute the CreateUser use case', async () => {
      try {
        const validatedDto = SchemaValidator.validate(CreateUserSchema, userData);
        await useCase.execute(validatedDto);
      } catch (e) {
        error = e as Error;
      }
    });

    then('it should throw a validation error for email', () => {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.errors.length).toBeGreaterThan(0);
      expect(validationError.errors[0]?.field).toBe('email');
    });
  });

  // ============================================
  // Scenario: Reject creation with empty first name
  // ============================================
  test('Reject creation with empty first name', ({ given, when, then }) => {
    let userData: any;
    let error: Error | null = null;

    given('user data with empty firstName', () => {
      userData = {
        email: TEST_USER_DATA.email,
        firstName: '',
        lastName: TEST_USER_DATA.lastName,
      };
    });

    when('I try to execute the CreateUser use case', async () => {
      try {
        const validatedDto = SchemaValidator.validate(CreateUserSchema, userData);
        await useCase.execute(validatedDto);
      } catch (e) {
        error = e as Error;
      }
    });

    then('it should throw a validation error for firstName', () => {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.errors.length).toBeGreaterThan(0);
      expect(validationError.errors[0]?.field).toBe('firstName');
    });
  });

  // ============================================
  // Scenario: Reject creation with blacklisted email domain
  // ============================================
  test('Reject creation with blacklisted email domain', ({ given, when, then }) => {
    let userData: any;
    let error: InvalidUserDataError | null = null;

    given(/^user data with email from blacklisted domain "(.*)"$/, (email) => {
      userData = {
        email,
        firstName: TEST_USER_DATA.firstName,
        lastName: TEST_USER_DATA.lastName,
      };
    });

    when('I try to execute the CreateUser use case', async () => {
      try {
        // Mock para que pase la validación de email único
        mockRepository.findByEmail.mockResolvedValue(null);
        const validatedDto = SchemaValidator.validate(CreateUserSchema, userData);
        await useCase.execute(validatedDto);
      } catch (e) {
        error = e as InvalidUserDataError;
      }
    });

    then('it should throw InvalidUserDataError for blacklisted domain', () => {
      expect(error).toBeInstanceOf(InvalidUserDataError);
      expect(error?.message).toContain('not allowed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
