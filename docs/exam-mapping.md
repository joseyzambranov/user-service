# AWS Certified Developer Associate - Exam Mapping

Este documento mapea los conceptos implementados en el User Service a los dominios específicos del examen **AWS Certified Developer - Associate (DVA-C02)**.

## 📋 Dominios del Examen

El examen DVA-C02 se divide en 4 dominios principales:

| Dominio | Peso | Descripción |
|---------|------|-------------|
| 1 | 32% | Development with AWS Services |
| 2 | 26% | Security |
| 3 | 24% | Deployment |
| 4 | 18% | Troubleshooting and Optimization |

---

## 🎯 Domain 1: Development with AWS Services (32%)

### 1.1 Develop code for applications hosted on AWS

#### ✅ **Lambda Function Handlers**
**Archivos:**
- `src/infrastructure/lambda/handlers/createUser.ts`
- `src/infrastructure/lambda/handlers/getUser.ts`
- `src/infrastructure/lambda/handlers/updateUser.ts`
- `src/infrastructure/lambda/handlers/deleteUser.ts`
- `src/infrastructure/lambda/handlers/listUsers.ts`

**Conceptos cubiertos:**
- ✅ Lambda handler signature: `(event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>`
- ✅ Event processing (path params, query params, body)
- ✅ Response formatting (statusCode, headers, body)
- ✅ Error handling en Lambda
- ✅ Dependency injection pattern
- ✅ Thin controller pattern (handler delega a Use Case)

**Ejemplo en examen:**
> *"¿Cuál es la firma correcta de un Lambda handler para API Gateway?"*
- Respuesta: `(event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>`

---

#### ✅ **Environment Variables**
**Archivos:**
- `src/infrastructure/config/awsConfig.ts`
- `.env.example`
- `infrastructure/lib/user-service-stack.ts` (Lambda environment variables)

**Conceptos cubiertos:**
- ✅ `process.env` para configuración
- ✅ Variables de entorno en Lambda (TABLE_NAME, AWS_REGION, LOG_LEVEL)
- ✅ Configuración por ambiente (dev, staging, prod)
- ✅ Separación de secrets vs config

**Ejemplo en examen:**
> *"¿Cómo debe una función Lambda acceder a información sensible?"*
- Respuesta: Usar AWS Secrets Manager o Parameter Store, NO hardcodear en código

---

#### ✅ **Asynchronous Programming**
**Archivos:**
- `src/application/use-cases/*.ts` (todos los use cases)
- `src/infrastructure/repositories/DynamoDBUserRepository.ts`

**Conceptos cubiertos:**
- ✅ `async/await` para operaciones asíncronas
- ✅ `Promise` handling
- ✅ Error propagation con try/catch
- ✅ Parallel operations con `Promise.all()`

**Ejemplo en examen:**
> *"¿Cuál es la mejor práctica para manejar múltiples operaciones DynamoDB en paralelo?"*
- Respuesta: `Promise.all([op1, op2, op3])` para operaciones independientes

---

### 1.2 Write code for serverless applications

#### ✅ **API Gateway Integration**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (API Gateway + Lambda integration)
- `src/infrastructure/http/apiResponse.ts` (response formatting)

**Conceptos cubiertos:**
- ✅ REST API con API Gateway
- ✅ Lambda Proxy Integration
- ✅ HTTP methods (GET, POST, PUT, DELETE)
- ✅ Path parameters: `/users/{id}`
- ✅ Query parameters: `/users?limit=10&nextToken=xyz`
- ✅ Request/Response transformation
- ✅ CORS configuration

**Ejemplo en examen:**
> *"¿Qué debe retornar un Lambda handler con Lambda Proxy Integration?"*
- Respuesta: `{ statusCode: number, headers: {}, body: string }`

---

#### ✅ **Event-Driven Architecture**
**Archivos:**
- Todos los Lambda handlers procesan eventos de API Gateway
- `src/infrastructure/lambda/handlers/*.ts`

**Conceptos cubiertos:**
- ✅ Event source: API Gateway
- ✅ Event structure: `APIGatewayProxyEvent`
- ✅ Synchronous invocation (API Gateway → Lambda)
- ✅ Response to caller (API Gateway Proxy)

