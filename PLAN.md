# Plan de Implementación: User Service - Microservicio 1

## 🎯 Objetivo
Implementar el primer microservicio (User Service) del plan de estudio para AWS Certified Developer Associate, siguiendo Clean Architecture con el patrón Repository. Este microservicio servirá como **template reutilizable** para los 9 microservicios restantes.

## 📋 Contexto
- **Patrón**: Repository Pattern
- **Arquitectura**: Clean Architecture (Domain → Application → Infrastructure)
- **Servicios AWS**: Lambda + API Gateway + DynamoDB
- **Dominios del examen**: 1.1, 1.3, 1.4
- **Estado actual**: Proyecto vacío con solo package.json básico

## 🏗️ Arquitectura Clean Architecture

```
Domain Layer (Business Logic)
    ↑
Application Layer (Use Cases)
    ↑
Infrastructure Layer (AWS Services, HTTP, Database)
```

**Principio clave**: Las dependencias apuntan hacia adentro. El dominio no conoce nada de AWS, Lambda o DynamoDB.

## 📁 Estructura del Proyecto

```
user-service/
├── src/
│   ├── domain/                    # Capa de negocio pura
│   │   ├── entities/
│   │   │   └── User.ts           # Entidad User con lógica de negocio
│   │   ├── repositories/
│   │   │   └── IUserRepository.ts # Interfaz del repositorio
│   │   ├── services/
│   │   │   └── UserDomainService.ts # Servicios de dominio
│   │   └── errors/
│   │       ├── UserNotFoundError.ts
│   │       └── DuplicateUserError.ts
│   │
│   ├── application/               # Casos de uso
│   │   ├── use-cases/
│   │   │   ├── CreateUserUseCase.ts
│   │   │   ├── GetUserUseCase.ts
│   │   │   ├── UpdateUserUseCase.ts
│   │   │   ├── DeleteUserUseCase.ts
│   │   │   └── ListUsersUseCase.ts
│   │   └── dtos/
│   │       ├── CreateUserDto.ts  # Con validación Zod
│   │       ├── UpdateUserDto.ts
│   │       └── UserResponseDto.ts
│   │
│   ├── infrastructure/            # Capa de infraestructura AWS
│   │   ├── handlers/              # Lambda handlers
│   │   │   ├── createUser.ts
│   │   │   ├── getUser.ts
│   │   │   ├── updateUser.ts
│   │   │   ├── deleteUser.ts
│   │   │   └── listUsers.ts
│   │   ├── repositories/
│   │   │   └── DynamoDBUserRepository.ts # Implementación concreta
│   │   ├── adapters/
│   │   │   └── CloudWatchLogger.ts
│   │   ├── http/
│   │   │   ├── apiResponse.ts    # Respuestas estandarizadas
│   │   │   └── errorHandler.ts   # Manejo centralizado de errores
│   │   ├── swagger/
│   │   │   ├── swaggerGenerator.ts  # Generador de OpenAPI desde Zod
│   │   │   └── swaggerHandler.ts    # Handler para servir UI de Swagger
│   │   └── config/
│   │       └── awsConfig.ts
│   │
│   └── shared/                    # Utilidades compartidas
│       ├── logger/
│       │   ├── ILogger.ts
│       │   └── Logger.ts
│       ├── validators/
│       │   └── SchemaValidator.ts
│       └── utils/
│           ├── dateUtils.ts
│           └── idGenerator.ts
│
├── infrastructure/                # CDK Infrastructure as Code
│   ├── bin/
│   │   └── app.ts
│   ├── lib/
│   │   ├── stacks/
│   │   │   └── UserServiceStack.ts
│   │   └── constructs/
│   │       ├── LambdaConstruct.ts
│   │       └── ApiGatewayConstruct.ts
│   └── cdk.json
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── integration/
│   └── helpers/
│
├── docs/
│   └── openapi.json              # OpenAPI 3.0 spec generada
│
├── tsconfig.json
├── tsconfig.cdk.json
├── jest.config.js
├── .eslintrc.json
├── PLAN.md                        # Este archivo
└── package.json
```

