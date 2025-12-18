/**
 * Create User Use Case
 *
 * 📚 EXAMEN AWS: Business Logic Layer
 * - Orquesta la creación de un usuario
 * - Valida reglas de negocio (email único)
 * - Coordina dominio y persistencia
 *
 * 🎯 PATRÓN: Use Case Pattern
 * - Una clase = un caso de uso
 * - Método execute() para ejecutar
 * - Dependencias inyectadas vía constructor
 */

import { User } from '@domain/entities/User';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserDomainService } from '@domain/services/UserDomainService';
import { ILogger } from '@shared/logger/ILogger';
import { generateId } from '@shared/utils/idGenerator';
import { CreateUserDto } from '../dtos/CreateUserDto';
import { UserResponseDto, UserMapper } from '../dtos/UserResponseDto';

/**
 * Caso de uso: Crear un nuevo usuario
 *
 * Flujo:
 * 1. Validar que el email sea único
 * 2. Generar ID para el nuevo usuario
 * 3. Crear entidad User con validaciones de dominio
 * 4. Persistir en el repositorio
 * 5. Retornar DTO de respuesta
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly logger: ILogger,
  ) {}

  /**
   * Ejecuta el caso de uso de crear usuario
   *
   * @param dto - Datos para crear el usuario
   * @returns Usuario creado como DTO
   * @throws DuplicateUserError si el email ya existe
   * @throws InvalidUserDataError si los datos son inválidos
   *
   * @example
   * ```typescript
   * const useCase = new CreateUserUseCase(repository, domainService, logger);
   * const userDto = await useCase.execute({
   *   email: 'john@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   * ```
   */
  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.info('Creating new user', {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // 1. Validar que el email sea único (regla de negocio)
    await this.userDomainService.ensureEmailIsUnique(dto.email);

    // 2. Generar ID único para el usuario
    const userId = generateId();

    // 3. Crear entidad User (aplica validaciones de dominio)
    const user = User.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Asignar ID generado
    const userWithId = User.reconstitute({
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // 4. Persistir en el repositorio
    const savedUser = await this.userRepository.save(userWithId);

    this.logger.info('User created successfully', {
      userId: savedUser.id,
      email: savedUser.email,
    });

    // 5. Convertir a DTO de respuesta
    return UserMapper.toResponseDto(savedUser);
  }
}