**Ejemplo en examen:**
> *"¿Cuál es la diferencia entre invocación síncrona y asíncrona de Lambda?"*
- Respuesta: Síncrona espera respuesta (API Gateway), asíncrona no espera (SNS, S3)

---

### 1.3 Use data stores in application development

#### ✅ **DynamoDB Single-Table Design**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (table definition)
- `src/infrastructure/repositories/DynamoDBUserRepository.ts`

**Conceptos cubiertos:**
- ✅ **Primary Key**: PK (Partition Key) = `USER`
- ✅ **Sort Key**: SK = `usr_<uuid>`
- ✅ **Single-table pattern**: Una tabla para múltiples entidades
- ✅ **Item structure**: `{ PK, SK, ...attributes }`
- ✅ **Capacity modes**: On-demand vs Provisioned

**Ejemplo en examen:**
> *"¿Cuál es la diferencia entre Partition Key y Sort Key en DynamoDB?"*
- Respuesta: PK distribuye datos, SK ordena items dentro de la misma partition

---

#### ✅ **Global Secondary Index (GSI)**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (EmailIndex GSI)
- `src/infrastructure/repositories/DynamoDBUserRepository.ts:findByEmail()`

**Conceptos cubiertos:**
- ✅ GSI para búsqueda por atributo no-key (email)
- ✅ **GSI Keys**: GSI1PK = `EMAIL#<email>`, GSI1SK = `EMAIL#<email>`
- ✅ Projection type: ALL, KEYS_ONLY, INCLUDE
- ✅ Eventual consistency en GSI

**Ejemplo en examen:**
> *"¿Cómo buscar un usuario por email si email no es Primary Key?"*
- Respuesta: Crear un Global Secondary Index con email como partition key

---

#### ✅ **DynamoDB Operations**
**Archivos:**
- `src/infrastructure/repositories/DynamoDBUserRepository.ts`

**Conceptos cubiertos:**

**PutItem** (Create):
- ✅ `ConditionExpression`: Prevenir sobrescritura
- ✅ Atomic write operation
- ✅ Item-level TTL (opcional)

**GetItem** (Read by ID):
- ✅ Strongly consistent read vs Eventually consistent
- ✅ Lectura más eficiente (usa PK + SK)

**UpdateItem** (Update):
- ✅ `UpdateExpression`: Solo actualizar campos específicos
- ✅ `ConditionExpression`: Update condicional (optimistic locking)
- ✅ Atomic counters

**DeleteItem** (Delete):
- ✅ `ConditionExpression`: Delete condicional
- ✅ Retornar item eliminado con `ReturnValues: 'ALL_OLD'`

**Query** (GSI):
- ✅ Buscar por GSI (email)
- ✅ `KeyConditionExpression`
- ✅ Más eficiente que Scan

**Scan** (List all):
- ✅ Full table scan (costoso)
- ✅ Pagination con `LastEvaluatedKey`
- ✅ Limit para controlar resultados
- ⚠️ **NO recomendado en producción sin límites**

**Ejemplo en examen:**
> *"¿Cuál es la diferencia entre Query y Scan en DynamoDB?"*
- Respuesta: Query usa índices (eficiente), Scan lee toda la tabla (costoso)

---

#### ✅ **DynamoDB Best Practices**
**Conceptos implementados:**
- ✅ Conditional writes para prevenir race conditions
- ✅ Projection expressions para reducir data transfer
- ✅ Consistent reads cuando sea necesario
- ✅ Pagination para listas grandes
- ✅ Error handling (ConditionalCheckFailedException, ResourceNotFoundException)

**Ejemplo en examen:**
> *"¿Cómo prevenir que dos Lambdas creen el mismo usuario simultáneamente?"*
- Respuesta: Usar `ConditionExpression: 'attribute_not_exists(PK)'` en PutItem

---

### 1.4 Develop and implement APIs

#### ✅ **RESTful API Design**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (API Gateway routes)
- Todos los handlers

**Conceptos cubiertos:**
- ✅ **Resource-based URLs**: `/users`, `/users/{id}`
- ✅ **HTTP verbs**: GET, POST, PUT, DELETE
- ✅ **Idempotency**: PUT y DELETE son idempotentes
- ✅ **HTTP status codes**: 200, 201, 204, 400, 404, 500