## 🔄 Orden de Implementación

### Fase 0: Configuración Base (7 archivos)
**Objetivo**: Establecer la base del proyecto TypeScript

1. **tsconfig.json** - Configuración TypeScript con path aliases
2. **tsconfig.cdk.json** - Configuración para CDK
3. **jest.config.js** - Configuración de tests con 80% coverage
4. **.eslintrc.json** - Linting
5. **.gitignore** - Ignorar archivos generados
6. **package.json** - Actualizar con dependencias y scripts
7. **README.md** - Documentación inicial

**Configuraciones clave**:
- Path aliases: `@domain/*`, `@application/*`, `@infrastructure/*`, `@shared/*`
- Módulos CommonJS para compatibilidad con Lambda
- Coverage threshold: 80%

### Fase 1: Domain Layer (5 archivos)
**Objetivo**: Implementar la lógica de negocio pura (sin dependencias AWS)

1. **domain/errors/UserNotFoundError.ts**
2. **domain/errors/DuplicateUserError.ts**
3. **domain/entities/User.ts**
   - Propiedades: id, email, firstName, lastName, createdAt, updatedAt
   - Factory method: `User.create()`
   - Business method: `updateProfile()`
   - Validación interna
4. **domain/repositories/IUserRepository.ts**
   - Interfaz con métodos: create, findById, findByEmail, update, delete, findAll
5. **domain/services/UserDomainService.ts**
   - `isEmailUnique()` - Valida unicidad de email

**Principio**: Esta capa NO conoce DynamoDB, Lambda o HTTP. Es TypeScript puro.

### Fase 2: Shared Utilities (6 archivos)
**Objetivo**: Crear utilidades reutilizables

1. **shared/logger/ILogger.ts** - Interfaz de logging
2. **shared/logger/Logger.ts** - Implementación console logger
3. **shared/validators/SchemaValidator.ts** - Wrapper de Zod
4. **shared/utils/dateUtils.ts** - Utilidades de fecha
5. **shared/utils/idGenerator.ts** - Generación de UUIDs
6. **shared/types/common.ts** - Tipos comunes

### Fase 3: Application Layer (8 archivos)
**Objetivo**: Implementar casos de uso que orquestan el dominio

1. **application/dtos/CreateUserDto.ts** - Con schema Zod
2. **application/dtos/UpdateUserDto.ts** - Con schema Zod
3. **application/dtos/UserResponseDto.ts** - Con UserMapper
4. **application/use-cases/CreateUserUseCase.ts**
   - Valida email único
   - Crea entidad User
   - Persiste vía repository
5. **application/use-cases/GetUserUseCase.ts**
6. **application/use-cases/UpdateUserUseCase.ts**
7. **application/use-cases/DeleteUserUseCase.ts**
8. **application/use-cases/ListUsersUseCase.ts** - Con paginación

**Patrón**: Cada use case tiene un método `execute()` y recibe dependencias vía constructor.

### Fase 4: Infrastructure - Repository (2 archivos)
**Objetivo**: Implementar persistencia con DynamoDB

1. **infrastructure/repositories/DynamoDBUserRepository.ts**
   - Implementa `IUserRepository`
   - Single-table design: PK=`USER#<id>`, SK=`PROFILE`
   - GSI para búsqueda por email: GSI1PK=`EMAIL#<email>`
   - Usa AWS SDK v3 (DocumentClient)
   - Convierte entre entidad User y DynamoDB items
2. **infrastructure/adapters/CloudWatchLogger.ts**
   - Implementa `ILogger`
   - Logs estructurados en JSON

### Fase 5: Infrastructure - HTTP Layer (3 archivos)
**Objetivo**: Crear utilidades HTTP para Lambda

1. **infrastructure/http/apiResponse.ts**
   - Métodos: `success()`, `created()`, `error()`, `noContent()`
   - Headers CORS
   - Formato estandarizado de respuestas
