/**
 * ListUsersUseCase - BDD Tests
 *
 * 📚 EXAMEN AWS: Application Layer Testing
 * - Tests de listado con paginación
 * - Manejo de DynamoDB pagination patterns
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ILogger } from '@shared/logger/ILogger';
import { User } from '@domain/entities/User';
import { PaginatedResult } from '@shared/types/common';
import { UserResponseDto } from '@application/dtos/UserResponseDto';
import path from 'path';
import { UserFixtures } from '../../../fixtures/userFixtures';
import { createMockRepository, createMockLogger } from '../../../helpers/mocks';

const feature = loadFeature(path.join(__dirname, './list-users.feature'));

defineFeature(feature, (test) => {
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    useCase = new ListUsersUseCase(mockRepository, mockLogger);
  });

  // ============================================
  // Scenario: Successfully list users with default pagination
  // ============================================
  test('Successfully list users with default pagination', ({ given, when, then, and }) => {
    let result: PaginatedResult<UserResponseDto> | null = null;

    given('the repository has multiple users', () => {
      const users = [
        User.reconstitute(UserFixtures.withId('user-1')),
        User.reconstitute(UserFixtures.withId('user-2')),
        User.reconstitute(UserFixtures.withId('user-3')),
      ];

      mockRepository.list.mockResolvedValue({
        users,
        count: users.length,
        lastEvaluatedKey: undefined,
      });
    });

    when('I execute the ListUsers use case without options', async () => {
      result = await useCase.execute();
    });

    then('users should be returned', () => {
      expect(result).not.toBeNull();
      expect(result?.items).toHaveLength(3);
      expect(result?.total).toBe(3);
    });

    and('the default limit should be applied', () => {
      expect(mockRepository.list).toHaveBeenCalledWith({
        limit: 20, // Default limit
        lastEvaluatedKey: undefined,
      });
    });

    and('the repository list method should be called', () => {
      expect(mockRepository.list).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario: Successfully list users with custom limit
  // ============================================
  test('Successfully list users with custom limit', ({ given, when, then, and }) => {
    let result: PaginatedResult<UserResponseDto> | null = null;

    given('the repository has multiple users', () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        User.reconstitute(UserFixtures.withId(`user-${i + 1}`))
      );

      mockRepository.list.mockResolvedValue({
        users,
        count: users.length,
        lastEvaluatedKey: 'next-token',
      });
    });

    when('I execute the ListUsers use case with limit 10', async () => {
      result = await useCase.execute({ limit: 10 });
    });

    then('up to 10 users should be returned', () => {
      expect(result?.items).toHaveLength(10);
      expect(result?.nextToken).toBe('next-token');
    });

    and('the repository should be called with limit 10', () => {
      expect(mockRepository.list).toHaveBeenCalledWith({
        limit: 10,
        lastEvaluatedKey: undefined,
      });
    });
  });

  // ============================================
  // Scenario: Successfully list users with pagination token
  // ============================================
  test('Successfully list users with pagination token', ({ given, and, when, then }) => {
    let nextToken: string;
    let result: PaginatedResult<UserResponseDto> | null = null;

    given('the repository has multiple users', () => {
      const users = [
        User.reconstitute(UserFixtures.withId('user-11')),
        User.reconstitute(UserFixtures.withId('user-12')),
      ];

      mockRepository.list.mockResolvedValue({
        users,
        count: users.length,
        lastEvaluatedKey: undefined, // No more pages
      });
    });

    and('there is a next page token', () => {
      nextToken = 'page-2-token';
    });

    when('I execute the ListUsers use case with the next token', async () => {
      result = await useCase.execute({ limit: 20, nextToken });
    });

    then('the next page of users should be returned', () => {
      expect(result?.items).toHaveLength(2);
      expect(result?.nextToken).toBeUndefined(); // No more pages
    });

    and('the repository should be called with the token', () => {
      expect(mockRepository.list).toHaveBeenCalledWith({
        limit: 20,
        lastEvaluatedKey: nextToken,
      });
    });
  });
});