**Ejemplo en examen:**
> *"¿Qué status code debe retornar POST /users al crear exitosamente?"*
- Respuesta: `201 Created` con header `Location: /users/{id}`

---

#### ✅ **Request Validation**
**Archivos:**
- `src/application/dtos/*.ts` (Zod schemas)
- `src/infrastructure/http/errorHandler.ts`

**Conceptos cubiertos:**
- ✅ Schema validation con Zod
- ✅ Request body validation (CreateUserDto, UpdateUserDto)
- ✅ Path parameter validation (UserIdParamDto)
- ✅ Query parameter validation (ListUsersQueryDto)
- ✅ Error responses con detalles útiles

**Ejemplo en examen:**
> *"¿Dónde debe validarse la entrada de una API: API Gateway o Lambda?"*
- Respuesta: Ambos (API Gateway para validación básica, Lambda para lógica de negocio)

---

#### ✅ **API Documentation**
**Archivos:**
- `src/infrastructure/swagger/swaggerGenerator.ts`
- `docs/openapi.json`
- `docs/swagger-ui/index.html`

**Conceptos cubiertos:**
- ✅ OpenAPI 3.0 specification
- ✅ Swagger UI para documentación interactiva
- ✅ Schema definitions (DTOs → OpenAPI schemas)
- ✅ Request/Response examples

**Ejemplo en examen:**
> *"¿Cuál es el estándar recomendado para documentar REST APIs?"*
- Respuesta: OpenAPI Specification (antes Swagger)

---

#### ✅ **Pagination**
**Archivos:**
- `src/infrastructure/lambda/handlers/listUsers.ts`
- `src/application/dtos/ListUsersQueryDto.ts`
- `src/application/dtos/UserListResponseDto.ts`

**Conceptos cubiertos:**
- ✅ **Cursor-based pagination** (mejor que offset)
- ✅ `nextToken` opaco (base64 encoded DynamoDB key)
- ✅ `limit` configurable con máximo (prevenir abuse)
- ✅ Metadata en response: `count`, `hasMore`

**Ejemplo en examen:**
> *"¿Cuál es el mejor patrón de paginación para DynamoDB?"*
- Respuesta: Cursor-based con `LastEvaluatedKey` como `nextToken`

---

## 🔒 Domain 2: Security (26%)

### 2.1 Implement authentication and authorization

⚠️ **NO IMPLEMENTADO** - Este proyecto no tiene autenticación ni autorización.

---

### 2.2 Implement encryption

#### ✅ **Encryption at Rest**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts`

**Conceptos cubiertos:**
- ✅ DynamoDB encryption at rest (AWS owned key por defecto)

**Ejemplo en examen:**
> *"¿Cómo encriptar datos en DynamoDB?"*
- Respuesta: Encryption at rest activado por defecto con AWS owned key

---

#### ✅ **Encryption in Transit**
**Conceptos cubiertos:**
- ✅ HTTPS obligatorio en API Gateway
- ✅ TLS 1.2+ para comunicación cliente-servidor
- ✅ AWS SDK usa HTTPS por defecto

**Ejemplo en examen:**
> *"¿Cómo asegurar datos en tránsito en API Gateway?"*
- Respuesta: API Gateway solo permite HTTPS, TLS 1.2+

---

### 2.3 Manage sensitive data

#### ✅ **Environment Variables**
**Archivos:**
- `.env.example` (template, no secrets reales)
- `src/infrastructure/config/awsConfig.ts`

**Conceptos cubiertos:**
- ✅ **NO hardcodear secrets** en código
- ✅ Environment variables para configuración no-sensible
- ✅ `.gitignore` para prevenir commit de `.env`

**Ejemplo en examen:**
> *"¿Dónde almacenar credenciales de base de datos en Lambda?"*
- Respuesta: AWS Secrets Manager, acceder vía SDK en runtime

---

## 🚀 Domain 3: Deployment (24%)

### 3.1 Prepare application artifacts to be deployed to AWS

