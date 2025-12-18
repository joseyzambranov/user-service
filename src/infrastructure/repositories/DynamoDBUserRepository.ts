/**
 * DynamoDB User Repository Implementation
 *
 * 📚 EXAMEN AWS: DynamoDB Operations
 * - Single-table design pattern
 * - Global Secondary Index (GSI) for email lookups
 * - Conditional writes for uniqueness
 * - Pagination with LastEvaluatedKey
 *
 * 🎯 PATRÓN: Repository Pattern Implementation
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { User } from '@domain/entities/User';
import { IUserRepository, ListUsersOptions, ListUsersResult } from '@domain/repositories/IUserRepository';
import { DuplicateUserError } from '@domain/errors/DuplicateUserError';
import { ILogger } from '@shared/logger/ILogger';

/**
 * DynamoDB Item structure
 *
 * 📚 EXAMEN AWS: Single-table design
 * - PK: Partition Key (USER#<id>)
 * - SK: Sort Key (PROFILE)
 * - GSI1PK: Global Secondary Index PK (EMAIL#<email>)
 * - GSI1SK: Global Secondary Index SK (PROFILE)
 */
interface UserDynamoDBItem {
  PK: string;              // USER#<id>
  SK: string;              // PROFILE
  GSI1PK: string;          // EMAIL#<email>
  GSI1SK: string;          // PROFILE
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  entityType: string;      // USER
}

/**
 * Repository implementation for DynamoDB
 *
 * 📚 EXAMEN AWS: Este patrón es común en el examen
 */
export class DynamoDBUserRepository implements IUserRepository {
  private readonly client: DynamoDBClient;
  private readonly tableName: string;
  private readonly gsiName: string = 'GSI1';

  constructor(
    tableName: string,
    private readonly logger: ILogger,
    region?: string,
  ) {
    this.tableName = tableName;

    // 📚 EXAMEN AWS: Region configuration
    // - Lee de parámetro, variable de entorno, o default
    // - Lambda setea AWS_REGION automáticamente
    const awsRegion = region || process.env.AWS_REGION || 'us-east-1';

    this.client = new DynamoDBClient({ region: awsRegion });

    this.logger.info('DynamoDBUserRepository initialized', {
      tableName: this.tableName,
      region: awsRegion,
    });
  }

