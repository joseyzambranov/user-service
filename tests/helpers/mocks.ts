/**
 * Test Mocks - Reutilizables
 *
 * 📚 EXAMEN AWS: Testing Best Practices
 * - DRY (Don't Repeat Yourself) en mocks
 * - Centralización de configuración de test
 * - Fácil mantenimiento
 */

import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ILogger } from '@shared/logger/ILogger';

/**
 * Crea un mock del UserRepository con todos los métodos
 *
 * 📚 PATRÓN: Factory Pattern para mocks
 */
export const createMockRepository = (): jest.Mocked<IUserRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  existsByEmail: jest.fn(),
});

/**
 * Crea un mock del Logger con todos los niveles
 *
 * 📚 PATRÓN: Factory Pattern para mocks
 */
export const createMockLogger = (): jest.Mocked<ILogger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});
