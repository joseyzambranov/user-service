/**
 * UpdateUserUseCase - BDD Tests
 *
 * 📚 EXAMEN AWS: Application Layer Testing
 * - Tests de actualización (Update operations)
 * - Validación de DTOs con Zod
 * - Manejo de email único al actualizar
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { UpdateUserUseCase } from '@application/use-cases/UpdateUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { ILogger } from '@shared/logger/ILogger';
import { User } from '@domain/entities/User';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { DuplicateUserError } from '@domain/errors/DuplicateUserError';
import { UserResponseDto } from '@application/dtos/UserResponseDto';
import { UpdateUserSchema } from '@application/dtos/UpdateUserDto';
import { SchemaValidator } from '@shared/validators/SchemaValidator';
import path from 'path';
import { UserFixtures, UPDATED_USER_DATA } from '../../../fixtures/userFixtures';
import { createMockRepository, createMockLogger } from '../../../helpers/mocks';

const feature = loadFeature(path.join(__dirname, './update-user.feature'));

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let domainService: UserDomainService;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    domainService = new UserDomainService(mockRepository);
    useCase = new UpdateUserUseCase(mockRepository, domainService, mockLogger);
  });

  // ============================================
  // Scenario: Successfully update a user with valid data
  // ============================================
  test('Successfully update a user with valid data', ({ given, when, then, and }) => {
    let userId: string;
    let updateData: any;
    let updatedUser: UserResponseDto | null = null;
    let error: Error | null = null;

    given(/^a user exists with id "(.*)"$/, (id) => {
      userId = id;
      const userProps = UserFixtures.withId(userId);
      const existingUser = User.reconstitute(userProps);
      mockRepository.findById.mockResolvedValue(existingUser);
    });

    when('I execute the UpdateUser use case with new data', async () => {
      updateData = {
        firstName: UPDATED_USER_DATA.firstName,
        lastName: UPDATED_USER_DATA.lastName,
      };

      try {
        const validatedDto = SchemaValidator.validate(UpdateUserSchema, updateData);
        mockRepository.update.mockImplementation(async (user) => user);
        updatedUser = await useCase.execute(userId, validatedDto);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the user should be updated', () => {
      expect(error).toBeNull();
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.firstName).toBe(UPDATED_USER_DATA.firstName);
      expect(updatedUser?.lastName).toBe(UPDATED_USER_DATA.lastName);
    });

    and('the repository update method should be called', () => {
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject updating a non-existent user
  // ============================================
  test('Reject updating a non-existent user', ({ given, when, then }) => {
    let userId: string;
    let error: UserNotFoundError | null = null;

    given(/^no user exists with id "(.*)"$/, (id) => {
      userId = id;
      mockRepository.findById.mockResolvedValue(null);
    });

    when('I try to execute the UpdateUser use case', async () => {
      try {
        const updateData = { firstName: 'NewName' };
        const validatedDto = SchemaValidator.validate(UpdateUserSchema, updateData);
        await useCase.execute(userId, validatedDto);
      } catch (e) {
        error = e as UserNotFoundError;
      }
    });

    then('it should throw a UserNotFoundError', () => {
      expect(error).toBeInstanceOf(UserNotFoundError);
      expect(error?.message).toContain(userId);
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject updating with duplicate email
  // ============================================
  test('Reject updating with duplicate email', ({ given, and, when, then }) => {
    let userId: string;
    let error: DuplicateUserError | null = null;

    given(/^a user exists with id "(.*)" and email "(.*)"$/, (id, email) => {
      userId = id;
      const userProps = UserFixtures.withEmail(email);
      const existingUser = User.reconstitute({ ...userProps, id });
      mockRepository.findById.mockResolvedValue(existingUser);
    });

    and(/^another user exists with email "(.*)"$/, (takenEmail) => {
      const otherUserProps = UserFixtures.withEmail(takenEmail);
      const otherUser = User.reconstitute({ ...otherUserProps, id: 'other-user-id' });
      mockRepository.findByEmail.mockResolvedValue(otherUser);
    });

    when(/^I try to update the user email to "(.*)"$/, async (newEmail) => {
      try {
        const updateData = { email: newEmail };
        const validatedDto = SchemaValidator.validate(UpdateUserSchema, updateData);
        await useCase.execute(userId, validatedDto);
      } catch (e) {
        error = e as DuplicateUserError;
      }
    });

    then('it should throw a DuplicateUserError', () => {
      expect(error).toBeInstanceOf(DuplicateUserError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Successfully update user email
  // ============================================
  test('Successfully update user email', ({ given, and, when, then }) => {
    let userId: string;
    let oldEmail: string;
    let newEmail: string;
    let updatedUser: UserResponseDto | null = null;

    given(/^a user exists with id "(.*)" and email "(.*)"$/, (id, email) => {
      userId = id;
      oldEmail = email;
      const userProps = UserFixtures.withEmail(oldEmail);
      const existingUser = User.reconstitute({ ...userProps, id });
      mockRepository.findById.mockResolvedValue(existingUser);
    });

    and(/^no other user has email "(.*)"$/, (email) => {
      newEmail = email;
      mockRepository.findByEmail.mockResolvedValue(null);
    });

    when(/^I update the user email to "(.*)"$/, async (email) => {
      const updateData = { email };
      const validatedDto = SchemaValidator.validate(UpdateUserSchema, updateData);

      // Configure update mock to return updated user
      mockRepository.update.mockImplementation(async (user) => user);

      updatedUser = await useCase.execute(userId, validatedDto);
    });

    then(/^the user email should be updated to "(.*)"$/, (expectedEmail) => {
      expect(updatedUser?.email).toBe(expectedEmail);
    });

    and('email uniqueness should be validated', () => {
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });
});