2. **infrastructure/http/errorHandler.ts**
   - Mapea errores de dominio a HTTP status codes
   - UserNotFoundError → 404
   - DuplicateUserError → 409
   - ZodError → 400
3. **infrastructure/config/awsConfig.ts**
   - Lee variables de entorno
   - Configuración de región, tabla, stage

### Fase 6: Infrastructure - Lambda Handlers (5 archivos)
**Objetivo**: Crear handlers Lambda (capa adaptadora delgada)

1. **infrastructure/handlers/createUser.ts** - POST /users
2. **infrastructure/handlers/getUser.ts** - GET /users/{id}
3. **infrastructure/handlers/updateUser.ts** - PUT /users/{id}
4. **infrastructure/handlers/deleteUser.ts** - DELETE /users/{id}
5. **infrastructure/handlers/listUsers.ts** - GET /users

**Patrón de Handler**:
```typescript
// Inicializar dependencias fuera del handler (singleton)
const logger = new CloudWatchLogger('HandlerName');
const repository = new DynamoDBUserRepository(tableName, logger);
const useCase = new CreateUserUseCase(repository, domainService, logger);

export const handler = async (event) => {
  try {
    // 1. Parsear y validar entrada
    const dto = SchemaValidator.validate(Schema, body);

    // 2. Ejecutar caso de uso
    const result = await useCase.execute(dto);

    // 3. Mapear a DTO de respuesta
    const response = Mapper.toResponseDto(result);

    // 4. Retornar respuesta HTTP
    return ApiResponse.success(response);
  } catch (error) {
    return ErrorHandler.handle(error, logger);
  }
};
```

### Fase 7: CDK Infrastructure (5 archivos)
**Objetivo**: Definir infraestructura AWS como código

1. **infrastructure/cdk.json** - Configuración CDK
2. **infrastructure/lib/constructs/LambdaConstruct.ts**
   - Factory reutilizable para funciones Lambda
   - Configuración común: runtime, timeout, memory, tracing
3. **infrastructure/lib/constructs/ApiGatewayConstruct.ts**
   - Factory reutilizable para REST API
   - CORS, logging, access logs
4. **infrastructure/lib/stacks/UserServiceStack.ts**
   - DynamoDB Table con GSI
   - 5 funciones Lambda
   - API Gateway con rutas
   - Permisos IAM
   - Outputs (API URL, Table Name)
5. **infrastructure/bin/app.ts** - Entry point CDK

**Recursos AWS**:
- **DynamoDB Table**: `user-service-{stage}`
  - Partition Key: PK (String)
  - Sort Key: SK (String)
  - GSI1: GSI1PK, GSI1SK (para búsqueda por email)
  - Billing: PAY_PER_REQUEST
- **Lambda Functions**: 5 funciones (CRUD + List)
  - Runtime: Node.js 20.x
  - Memory: 256 MB
  - Timeout: 30s
  - X-Ray tracing: ACTIVE
- **API Gateway**: REST API
  - Stage: dev/prod
  - CORS enabled
  - CloudWatch logs
  - Routes:
    - POST /users
    - GET /users
    - GET /users/{id}
    - PUT /users/{id}
    - DELETE /users/{id}

### Fase 8: Testing (12+ archivos)
**Objetivo**: Tests unitarios e integración (>80% coverage)

**Tests Unitarios**:
1. domain/entities/User.test.ts
2. domain/services/UserDomainService.test.ts
3. application/use-cases/CreateUserUseCase.test.ts
4. application/use-cases/GetUserUseCase.test.ts
5. application/use-cases/UpdateUserUseCase.test.ts
6. application/use-cases/DeleteUserUseCase.test.ts
7. infrastructure/repositories/DynamoDBUserRepository.test.ts (mock DynamoDB)
8. infrastructure/http/apiResponse.test.ts
9. infrastructure/http/errorHandler.test.ts

**Tests de Integración**:
10. integration/handlers/createUser.test.ts
11. integration/handlers/getUser.test.ts