#### ✅ **Build Process**
**Archivos:**
- `package.json` (build scripts)
- `tsconfig.json`
- `.gitignore`

**Conceptos cubiertos:**
- ✅ TypeScript compilation a JavaScript
- ✅ Source maps para debugging
- ✅ Tree-shaking y bundling
- ✅ Exclusión de devDependencies

**Ejemplo en examen:**
> *"¿Qué debe incluirse en un deployment package de Lambda?"*
- Respuesta: Código compilado + node_modules (runtime dependencies only)

---

### 3.2 Test applications in development environments

#### ✅ **Local Testing con SAM**
**Archivos:**
- `package.json` (sam:* scripts)
- CDK synth genera template CloudFormation

**Conceptos cubiertos:**
- ✅ SAM CLI para testing local
- ✅ `sam local start-api` simula API Gateway
- ✅ `sam local invoke` invoca Lambda localmente
- ✅ CDK como fuente de verdad, SAM para testing

**Ejemplo en examen:**
> *"¿Cómo testear Lambdas localmente antes de deploy?"*
- Respuesta: SAM CLI (`sam local invoke`) o LocalStack

---

#### ✅ **Unit & Integration Testing**
**Archivos:**
- `tests/**/*.test.ts`
- `jest.config.js`

**Conceptos cubiertos:**
- ✅ BDD con jest-cucumber
- ✅ Coverage mínimo 80%
- ✅ Mocking de AWS SDK
- ✅ Test fixtures y builders

**Ejemplo en examen:**
> *"¿Cuál es una buena práctica para tests de Lambda handlers?"*
- Respuesta: Mockear AWS SDK calls, testear lógica de negocio separadamente

---

### 3.3 Deploy code using AWS services

#### ✅ **Infrastructure as Code con CDK**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts`
- `infrastructure/bin/app.ts`

**Conceptos cubiertos:**
- ✅ AWS CDK (TypeScript)
- ✅ CloudFormation templates generados automáticamente
- ✅ `cdk synth`: Generar template
- ✅ `cdk deploy`: Deploy a AWS
- ✅ `cdk destroy`: Eliminar recursos
- ✅ Multiple environments (dev, staging, prod)

**Ejemplo en examen:**
> *"¿Cuál es la ventaja de CDK vs CloudFormation directo?"*
- Respuesta: CDK permite programación imperativa, reúso, type-safety

---

#### ✅ **Lambda Deployment Configuration**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (Lambda functions)

**Conceptos cubiertos:**
- ✅ Runtime: Node.js 20.x
- ✅ Timeout: 30 segundos (máximo API Gateway síncrono)
- ✅ Memory: 512 MB (ajustable según profiling)
- ✅ Environment variables inyectadas por CDK
- ✅ IAM roles generados automáticamente

**Ejemplo en examen:**
> *"¿Cuál es el timeout máximo para Lambda invocada por API Gateway síncronamente?"*
- Respuesta: 30 segundos (Lambda max es 15 minutos)

---

### 3.4 Deploy serverless applications

#### ✅ **API Gateway Deployment**
**Conceptos cubiertos:**
- ✅ REST API creation
- ✅ Resources y Methods
- ✅ Lambda Proxy Integration
- ✅ CORS configuration
- ✅ Stages (dev, prod)

**Ejemplo en examen:**
> *"¿Qué es un 'stage' en API Gateway?"*
- Respuesta: Versión desplegada de la API (dev, staging, prod)

---

## 🔧 Domain 4: Troubleshooting and Optimization (18%)

### 4.1 Assist in root cause analysis

#### ✅ **Logging**
**Archivos:**
- `src/infrastructure/adapters/CloudWatchLogger.ts`
- Todos los handlers y use cases

**Conceptos cubiertos:**
- ✅ CloudWatch Logs integration
- ✅ Structured logging (JSON)
- ✅ Log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Context-aware logging (requestId, operation)
- ✅ Error stack traces

**Ejemplo en examen:**
> *"¿Dónde se almacenan los logs de Lambda por defecto?"*
- Respuesta: CloudWatch Logs, en Log Group `/aws/lambda/<function-name>`

---

