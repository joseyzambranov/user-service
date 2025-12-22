/**
 * DeleteUserUseCase - BDD Tests
 *
 * 📚 EXAMEN AWS: Application Layer Testing
 * - Tests de eliminación (Delete operations)
 * - Manejo de errores (UserNotFoundError)
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { DeleteUserUseCase } from '@application/use-cases/DeleteUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { ILogger } from '@shared/logger/ILogger';
import { User } from '@domain/entities/User';
import { UserNotFoundError } from '@domain/errors/UserNotFoundError';
import path from 'path';
import { UserFixtures } from '../../../fixtures/userFixtures';
import { createMockRepository, createMockLogger } from '../../../helpers/mocks';

const feature = loadFeature(path.join(__dirname, './delete-user.feature'));

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let domainService: UserDomainService;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    domainService = new UserDomainService(mockRepository);
    useCase = new DeleteUserUseCase(mockRepository, domainService, mockLogger);
  });

  // ============================================
  // Scenario: Successfully delete an existing user
  // ============================================
  test('Successfully delete an existing user', ({ given, when, then, and }) => {
    let userId: string;
    let error: Error | null = null;

    given(/^a user exists with id "(.*)"$/, (id) => {
      userId = id;
      const userProps = UserFixtures.withId(userId);
      const existingUser = User.reconstitute(userProps);
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.delete.mockResolvedValue(undefined);
    });

    when('I execute the DeleteUser use case', async () => {
      try {
        await useCase.execute(userId);
      } catch (e) {
        error = e as Error;
      }
    });

    then('the user should be deleted', () => {
      expect(error).toBeNull();
    });

    and('the repository delete method should be called', () => {
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Reject deleting a non-existent user
  // ============================================
  test('Reject deleting a non-existent user', ({ given, when, then, and }) => {
    let userId: string;
    let error: UserNotFoundError | null = null;

    given(/^no user exists with id "(.*)"$/, (id) => {
      userId = id;
      mockRepository.findById.mockResolvedValue(null);
    });

    when('I try to execute the DeleteUser use case', async () => {
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

    and('the repository delete method should not be called', () => {
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
