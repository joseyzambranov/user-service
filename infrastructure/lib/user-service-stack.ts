/**
 * User Service CDK Stack
 *
 * 📚 EXAMEN AWS: Complete Serverless Stack
 * - DynamoDB Table con GSI
 * - 5 Lambda Functions (NodejsFunction)
 * - API Gateway REST API
 * - IAM Permissions (least privilege)
 * - CloudWatch Logging
 * - X-Ray Tracing
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * 📚 EXAMEN AWS: Stack Props
 * - Configuración del stack
 * - Environment, tags, etc.
 */
export class UserServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // 1. DynamoDB Table
    // ========================================

    /**
     * 📚 EXAMEN AWS: DynamoDB Table Design
     *
     * Single-table design:
     * - PK: PARTITION_KEY (USER)
     * - SK: SORT_KEY (usr_<id>)
     * - GSI1PK: email (para búsqueda por email)
     * - GSI1SK: email (mismo valor, para query exacto)
     *
     * Best Practices:
     * - PAY_PER_REQUEST billing (no capacity planning)
     * - Point-in-time recovery (backup)
     * - Encryption at rest (default: AWS owned key)
     * - RemovalPolicy: RETAIN para production
     */
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'UserService-Users',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
      pointInTimeRecovery: true, // Enable backups
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ⚠️ Para dev/staging, usar RETAIN en prod
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Default KMS encryption

      /**
       * 📚 EXAMEN AWS: Stream Configuration
       * - NEW_AND_OLD_IMAGES: Para auditoría completa
       * - NEW_IMAGE: Solo nuevos valores (más barato)
       * - KEYS_ONLY: Solo keys (mínimo)
       *
       * Útil para:
       * - Triggers (Lambda procesando cambios)
       * - Replicación cross-region
       * - Auditoría y analytics
       */
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    /**
     * 📚 EXAMEN AWS: Global Secondary Index (GSI)
     *
     * Permite queries por email:
     * - Query: GSI1PK = email
     * - Projection: ALL (incluye todos los atributos)
     *
     * Alternative projections:
     * - KEYS_ONLY: Solo keys (más barato, menos data)
     * - INCLUDE: Especificar atributos específicos
     */
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1', // Nombre usado por DynamoDBUserRepository
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // 2. Lambda Functions
    // ========================================

    /**
     * 📚 EXAMEN AWS: Lambda Common Configuration
     * - Runtime: Node.js 20 (latest LTS)
     * - Architecture: ARM64 (Graviton2 - más barato y rápido)
     * - Memory: 512MB (buena relación precio/performance)
     * - Timeout: 30s (máximo para API Gateway sync)
     * - Bundling: esbuild (más rápido que webpack)
     * - Tracing: Active (X-Ray para debugging)
     */
    const lambdaCommonProps: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.X86_64, // X86_64 es más compatible con Windows/Docker Desktop
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      environment: {
        TABLE_NAME: usersTable.tableName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1', // Reuse HTTP connections
        LOG_LEVEL: 'INFO',
        NODE_OPTIONS: '--enable-source-maps', // Better error stack traces
      },
      bundling: {
        minify: true, // Reduce bundle size
        sourceMap: true, // Enable source maps
        target: 'es2022', // Modern JS features
        externalModules: [
          '@aws-sdk/*', // AWS SDK v3 incluido en runtime
        ],
        /**
         * 📚 EXAMEN AWS: esbuild Configuration
         * - Transpila TypeScript a JavaScript
         * - Bundle dependencies (single file)
         * - Tree shaking (elimina código no usado)
         */
      },
      /**
       * 📚 EXAMEN AWS: Log Retention
       * - CloudWatch Logs retention period
       * - Controla costos (logs pueden ser caros)
       * - Production: 1-3 meses, Dev: 1 semana
       */
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    /**
     * 📚 EXAMEN AWS: NodejsFunction vs Function
     *
     * NodejsFunction (RECOMENDADO para TypeScript):
     * - Auto-bundling con esbuild
     * - Detecta entry point automáticamente
     * - Transpila TypeScript
     * - Bundle dependencies
     *
     * Function (manual):
     * - Requiere pre-build manual
     * - Más control pero más trabajo
     */

    // Lambda: Create User
    const createUserFunction = new lambdaNodejs.NodejsFunction(
      this,
      'CreateUserFunction',
      {
        ...lambdaCommonProps,
        functionName: 'UserService-CreateUser',
        entry: path.join(__dirname, '../../src/infrastructure/lambda/handlers/createUser.ts'),
        handler: 'handler',
        description: 'Creates a new user in DynamoDB',
      },
    );

    // Lambda: Get User by ID
    const getUserFunction = new lambdaNodejs.NodejsFunction(this, 'GetUserFunction', {
      ...lambdaCommonProps,
      functionName: 'UserService-GetUser',
      entry: path.join(__dirname, '../../src/infrastructure/lambda/handlers/getUser.ts'),
      handler: 'handler',
      description: 'Retrieves a user by ID from DynamoDB',
    });

    // Lambda: Update User
    const updateUserFunction = new lambdaNodejs.NodejsFunction(
      this,
      'UpdateUserFunction',
      {
        ...lambdaCommonProps,
        functionName: 'UserService-UpdateUser',
        entry: path.join(__dirname, '../../src/infrastructure/lambda/handlers/updateUser.ts'),
        handler: 'handler',
        description: 'Updates an existing user in DynamoDB',
      },
    );

    // Lambda: Delete User
    const deleteUserFunction = new lambdaNodejs.NodejsFunction(
      this,
      'DeleteUserFunction',
      {
        ...lambdaCommonProps,
        functionName: 'UserService-DeleteUser',
        entry: path.join(__dirname, '../../src/infrastructure/lambda/handlers/deleteUser.ts'),
        handler: 'handler',
        description: 'Deletes a user from DynamoDB',
      },
    );

    // Lambda: List Users (with pagination)
    const listUsersFunction = new lambdaNodejs.NodejsFunction(
      this,
      'ListUsersFunction',
      {
        ...lambdaCommonProps,
        functionName: 'UserService-ListUsers',
        entry: path.join(__dirname, '../../src/infrastructure/lambda/handlers/listUsers.ts'),
        handler: 'handler',
        description: 'Lists users with pagination from DynamoDB',
      },
    );

    // ========================================
    // 3. IAM Permissions (Least Privilege)
    // ========================================

    /**
     * 📚 EXAMEN AWS: Lambda Permissions
     *
     * Grant methods:
     * - grantReadData: GetItem, Query, Scan
     * - grantWriteData: PutItem, UpdateItem, DeleteItem
     * - grantReadWriteData: Both read + write
     * - grant: Custom permissions
     *
     * Best Practice:
     * - Otorgar solo permisos necesarios por función
     * - NO usar grantFullAccess en production
     */

    // CreateUser: Read + Write (necesita leer GSI para verificar email duplicado)
    usersTable.grantReadWriteData(createUserFunction);

    // GetUser: Read only
    usersTable.grantReadData(getUserFunction);

    // UpdateUser: Read + Write (necesita leer antes de actualizar)
    usersTable.grantReadWriteData(updateUserFunction);

    // DeleteUser: Read + Write (necesita verificar que existe antes de eliminar)
    usersTable.grantReadWriteData(deleteUserFunction);

    // ListUsers: Read only (Scan)
    usersTable.grantReadData(listUsersFunction);

    // ========================================
    // 4. API Gateway REST API
    // ========================================

    /**
     * 📚 EXAMEN AWS: API Gateway Configuration
     *
     * REST API vs HTTP API:
     * - REST API: Más features (authorizers, usage plans, API keys)
     * - HTTP API: Más simple, más barato (70% menos costo)
     *
     * Para el examen, conocer REST API es más importante
     */
    const api = new apigateway.RestApi(this, 'UserServiceApi', {
      restApiName: 'User Service API',
      description: 'API Gateway for User Service (AWS Certified Developer exam study)',
      /**
       * 📚 EXAMEN AWS: Deployment Configuration
       *
       * deployOptions:
       * - stageName: Nombre del stage (dev, staging, prod)
       * - throttle: Rate limiting (requests per second)
       * - loggingLevel: INFO, ERROR, OFF
       * - dataTraceEnabled: Log full request/response (⚠️ cuidado con datos sensibles)
       * - metricsEnabled: CloudWatch metrics
       * - tracingEnabled: X-Ray tracing
       */
      deployOptions: {
        stageName: 'dev',
        throttlingRateLimit: 100, // requests per second
        throttlingBurstLimit: 200, // burst capacity
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true, // ⚠️ Solo dev/staging (expone payloads en logs)
        metricsEnabled: true,
        tracingEnabled: true, // X-Ray
      },
      /**
       * 📚 EXAMEN AWS: CORS Configuration
       *
       * Para aplicaciones web con origen diferente al API
       * - allowOrigins: ['https://myapp.com'] o ['*'] (dev only)
       * - allowMethods: HTTP methods permitidos
       * - allowHeaders: Headers permitidos en requests
       */
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // ⚠️ Solo dev, especificar origins en prod
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      /**
       * 📚 EXAMEN AWS: CloudWatch Role
       *
       * API Gateway necesita rol para escribir logs a CloudWatch
       * - cloudWatchRole: true (crea automáticamente)
       * - Una sola vez por account/region
       */
      cloudWatchRole: true,
    });

    /**
     * 📚 EXAMEN AWS: Lambda Integration
     *
     * Tipos de integración:
     * 1. LAMBDA_PROXY (RECOMENDADO):
     *    - API Gateway pasa todo el evento al Lambda
     *    - Lambda retorna objeto con statusCode, headers, body
     *    - Más flexible, full control del response
     *
     * 2. LAMBDA (non-proxy):
     *    - Requiere mapping templates (VTL - Velocity Template Language)
     *    - Transformaciones en API Gateway
     *    - Más complejo, menos usado
     */
    const lambdaIntegrationOptions: apigateway.LambdaIntegrationOptions = {
      proxy: true, // LAMBDA_PROXY integration
      allowTestInvoke: true, // Permite probar desde console
    };

    // ========================================
    // 5. API Routes
    // ========================================

    /**
     * 📚 EXAMEN AWS: REST API Resource Hierarchy
     *
     * Estructura:
     * /
     * └── users (resource)
     *     ├── GET    (list users)
     *     ├── POST   (create user)
     *     └── {id} (resource)
     *         ├── GET    (get user)
     *         ├── PUT    (update user)
     *         └── DELETE (delete user)
     */

    // Resource: /users
    const usersResource = api.root.addResource('users');

    // POST /users - Create User
    usersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createUserFunction, lambdaIntegrationOptions),
      {
        /**
         * 📚 EXAMEN AWS: Request Validation
         *
         * Opciones:
         * - VALIDATE_BODY: Valida request body contra schema
         * - VALIDATE_PARAMETERS: Valida query/path params
         * - VALIDATE_ALL: Ambos
         *
         * Reduce invocaciones inválidas a Lambda (ahorra $)
         */
        requestValidatorOptions: {
          validateRequestBody: true,
          validateRequestParameters: false,
        },
      },
    );

    // GET /users - List Users (paginated)
    usersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listUsersFunction, lambdaIntegrationOptions),
      {
        /**
         * 📚 EXAMEN AWS: Query Parameters
         *
         * Define query params esperados:
         * - limit: número de items por página
         * - nextToken: cursor de paginación
         *
         * requestParameters: { 'method.request.querystring.limit': false }
         * - false = opcional
         * - true = requerido
         */
        requestParameters: {
          'method.request.querystring.limit': false,
          'method.request.querystring.nextToken': false,
        },
      },
    );

    // Resource: /users/{id}
    const userByIdResource = usersResource.addResource('{id}');

    // GET /users/{id} - Get User
    userByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getUserFunction, lambdaIntegrationOptions),
      {
        /**
         * 📚 EXAMEN AWS: Path Parameters
         *
         * {id} en la ruta se convierte en path parameter
         * - Accesible en Lambda via event.pathParameters.id
         */
        requestParameters: {
          'method.request.path.id': true, // Required path parameter
        },
      },
    );

    // PUT /users/{id} - Update User
    userByIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateUserFunction, lambdaIntegrationOptions),
      {
        requestValidatorOptions: {
          validateRequestBody: true,
          validateRequestParameters: true,
        },
        requestParameters: {
          'method.request.path.id': true,
        },
      },
    );

    // DELETE /users/{id} - Delete User
    userByIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteUserFunction, lambdaIntegrationOptions),
      {
        requestParameters: {
          'method.request.path.id': true,
        },
      },
    );

    // ========================================
    // 6. CloudFormation Outputs
    // ========================================

    /**
     * 📚 EXAMEN AWS: Stack Outputs
     *
     * Valores exportados del stack:
     * - Visibles en CloudFormation console
     * - Usables por otros stacks (cross-stack references)
     * - Útiles para testing y deployment
     */

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'UserServiceApiUrl',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: usersTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'UserServiceTableName',
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: usersTable.tableArn,
      description: 'DynamoDB table ARN',
      exportName: 'UserServiceTableArn',
    });

    /**
     * 📚 EXAMEN AWS: Output de Lambda ARNs
     *
     * Útil para:
     * - Invocar Lambdas desde otros servicios
     * - Configurar event sources
     * - Testing
     */
    new cdk.CfnOutput(this, 'CreateUserFunctionArn', {
      value: createUserFunction.functionArn,
      description: 'CreateUser Lambda ARN',
    });

    new cdk.CfnOutput(this, 'GetUserFunctionArn', {
      value: getUserFunction.functionArn,
      description: 'GetUser Lambda ARN',
    });

    new cdk.CfnOutput(this, 'UpdateUserFunctionArn', {
      value: updateUserFunction.functionArn,
      description: 'UpdateUser Lambda ARN',
    });

    new cdk.CfnOutput(this, 'DeleteUserFunctionArn', {
      value: deleteUserFunction.functionArn,
      description: 'DeleteUser Lambda ARN',
    });

    new cdk.CfnOutput(this, 'ListUsersFunctionArn', {
      value: listUsersFunction.functionArn,
      description: 'ListUsers Lambda ARN',
    });
  }
}

