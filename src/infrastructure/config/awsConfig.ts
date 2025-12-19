/**
 * AWS Configuration Module
 *
 * 📚 EXAMEN AWS: Environment Configuration
 * - Centraliza configuración de AWS
 * - Lee de variables de entorno
 * - Valida configuración requerida
 *
 * 🎯 PATRÓN: Configuration Object
 * - Single source of truth para config
 * - Type-safe configuration
 * - Fail-fast si falta configuración crítica
 */

/**
 * Configuración de AWS Services
 */
export interface AWSConfig {
  /**
   * Región de AWS donde se ejecuta la aplicación
   * 📚 EXAMEN: Lambda setea AWS_REGION automáticamente
   */
  region: string;

  /**
   * Nombre de la tabla DynamoDB
   * 📚 EXAMEN: Configurado por CDK/CloudFormation
   */
  tableName: string;

  /**
   * Ambiente de ejecución (development, staging, production)
   */
  environment: string;

  /**
   * Nivel de log (DEBUG, INFO, WARN, ERROR)
   */
  logLevel: string;
}

/**
 * Obtiene valor de variable de entorno
 * Lanza error si es requerida y no existe
 *
 * @param key - Nombre de la variable de entorno
 * @param defaultValue - Valor por defecto (opcional)
 * @param required - Si es requerida (default: false)
 * @returns Valor de la variable de entorno
 */
function getEnvVar(
  key: string,
  defaultValue?: string,
  required: boolean = false,
): string {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set it in your Lambda configuration or .env file.`
    );
  }

  return value || '';
}

/**
 * Configuración de AWS obtenida de variables de entorno
 *
 * 📚 EXAMEN AWS: Lambda Environment Variables
 * - AWS_REGION: Seteada automáticamente por Lambda
 * - TABLE_NAME: Configurada en CloudFormation/CDK
 * - NODE_ENV: Seteada manualmente (development/production)
 * - LOG_LEVEL: Opcional, default según ambiente
 *
 * Variables de entorno en Lambda:
 * - Configurables en CloudFormation/CDK
 * - Encriptables con KMS
 * - Accesibles via process.env
 *
 * @example
 * ```typescript
 * // En Lambda handler:
 * import { awsConfig } from '@infrastructure/config/awsConfig';
 *
 * const repository = new DynamoDBUserRepository(
 *   awsConfig.tableName,
 *   logger,
 *   awsConfig.region
 * );
 * ```
 */
export const awsConfig: AWSConfig = {
  // 📚 EXAMEN: AWS_REGION es seteada por Lambda automáticamente
  region: getEnvVar('AWS_REGION', 'us-east-1'),

  // 📚 EXAMEN: TABLE_NAME debe ser configurada en CloudFormation
  tableName: getEnvVar('TABLE_NAME', 'user-service-dev-UsersTable', true),

  // Ambiente de ejecución
  environment: getEnvVar('NODE_ENV', 'development'),

  // Nivel de log según ambiente
  logLevel: getEnvVar(
    'LOG_LEVEL',
    getEnvVar('NODE_ENV') === 'production' ? 'INFO' : 'DEBUG'
  ),
};

/**
 * Valida que la configuración esté completa
 * Útil para catch temprano de problemas de config
 *
 * @throws Error si falta configuración crítica
 */
export function validateConfig(): void {
  const missingVars: string[] = [];

  if (!awsConfig.tableName) {
    missingVars.push('TABLE_NAME');
  }

  if (!awsConfig.region) {
    missingVars.push('AWS_REGION');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Application cannot start without proper configuration.`
    );
  }
}

/**
 * Indica si estamos en ambiente de producción
 *
 * @returns true si NODE_ENV === 'production'
 */
export function isProduction(): boolean {
  return awsConfig.environment === 'production';
}

/**
 * Indica si estamos en ambiente de desarrollo
 *
 * @returns true si NODE_ENV === 'development'
 */
export function isDevelopment(): boolean {
  return awsConfig.environment === 'development';
}

/**
 * Indica si estamos ejecutando en Lambda
 *
 * @returns true si detecta variables de Lambda
 */
export function isLambda(): boolean {
  return !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

/**
 * Obtiene información del contexto Lambda (si está disponible)
 *
 * @returns Información de Lambda o null
 */
export function getLambdaContext(): {
  functionName: string;
  functionVersion: string;
  memorySize: string;
  region: string;
} | null {
  if (!isLambda()) {
    return null;
  }

  return {
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
    functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown',
    memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
    region: process.env.AWS_REGION || 'unknown',
  };
}

/**
 * Ejemplo de uso en diferentes capas:
 *
 * ```typescript
 * // 1. En Lambda Handler (infrastructure/lambda/handlers/createUser.ts)
 * import { awsConfig } from '@infrastructure/config/awsConfig';
 * import { DynamoDBUserRepository } from '@infrastructure/repositories/DynamoDBUserRepository';
 * import { CloudWatchLogger } from '@infrastructure/adapters/CloudWatchLogger';
 *
 * const logger = new CloudWatchLogger({
 *   context: 'CreateUserHandler',
 *   minLevel: awsConfig.logLevel as LogLevel,
 * });
 *
 * const userRepository = new DynamoDBUserRepository(
 *   awsConfig.tableName,
 *   logger,
 *   awsConfig.region
 * );
 *
 * // 2. Para logging condicional
 * import { isDevelopment, isProduction } from '@infrastructure/config/awsConfig';
 *
 * if (isDevelopment()) {
 *   console.log('Debug info:', data); // Solo en dev
 * }
 *
 * // 3. Para feature flags por ambiente
 * import { awsConfig, isProduction } from '@infrastructure/config/awsConfig';
 *
 * const enableDetailedErrors = !isProduction();
 * const enableRateLimiting = isProduction();
 * ```
 *
 * 📚 EXAMEN AWS: Environment Variables en Lambda
 *
 * Variables automáticas (Lambda las setea):
 * - AWS_REGION: Región donde se ejecuta
 * - AWS_LAMBDA_FUNCTION_NAME: Nombre de la función
 * - AWS_LAMBDA_FUNCTION_VERSION: Versión ($LATEST o número)
 * - AWS_LAMBDA_FUNCTION_MEMORY_SIZE: Memoria asignada (MB)
 * - AWS_EXECUTION_ENV: Runtime (ej: AWS_Lambda_nodejs20.x)
 * - _X_AMZN_TRACE_ID: Trace ID de X-Ray
 *
 * Variables configurables (tú las defines):
 * - TABLE_NAME: Nombre de tabla DynamoDB
 * - NODE_ENV: Ambiente (development/production)
 * - LOG_LEVEL: Nivel de logging
 * - CORS_ORIGIN: Origen permitido para CORS
 * - API_KEY: Keys de APIs externas (encriptar con KMS)
 *
 * Configuración en CDK:
 * ```typescript
 * new lambda.Function(this, 'CreateUser', {
 *   // ...
 *   environment: {
 *     TABLE_NAME: usersTable.tableName,
 *     NODE_ENV: 'production',
 *     LOG_LEVEL: 'INFO',
 *   },
 * });
 * ```
 *
 * Best Practices:
 * ✅ Usa awsConfig para centralizar configuración
 * ✅ Valida config al inicio con validateConfig()
 * ✅ Usa valores por defecto razonables
 * ✅ Marca como required variables críticas
 * ✅ Encripta secretos con KMS o Secrets Manager
 * ✅ No hardcodees valores en el código
 */
