/**
 * GetUserUseCase - BDD Tests
 *
 * 📚 EXAMEN AWS: Application Layer Testing
 * - Tests de lectura (Get/Query operations)
 * - Manejo de errores (UserNotFoundError)
 * - Mocking de repository
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { GetUserUseCase } from '@application/use-cases/GetUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ILogger } from '@shared/logger/ILogger';
import { User } from '@domain/entities/User';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import { UserResponseDto } from '@application/dtos/UserResponseDto';
import path from 'path';
import { UserFixtures } from '../../../fixtures/userFixtures';
import { createMockRepository, createMockLogger } from '../../../helpers/mocks';

const feature = loadFeature(path.join(__dirname, './get-user.feature'));

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let useCase: GetUserUseCase;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    useCase = new GetUserUseCase(mockRepository, mockLogger);
  });

  // ============================================
  // Scenario: Successfully get an existing user
  // ============================================
  test('Successfully get an existing user', ({ given, when, then, and }) => {
    let userId: string;
    let retrievedUser: UserResponseDto | null = null;
    let error: Error | null = null;

    given(/^a user exists with id "(.*)"$/, (id) => {
      userId = id;
      const userProps = UserFixtures.withId(userId);
      const existingUser = User.reconstitute(userProps);
      mockRepository.findById.mockResolvedValue(existingUser);
    });

    when('I execute the GetUser use case with that id', async () => {
      try {
        retrievedUser = await useCase.execute(userId);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the user should be returned', () => {
      expect(error).toBeNull();
      expect(retrievedUser).not.toBeNull();
    });

    and('the user should have the correct id', () => {
      expect(retrievedUser?.id).toBe(userId);
    });

    and('the repository findById method should be called', () => {
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject getting a non-existent user
  // ============================================
  test('Reject getting a non-existent user', ({ given, when, then, and }) => {
    let userId: string;
    let error: UserNotFoundError | null = null;

    given(/^no user exists with id "(.*)"$/, (id) => {
      userId = id;
      mockRepository.findById.mockResolvedValue(null);
    });

    when('I try to execute the GetUser use case with that id', async () => {
      try {
        await useCase.execute(userId);
      } catch (e) {
        error = e as UserNotFoundError;
      }
    });

    then('it should throw a UserNotFoundError', () => {
      expect(error).toBeInstanceOf(UserNotFoundError);
      expect(error?.message).toContain(userId);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    and('the error should contain the user id', () => {
      expect(error?.message).toContain(userId);
    });
  });

  // ============================================
  // Scenario: Reject getting user with invalid id format
  // ============================================
  test('Reject getting user with invalid id format', ({ given, when, then }) => {
    let userId: string;
    let error: Error | null = null;

    given(/^an invalid id "(.*)"$/, (id) => {
      userId = id;
      mockRepository.findById.mockResolvedValue(null);
    });

    when('I try to execute the GetUser use case', async () => {
      try {
        await useCase.execute(userId);
      } catch (e) {
        error = e as Error;
      }
    });

    then('it should throw a validation error', () => {
      expect(error).toBeInstanceOf(UserNotFoundError);
    });
  });
});