**Test Helpers**:
12. helpers/testData.ts - Factories de datos mock
13. helpers/mockRepository.ts - Mock del repositorio

### Fase 9: Documentación Swagger/OpenAPI (3 archivos)
**Objetivo**: Generar documentación interactiva de la API con Swagger UI

1. **infrastructure/swagger/swaggerGenerator.ts**
   - Genera OpenAPI 3.0 spec desde Zod schemas
   - Usa `zod-to-openapi` para conversión automática
   - Define metadata de la API (info, servers, security)
   - Genera docs/openapi.json

2. **infrastructure/swagger/swaggerHandler.ts**
   - Lambda handler para servir Swagger UI
   - GET /api-docs → Sirve HTML con Swagger UI
   - GET /api-docs/openapi.json → Sirve spec OpenAPI
   - Usa CDN para assets de Swagger UI

3. **docs/openapi.json**
   - Especificación OpenAPI 3.0 generada
   - Incluye todos los endpoints, schemas, responses
   - Compatible con Swagger UI, Postman, OpenAPI Generator

**Beneficios**:
- ✅ Documentación siempre sincronizada con el código (generada desde Zod)
- ✅ UI interactiva para probar la API
- ✅ Exportable a Postman collections
- ✅ Validación automática de requests/responses

### Fase 10: Documentación General (4 archivos)
**Objetivo**: Documentación completa del proyecto

1. **README.md** - Setup, desarrollo, deployment, API docs con link a Swagger
2. **ARCHITECTURE.md** - Explicación de Clean Architecture, patrones, decisiones
3. **.env.example** - Template de variables de entorno
4. **docs/exam-mapping.md** - Mapeo a dominios del examen