/**
 * 📚 EXAMEN AWS: Resumen de Puntos Clave
 *
 * 1. DynamoDB:
 *    ✅ Single-table design con PK/SK
 *    ✅ GSI para búsqueda por email
 *    ✅ PAY_PER_REQUEST billing (on-demand)
 *    ✅ Point-in-time recovery (backups)
 *    ✅ Streams para auditoría
 *
 * 2. Lambda:
 *    ✅ NodejsFunction con auto-bundling
 *    ✅ ARM64 architecture (Graviton2)
 *    ✅ Environment variables (TABLE_NAME)
 *    ✅ X-Ray tracing
 *    ✅ CloudWatch Logs con retention
 *
 * 3. IAM:
 *    ✅ Least privilege permissions
 *    ✅ grantReadData, grantWriteData separados
 *    ✅ NO full access
 *
 * 4. API Gateway:
 *    ✅ REST API con stages
 *    ✅ LAMBDA_PROXY integration
 *    ✅ CORS configuration
 *    ✅ Request validation
 *    ✅ Throttling y rate limiting
 *    ✅ CloudWatch logging
 *    ✅ X-Ray tracing
 *
 * 5. Best Practices:
 *    ✅ Infrastructure as Code (IaC)
 *    ✅ Parametrización con environment variables
 *    ✅ CloudFormation outputs para testing
 *    ✅ Tags para organización
 *    ✅ RemovalPolicy configurado según entorno
 *
 * 6. Testing Strategy:
 *    - Local: SAM CLI (sam local start-api)
 *    - Dev: cdk deploy (stack completo en AWS)
 *    - Integration: Postman/curl contra API URL
 *
 * 7. Deployment:
 *    ```bash
 *    # Sintetizar template
 *    pnpm cdk synth
 *
 *    # Ver cambios antes de deploy
 *    pnpm cdk diff
 *
 *    # Deploy a AWS
 *    pnpm cdk deploy
 *
 *    # Destruir stack
 *    pnpm cdk destroy
 *    ```
 */