  /**
   * Guardar un nuevo usuario
   *
   * 📚 EXAMEN AWS: PutItem con conditional write
   * - Usa attribute_not_exists para evitar sobrescribir
   * - Lanza error si el email ya existe
   */
  async save(user: User): Promise<User> {
    const item = this.toItem(user);

    try {
      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(item, { removeUndefinedValues: true }),
          // 📚 EXAMEN: Conditional write - solo escribe si NO existe
          ConditionExpression: 'attribute_not_exists(PK)',
        }),
      );

      this.logger.info('User saved to DynamoDB', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        this.logger.warn('Duplicate user detected', {
          userId: user.id,
          email: user.email,
        });
        throw new DuplicateUserError(user.email);
      }
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   *
   * 📚 EXAMEN AWS: GetItem operation
   * - Query por partition key (más eficiente que Scan)
   */
  async findById(id: string): Promise<User | null> {
    const response = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({
          PK: `USER#${id}`,
          SK: 'PROFILE',
        }),
      }),
    );

    if (!response.Item) {
      this.logger.debug('User not found by ID', { userId: id });
      return null;
    }

    const item = unmarshall(response.Item) as UserDynamoDBItem;
    return this.toEntity(item);
  }

  /**
   * Buscar usuario por email
   *
   * 📚 EXAMEN AWS: Query con GSI
   * - Usa Global Secondary Index para búsqueda eficiente
   * - Query es más eficiente que Scan (solo lee partition relevante)
   */
  async findByEmail(email: string): Promise<User | null> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: this.gsiName,
        KeyConditionExpression: 'GSI1PK = :email',
        ExpressionAttributeValues: marshall({
          ':email': `EMAIL#${email.toLowerCase()}`,
        }),
        Limit: 1,
      }),
    );

    if (!response.Items || response.Items.length === 0) {
      this.logger.debug('User not found by email', { email });
      return null;
    }

    const firstItem = response.Items[0];
    if (!firstItem) {
      return null;
    }

    const item = unmarshall(firstItem) as UserDynamoDBItem;
    return this.toEntity(item);
  }

  /**
   * Actualizar usuario
   *
   * 📚 EXAMEN AWS: UpdateItem operation
   * - Update específico de atributos
   * - Actualiza automáticamente updatedAt
   */
  async update(user: User): Promise<User> {
    const item = this.toItem(user);

    await this.client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          PK: `USER#${user.id}`,
          SK: 'PROFILE',
        }),
        UpdateExpression:
          'SET email = :email, firstName = :firstName, lastName = :lastName, ' +
          'isActive = :isActive, updatedAt = :updatedAt, ' +
          'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: marshall({
          ':email': item.email,
          ':firstName': item.firstName,
          ':lastName': item.lastName,
          ':isActive': item.isActive,
          ':updatedAt': item.updatedAt,
          ':gsi1pk': item.GSI1PK,
        }),
        // 📚 EXAMEN: Conditional update - solo actualiza si existe
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );

    this.logger.info('User updated in DynamoDB', {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  /**
   * Eliminar usuario
   *
   * 📚 EXAMEN AWS: DeleteItem operation
   * - Hard delete (elimina permanentemente)
   */
  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          PK: `USER#${id}`,
          SK: 'PROFILE',
        }),
      }),
    );

    this.logger.info('User deleted from DynamoDB', { userId: id });
  }

  /**
   * Listar usuarios con paginación
   *
   * 📚 EXAMEN AWS: Scan con pagination
   * - IMPORTANTE: Scan es costoso, solo para admin/reports
   * - Usa LastEvaluatedKey para pagination
   * - Limit controla el tamaño de la página
   */
  async list(options?: ListUsersOptions): Promise<ListUsersResult> {
    const limit = options?.limit ?? 20;
    const exclusiveStartKey = options?.lastEvaluatedKey
      ? this.decodeLastEvaluatedKey(options.lastEvaluatedKey)
      : undefined;

    const response = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: marshall({
          ':entityType': 'USER',
        }),
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    const users = (response.Items ?? [])
      .map((item) => unmarshall(item) as UserDynamoDBItem)
      .map((item) => this.toEntity(item));

    const lastEvaluatedKey = response.LastEvaluatedKey
      ? this.encodeLastEvaluatedKey(response.LastEvaluatedKey)
      : undefined;

    this.logger.info('Users listed from DynamoDB', {
      count: users.length,
      hasMore: !!lastEvaluatedKey,
    });

    return {
      users,
      lastEvaluatedKey,
      count: users.length,
    };
  }

  /**
   * Verificar si existe un usuario por email
   *
   * 📚 EXAMEN AWS: Query eficiente
   * - Solo consulta, no lee todo el item
   * - Usa ProjectionExpression para reducir datos transferidos
   */
  async existsByEmail(email: string): Promise<boolean> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: this.gsiName,
        KeyConditionExpression: 'GSI1PK = :email',
        ExpressionAttributeValues: marshall({
          ':email': `EMAIL#${email.toLowerCase()}`,
        }),
        ProjectionExpression: 'PK',
        Limit: 1,
      }),
    );

    return (response.Items?.length ?? 0) > 0;
  }

  /**
   * Convierte entidad User a DynamoDB item
   *
   * 📚 EXAMEN AWS: Data modeling
   * - PK/SK pattern para single-table design
   * - GSI para búsquedas alternativas
   */
  private toItem(user: User): UserDynamoDBItem {
    return {
      PK: `USER#${user.id}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
      GSI1SK: 'PROFILE',
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      entityType: 'USER',
    };
  }

  /**
   * Convierte DynamoDB item a entidad User
   */
  private toEntity(item: UserDynamoDBItem): User {
    return User.reconstitute({
      id: item.id,
      email: item.email,
      firstName: item.firstName,
      lastName: item.lastName,
      isActive: item.isActive,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
  }

  /**
   * Codifica LastEvaluatedKey a base64
   *
   * 📚 EXAMEN AWS: Pagination pattern
   * - El cliente no debe conocer la estructura interna
   * - Token opaco (base64) es más seguro
   */
  private encodeLastEvaluatedKey(key: Record<string, any>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  /**
   * Decodifica LastEvaluatedKey desde base64
   */
  private decodeLastEvaluatedKey(token: string): Record<string, any> {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  }
}