## 📦 Dependencias (package.json)

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x",
    "aws-lambda": "^1.0.7",
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "@asteasolutions/zod-to-openapi": "^7.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.130",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "aws-cdk-lib": "^2.120.0",
    "constructs": "^10.0.0",
    "eslint": "^8.50.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.3.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "swagger:generate": "ts-node src/infrastructure/swagger/swaggerGenerator.ts",
    "cdk:synth": "cdk synth --app 'npx ts-node --project tsconfig.cdk.json infrastructure/bin/app.ts'",
    "cdk:deploy:dev": "cdk deploy UserServiceStack-Dev",
    "cdk:destroy:dev": "cdk destroy UserServiceStack-Dev"
  }
}
```

## 🎯 Conceptos Clave del Examen

### Domain 1.1: Develop code for applications on AWS
- ✅ Lambda function handlers
- ✅ Dependency injection pattern
- ✅ Error handling en Lambda
- ✅ Environment variables

### Domain 1.3: Use data stores in development
- ✅ DynamoDB single-table design
- ✅ Primary keys y Sort keys
- ✅ Global Secondary Index (GSI)
- ✅ Query vs Scan
- ✅ Conditional writes
- ✅ Pay-per-request billing

### Domain 1.4: Develop code for APIs
- ✅ REST API con API Gateway
- ✅ Lambda integration
- ✅ Path parameters
- ✅ Query string parameters
- ✅ HTTP status codes (200, 201, 204, 400, 404, 409, 500)
- ✅ CORS configuration
- ✅ Request/Response mapping
- ✅ **API Documentation con OpenAPI/Swagger**

### Conceptos Adicionales
- ✅ **Clean Architecture**: Separación de capas
- ✅ **Repository Pattern**: Abstracción de datos
- ✅ **Use Case Pattern**: Lógica de aplicación
- ✅ **Dependency Inversion**: Interfaces en dominio
- ✅ **DTO Pattern**: Data Transfer Objects
- ✅ **Error Handling**: Mapeo de errores
- ✅ **Structured Logging**: CloudWatch logs en JSON
- ✅ **X-Ray Tracing**: Observabilidad distribuida
- ✅ **Infrastructure as Code**: CDK
- ✅ **Testing**: Unit + Integration tests
- ✅ **API Documentation**: OpenAPI 3.0 + Swagger UI
- ✅ **Schema-First Development**: Zod → OpenAPI

## 🚀 Workflow de Desarrollo

1. **Setup**:
   ```bash
   npm install
   ```

2. **Desarrollo**:
   ```bash
   npm run build
   npm run test
   npm run lint
   npm run swagger:generate  # Genera OpenAPI spec
   ```

3. **Deploy**:
   ```bash
   npm run build
   npm run swagger:generate  # Regenerar antes de deploy
   npm run cdk:deploy:dev
   ```

4. **Acceder a Swagger UI**:
   ```bash
   # Después del deploy, acceder a:
   https://API_URL/api-docs
   ```

5. **Test API**:
   ```bash
   # Opción 1: Usar Swagger UI (interactivo)
   # Ir a https://API_URL/api-docs

   # Opción 2: curl
   curl -X POST https://API_URL/users \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","firstName":"John","lastName":"Doe"}'

   # Opción 3: Importar a Postman
   # Importar desde https://API_URL/api-docs/openapi.json
   ```

## ⚠️ Desafíos y Soluciones

### 1. Path Aliases en Lambda
**Problema**: TypeScript path aliases no funcionan en JavaScript compilado.

**Solución**:
- Usar `esbuild` para bundling
- O incluir todas las dependencias en el deployment package

### 2. Cold Starts
**Problema**: Inicialización de dependencias en cada cold start.

**Solución**:
- Inicializar dependencias fuera del handler (singleton)
- Considerar provisioned concurrency para prod

### 3. DynamoDB Local Testing
**Problema**: Costos de testing contra DynamoDB real.

**Solución**:
- Unit tests con mocks
- Integration tests con DynamoDB Local

## 📝 Checklist de Verificación

- [ ] `npm install` completa sin errores
- [ ] `npm run build` compila TypeScript
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run test` logra >80% coverage
- [ ] `npm run swagger:generate` genera docs/openapi.json
- [ ] `npm run cdk:synth` genera template CloudFormation
- [ ] Domain layer tiene cero dependencias externas
- [ ] Todos los use cases siguen SRP (Single Responsibility)
- [ ] Repository interface en domain, implementación en infrastructure
- [ ] Error handling cubre todos los errores de dominio
- [ ] API responses siguen formato estandarizado
- [ ] DynamoDB table design soporta todas las queries
- [ ] Lambda handlers son adaptadores delgados
- [ ] Tests cubren happy path y error scenarios
- [ ] Swagger UI accesible en /api-docs
- [ ] OpenAPI spec válida y completa
- [ ] Documentación completa

## 🔄 Reutilización para Otros Microservicios

### Copiar Directamente:
- Toda la configuración (tsconfig, jest, eslint)
- Estructura de carpetas completa
- Shared utilities
- Infrastructure HTTP utilities
- CDK constructs (LambdaConstruct, ApiGatewayConstruct)
- Patrones de testing

### Personalizar por Servicio:
- Domain entities
- Repository interfaces
- Use cases
- DTOs y schemas de validación
- Lambda handlers
- Stack name y recursos AWS
- DynamoDB table design (PK/SK específico)

## 📚 Archivos Críticos

**Top 5 archivos más importantes**:

1. **src/domain/entities/User.ts** - Modelo de negocio core
2. **src/domain/repositories/IUserRepository.ts** - Contrato de datos
3. **src/application/use-cases/CreateUserUseCase.ts** - Patrón de caso de uso
4. **src/infrastructure/repositories/DynamoDBUserRepository.ts** - Implementación AWS
5. **infrastructure/lib/stacks/UserServiceStack.ts** - Infraestructura completa

## ✅ Resultado Esperado