#### ✅ **Error Handling**
**Archivos:**
- `src/infrastructure/http/errorHandler.ts`
- `src/shared/errors/*.ts` (custom errors)

**Conceptos cubiertos:**
- ✅ Manejo centralizado de errores
- ✅ Custom error classes (NotFoundError, ValidationError, ConflictError)
- ✅ Error serialization para cliente
- ✅ Logging de errores para debugging
- ✅ Status codes apropiados según error

**Ejemplo en examen:**
> *"¿Cómo manejar errores en Lambda handlers?"*
- Respuesta: try/catch, log error, retornar response con status code apropiado

---

### 4.2 Instrument code for monitoring

#### ✅ **CloudWatch Metrics**
**Archivos:**
- CDK genera métricas automáticamente

**Conceptos cubiertos:**
- ✅ Lambda metrics (invocation, duration, errors)
- ✅ DynamoDB metrics (read/write capacity, throttles)
- ✅ API Gateway metrics (requests, latency, 4xx, 5xx)

**Ejemplo en examen:**
> *"¿Qué métricas de Lambda están disponibles en CloudWatch por defecto?"*
- Respuesta: Invocations, Duration, Errors, Throttles, ConcurrentExecutions

---

#### ✅ **X-Ray Tracing**
**Archivos:**
- `infrastructure/lib/user-service-stack.ts` (tracing: Tracing.ACTIVE)
- `.env.example` (ENABLE_XRAY_TRACING)

**Conceptos cubiertos:**
- ✅ Distributed tracing habilitado
- ✅ Service map visualization
- ✅ Latency analysis
- ✅ Error analysis

**Ejemplo en examen:**
> *"¿Cómo trazar requests a través de múltiples servicios?"*
- Respuesta: AWS X-Ray para distributed tracing

---

### 4.3 Optimize applications

#### ✅ **DynamoDB Performance**
**Conceptos implementados:**
- ✅ **Query vs Scan**: Usar Query con índices siempre que sea posible
- ✅ **Projection expressions**: Solo leer atributos necesarios
- ✅ **Consistent reads**: Solo cuando sea necesario (consume 2x RCU)
- ✅ **Batch operations**: Considerar BatchGetItem/BatchWriteItem
- ✅ **GSI for queries**: Email index para búsqueda eficiente

**Ejemplo en examen:**
> *"¿Cómo optimizar lecturas frecuentes de DynamoDB?"*
- Respuesta: Usar DAX (DynamoDB Accelerator) para caching

---

#### ✅ **Lambda Performance**
**Conceptos implementados:**
- ✅ **Cold start optimization**: Dependency injection fuera del handler
- ✅ **Memory allocation**: 512 MB (ajustar según profiling)
- ✅ **Connection reuse**: DynamoDB client singleton
- ✅ **Minimal dependencies**: Solo lo necesario

**Ejemplo en examen:**
> *"¿Cómo reducir cold starts en Lambda?"*
- Respuestas:
  - Aumentar memoria (CPU escala proporcionalmente)
  - Provisioned concurrency (costo extra)
  - Mantener conexiones warm (reutilizar clients)

---

#### ⚠️ **API Gateway Caching**
**Estado:** NO IMPLEMENTADO

**Ejemplo en examen:**
> *"¿Cómo reducir costos de Lambda si el API tiene muchas lecturas?"*
- Respuesta: Habilitar caching en API Gateway con TTL configurable

---

## 📊 Resumen de Cobertura

### ✅ Servicios AWS Implementados

| Servicio | Uso en el Proyecto | Coverage |
|----------|-------------------|----------|
| **Lambda** | 5 handlers (Create, Get, Update, Delete, List) | ✅✅✅ |
| **API Gateway** | REST API con 5 endpoints | ✅✅✅ |
| **DynamoDB** | Single-table design + GSI | ✅✅✅ |
| **CloudWatch Logs** | Logging estructurado | ✅✅ |
| **X-Ray** | Tracing habilitado | ✅ |
| **CDK** | Infrastructure as Code | ✅✅✅ |
| **SAM** | Local testing | ✅✅ |

### ✅ Patrones y Best Practices

| Patrón | Implementación |
|--------|----------------|
| Clean Architecture | ✅ Domain → Application → Infrastructure |
| Repository Pattern | ✅ Abstracción de DynamoDB |
| Dependency Injection | ✅ Interfaces en Domain |
| Factory Pattern | ✅ Response builders |
| DTO Pattern | ✅ Validación + tipos + OpenAPI |
| Error Handling | ✅ Centralizado con custom errors |
| Logging | ✅ CloudWatch Logger adapter |
| Testing | ✅ BDD con jest-cucumber |
| IaC | ✅ AWS CDK |
| Documentation | ✅ OpenAPI + Swagger UI |

---

## 🎓 Temas del Examen por Archivo

### Por Dominio de Negocio

#### **User Entity (Domain)**
- `src/domain/entities/User.ts` → Value Objects, Entity validation
- `src/domain/repositories/IUserRepository.ts` → Repository interface
- `src/domain/services/UserDomainService.ts` → Domain logic

#### **Use Cases (Application)**
- `src/application/use-cases/*.ts` → Use case pattern, business orchestration
- `src/application/dtos/*.ts` → DTO pattern, validation, OpenAPI

#### **Lambda Handlers (Infrastructure)**
- `src/infrastructure/lambda/handlers/*.ts` → Lambda, API Gateway, event processing
- `src/infrastructure/http/*.ts` → HTTP responses, error handling, CORS

#### **Data Access (Infrastructure)**
- `src/infrastructure/repositories/DynamoDBUserRepository.ts` → DynamoDB operations
- `src/infrastructure/adapters/*.ts` → Adapter pattern, CloudWatch

#### **Infrastructure (CDK)**
- `infrastructure/lib/user-service-stack.ts` → CloudFormation, CDK, resource creation

---

## 📝 Preguntas Típicas del Examen

### DynamoDB
1. ✅ ¿Query o Scan para búsqueda por email? → Query con GSI
2. ✅ ¿Cómo prevenir duplicados en create? → ConditionExpression
3. ✅ ¿Diferencia entre PK y SK? → PK distribuye, SK ordena
4. ✅ ¿Cómo paginar resultados? → LastEvaluatedKey como nextToken

### Lambda
1. ✅ ¿Firma de handler para API Gateway? → `(event, context) => Promise<result>`
2. ✅ ¿Timeout máximo para API Gateway síncrono? → 30 segundos
3. ✅ ¿Cómo reducir cold starts? → Más memoria, connection reuse
4. ✅ ¿Dónde leer secrets? → Secrets Manager, no env vars

### API Gateway
1. ✅ ¿Qué es Lambda Proxy Integration? → Lambda controla response completo
2. ✅ ¿Cómo habilitar CORS? → Headers en response + OPTIONS method
3. ✅ ¿Status code para crear recurso? → 201 Created
4. ✅ ¿Cómo cachear responses? → API Gateway cache per endpoint

### Security
1. ✅ ¿Cómo autorizar API Gateway? → Cognito, Lambda Authorizer, IAM
2. ✅ ¿Encripción en DynamoDB? → At rest por defecto, KMS opcional
3. ✅ ¿Dónde NO guardar secrets? → En código, en env vars de repo

### Deployment
1. ✅ ¿CDK vs CloudFormation? → CDK = programático, CF = declarativo
2. ✅ ¿Cómo testear Lambda localmente? → SAM CLI
3. ✅ ¿Qué incluir en deployment package? → Código + runtime deps

---

## 📌 Nota Final

Este microservicio (User Service) es el **primero de 10 microservicios** del plan completo de estudio para AWS Certified Developer Associate.

**Cobertura de este proyecto:**
- ✅ Repository Pattern
- ✅ Clean Architecture
- ✅ Lambda + API Gateway + DynamoDB
- ✅ Fundamentos de CRUD serverless
- ✅ Testing con BDD
- ✅ Infrastructure as Code (CDK)

**Los servicios NO cubiertos aquí** (SNS, SQS, Cognito, Step Functions, etc.) se implementarán en los **otros 9 microservicios** del plan de estudio.

---

**Microservicio**: 1 de 10 (User Service)
**Patrón**: Repository Pattern
**Versión**: v1.0 (Post Phase 9)
**Documento generado**: 2024-12-23