Al finalizar tendremos:
- ✅ Microservicio completo con CRUD de usuarios
- ✅ Clean Architecture implementada correctamente
- ✅ Tests con >80% coverage
- ✅ Infraestructura CDK deployable
- ✅ API REST funcional
- ✅ **Documentación interactiva con Swagger UI**
- ✅ **Especificación OpenAPI 3.0 generada automáticamente desde Zod**
- ✅ Logging estructurado en CloudWatch
- ✅ Template reutilizable para los próximos 9 microservicios
- ✅ Conocimiento práctico de los dominios 1.1, 1.3, 1.4 del examen

## 📅 Tiempo Estimado

- **Día 1** (4 horas): Fases 0-3 (Config + Domain + Shared + Application)
- **Día 2** (4-5 horas): Fases 4-7 (Infrastructure + CDK + Deploy)
- **Día 3** (2-3 horas): Fases 8-10 (Tests + Swagger + Documentation)

**Total**: 2-3 días según el plan de estudio

---

## 📝 Registro de Progreso (Log de Implementación)

### ✅ Fase 0: Configuración Base - COMPLETADA

#### Paso 1: Instalación de dependencias con pnpm ✅
```bash
cd user-service
pnpm install
```
**Resultado**: Todas las dependencias instaladas correctamente (513 packages)

#### Paso 2: Generar tsconfig.json con TypeScript ✅
```bash
npx tsc --init
```
**Resultado**: Archivo generado y ajustado con:
- ✅ CommonJS (compatibilidad con Lambda)
- ✅ Path aliases (@domain/*, @application/*, @infrastructure/*, @shared/*)
- ✅ Strict mode activado
- ✅ Target ES2022

#### Paso 3: Generar jest.config.js ✅
```bash
npx jest --init
```
**Resultado**: Archivo generado y configurado con:
- ✅ Preset ts-jest
- ✅ Path aliases para Clean Architecture
- ✅ Coverage threshold de 80%
- ✅ Test environment: node

#### Paso 4: Generar eslint.config.mjs ✅
```bash
npx eslint --init
```
**Resultado**: Archivo generado (formato moderno .mjs) y configurado con:
- ✅ TypeScript ESLint con configuración recomendada
- ✅ Reglas personalizadas para el proyecto
- ✅ Ignora archivos generados (dist, cdk.out, coverage)
- ✅ Entorno Node.js

#### Paso 5: Crear tsconfig.cdk.json ✅
**Nota**: No existe comando de generación automática para este archivo. Se crea manualmente.
```bash
# Creado con herramienta Write (no hay comando oficial)
```
**Resultado**: Archivo creado que extiende tsconfig.json con:
- ✅ Configuración específica para CDK
- ✅ Include infrastructure/**/*
- ✅ rootDir ajustado a "."

#### Paso 6: Crear .gitignore ✅
**Resultado**: Archivo creado con:
- ✅ Ignora node_modules, dist, coverage, cdk.out
- ✅ Ignora archivos de entorno (.env)
- ✅ Ignora archivos de IDE y OS
- ✅ Ignora logs y archivos temporales

#### Paso 7: Crear README.md ✅
**Resultado**: Documentación inicial creada con:
- ✅ Descripción del proyecto y objetivos
- ✅ Arquitectura Clean Architecture
- ✅ Instrucciones de instalación y desarrollo
- ✅ Endpoints de la API
- ✅ Scripts disponibles
- ✅ Conceptos del examen AWS cubiertos

---

### ✅ **Fase 0 COMPLETADA**

**Resumen de archivos creados:**
1. ✅ package.json (actualizado con dependencias y scripts)
2. ✅ tsconfig.json (TypeScript para Lambda + Clean Architecture)
3. ✅ jest.config.js (Testing con 80% coverage)
4. ✅ eslint.config.mjs (Linting para TypeScript)
5. ✅ tsconfig.cdk.json (TypeScript para CDK)
6. ✅ .gitignore (Archivos a ignorar)
7. ✅ README.md (Documentación del proyecto)

**Estado**: Base del proyecto completamente configurada y lista para comenzar la implementación.

---

### 🚀 Siguiente: Fase 1 - Domain Layer
Implementar entidades, repositorios, y servicios de dominio...
