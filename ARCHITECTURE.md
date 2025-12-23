# Arquitectura del User Service

Este documento explica las decisiones arquitectónicas del User Service, primer microservicio del proyecto de certificación AWS Certified Developer Associate.

## Índice

- [Visión General](#visión-general)
- [Clean Architecture](#clean-architecture)
- [Patrones de Diseño](#patrones-de-diseño)
- [Estructura de Capas](#estructura-de-capas)
- [Decisiones Técnicas](#decisiones-técnicas)
- [DynamoDB Design](#dynamodb-design)
- [Testing Strategy](#testing-strategy)

## Visión General

El User Service es un microservicio serverless para gestión de usuarios (CRUD completo) que implementa Clean Architecture con el patrón Repository.

### Stack Tecnológico

- **Compute**: AWS Lambda (Node.js 20.x)
- **API**: API Gateway (REST API)
- **Database**: DynamoDB (NoSQL, single-table design)
- **Infrastructure**: AWS CDK (TypeScript)
- **Language**: TypeScript 5.x
- **Testing**: Jest + jest-cucumber (BDD)
- **Validation**: Zod
- **Documentation**: OpenAPI 3.0 + Swagger UI

## Clean Architecture

### Principios Fundamentales

La arquitectura sigue los principios de Clean Architecture (Uncle Bob):

1. **Separación de capas**: Domain → Application → Infrastructure
2. **Dependency Rule**: Las dependencias apuntan hacia adentro
3. **Independence**: El dominio no conoce nada de AWS, Lambda o DynamoDB
4. **Testability**: Cada capa es fácilmente testeable de forma aislada

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  (Lambda Handlers, DynamoDB, API Gateway, HTTP)             │
│  - Adapta requests HTTP a casos de uso                      │
│  - Implementa interfaces de repositories                    │
│  - Maneja errores y los mapea a HTTP status codes          │
└──────────────────┬──────────────────────────────────────────┘
                   │ Depende de ↓
┌──────────────────▼──────────────────────────────────────────┐
│                   Application Layer                          │
│  (Use Cases, DTOs, Validators)                              │
│  - Orquesta la lógica de negocio                            │
│  - Valida inputs con Zod                                    │
│  - Coordina entre dominio y repository                      │
└──────────────────┬──────────────────────────────────────────┘
                   │ Depende de ↓
┌──────────────────▼──────────────────────────────────────────┐
│                    Domain Layer                              │
│  (Entities, Repositories Interfaces, Domain Services)       │
│  - Lógica de negocio pura (TypeScript puro)                │
│  - NO conoce AWS, Lambda, DynamoDB, HTTP                    │
│  - Define contratos (interfaces) pero no implementaciones   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de una Request

```
1. API Gateway recibe HTTP Request
   ↓
2. Lambda Handler (Infrastructure)
   - Parsea event.body
   - Valida con Zod schema
   ↓
3. Use Case (Application)
   - Recibe DTO validado
   - Ejecuta lógica de negocio
   - Llama al repository
   ↓
4. Repository (Infrastructure)
   - Implementa IUserRepository (Domain)
   - Traduce entre entidad User y DynamoDB items
   - Ejecuta queries/scans en DynamoDB
   ↓
5. Domain Entity (Domain)
   - Entidad User con lógica de negocio
   - Validaciones de dominio
   ↓
6. Repository retorna User al Use Case
   ↓
7. Use Case retorna User al Handler
   ↓
8. Handler mapea User → UserResponseDto
   ↓
9. Handler retorna HTTP Response con JSON
```

## Patrones de Diseño

### 1. Repository Pattern

**Problema**: Desacoplar la lógica de negocio de la persistencia de datos.

**Solución**:
- Interfaz `IUserRepository` en Domain Layer
- Implementación `DynamoDBUserRepository` en Infrastructure Layer
- El dominio trabaja con la interfaz, no con la implementación

```typescript
// Domain: Define el contrato
export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  // ...
}

// Infrastructure: Implementa el contrato
export class DynamoDBUserRepository implements IUserRepository {
  // Implementación específica de DynamoDB
}
```

**Beneficios**:
- Fácil cambiar de DynamoDB a otra base de datos
- Tests unitarios con mocks simples
- Dominio independiente de AWS

### 2. Use Case Pattern

**Problema**: Organizar la lógica de aplicación de forma cohesiva.

**Solución**: Cada operación es un use case independiente con un método `execute()`.

```typescript
export class CreateUserUseCase {
  constructor(
    private readonly repository: IUserRepository,
    private readonly domainService: UserDomainService,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Validar email único
    // 2. Crear entidad User
    // 3. Persistir en repository
    // 4. Mapear a DTO de respuesta
  }
}
```

**Beneficios**:
- Single Responsibility Principle
- Fácil de testear
- Reutilizable

### 3. DTO Pattern (Data Transfer Objects)

**Problema**: Separar la estructura de datos del API de las entidades de dominio.

**Solución**:
- DTOs de entrada con validación Zod (`CreateUserDto`, `UpdateUserDto`)
- DTOs de salida con Mapper (`UserResponseDto`)

**Beneficios**:
- Validación explícita de entrada
- API estable aunque cambie el dominio
- Type-safe

### 4. Dependency Injection

**Problema**: Acoplamiento fuerte entre componentes.

**Solución**: Inyección por constructor en todos los use cases.

```typescript
// Lambda handler inicializa dependencias
const repository = new DynamoDBUserRepository(tableName, logger);
const domainService = new UserDomainService(repository);
const useCase = new CreateUserUseCase(repository, domainService, logger);

// Use case recibe dependencias, no las crea
```

**Beneficios**:
- Fácil testing con mocks
- Bajo acoplamiento
- Configuración flexible

### 5. Factory Pattern

**Problema**: Creación compleja de entidades con validación.

**Solución**: Factory methods en la entidad User.

```typescript
export class User {
  // Crear nueva instancia
  static create(props: CreateUserProps): User { }

  // Reconstituir desde DB
  static reconstitute(props: UserProps): User { }
}
```

## Estructura de Capas

### Domain Layer (`src/domain/`)

**Responsabilidad**: Lógica de negocio pura.

**Componentes**:
- `entities/User.ts`: Entidad User con validaciones de negocio
- `repositories/IUserRepository.ts`: Interfaz del repositorio
- `services/UserDomainService.ts`: Servicios de dominio (validación email único)
- `errors/`: Errores de dominio custom

**Reglas**:
- ✅ TypeScript puro (sin dependencias externas)
- ❌ NO imports de AWS SDK, Lambda, HTTP
- ❌ NO conoce DynamoDB, API Gateway

### Application Layer (`src/application/`)

**Responsabilidad**: Orquestar casos de uso.

**Componentes**:
- `use-cases/`: Casos de uso (CreateUser, GetUser, etc.)
- `dtos/`: DTOs con validación Zod
- Mappers para convertir entidades a DTOs

**Reglas**:
- ✅ Puede usar domain entities e interfaces
- ✅ Validación de entrada con Zod
- ❌ NO conoce detalles de HTTP o DynamoDB

### Infrastructure Layer (`src/infrastructure/`)

**Responsabilidad**: Adaptadores externos (AWS, HTTP).

**Componentes**:
- `lambda/handlers/`: Lambda handlers (entrada HTTP)
- `repositories/`: Implementaciones de repositories (DynamoDB)
- `http/`: Utilidades HTTP (ApiResponse, ErrorHandler)
- `adapters/`: Adaptadores externos (CloudWatch)
- `swagger/`: Documentación OpenAPI

**Reglas**:
- ✅ Implementa interfaces del dominio
- ✅ Maneja detalles de AWS SDK
- ✅ Transforma entre HTTP y domain

### Shared Layer (`src/shared/`)

**Responsabilidad**: Utilidades reutilizables.

**Componentes**:
- `logger/`: Interfaz y implementación de logging
- `validators/`: Wrapper de Zod
- `utils/`: Utilidades (fechas, IDs, etc.)

## Decisiones Técnicas

### ¿Por qué Clean Architecture?

1. **Longevidad**: Fácil migrar de Lambda a contenedores o viceversa
2. **Testabilidad**: 90%+ coverage con tests rápidos (sin AWS)
3. **Reusabilidad**: Template para los 9 microservicios restantes
4. **Aprendizaje**: Arquitectura profesional, no toy project

### ¿Por qué TypeScript sobre JavaScript?

1. **Type Safety**: Errores en compile-time, no runtime
2. **IDE Support**: Autocompletado, refactoring
3. **Documentación viva**: Los tipos documentan el código
4. **Examen AWS**: TypeScript es cada vez más común en proyectos reales

### ¿Por qué Zod sobre otros validadores?

1. **Type Inference**: Tipos TypeScript automáticos desde schemas
2. **OpenAPI Integration**: Conversión a OpenAPI 3.0
3. **Developer Experience**: API intuitiva y errores claros
4. **Schema-First**: El schema es la fuente de verdad

### ¿Por qué DynamoDB sobre RDS?

1. **Serverless**: Sin gestión de servidores
2. **Escalabilidad**: Auto-scaling infinito
3. **Examen AWS**: Dominio 1.3 del examen (NoSQL)
4. **Costo**: Pay-per-request en desarrollo

### ¿Por qué REST API sobre HTTP API?

1. **Examen AWS**: REST API tiene más features para el examen
2. **Request Validation**: Validación en API Gateway
3. **Authorizers**: Cognito, Lambda authorizers
4. **Usage Plans**: Throttling, API keys

## DynamoDB Design

### Single-Table Design

**Decisión**: Una sola tabla DynamoDB para el User Service.

```
Table: UserService-Users

PK          | SK          | GSI1PK        | GSI1SK        | email     | firstName | ...
------------|-------------|---------------|---------------|-----------|-----------|----
USER        | usr_<uuid>  | EMAIL#<email> | EMAIL#<email> | john@...  | John      | ...
```

### Access Patterns

| Pattern | Method | Keys | Notes |
|---------|--------|------|-------|
| Get user by ID | Query | PK=USER, SK=usr_{id} | Primary access |
| Get user by email | Query GSI1 | GSI1PK=EMAIL#{email} | Email lookup |
| List all users | Scan | PK=USER | Pagination |
| Create user | PutItem | Conditional: attribute_not_exists(PK) | Prevent duplicates |
| Update user | UpdateItem | PK=USER, SK=usr_{id} | Partial update |
| Delete user | DeleteItem | PK=USER, SK=usr_{id} | Hard delete |

### GSI (Global Secondary Index)

**Purpose**: Búsqueda rápida por email.

```
GSI1:
  - Partition Key: GSI1PK (EMAIL#<email>)
  - Sort Key: GSI1SK (EMAIL#<email>)
  - Projection: ALL attributes
```

**Why**:
- Email es unique constraint de negocio
- Query en GSI es O(1), scan es O(n)
- CreateUser necesita verificar email duplicado

## Testing Strategy

### BDD con jest-cucumber

**Decisión**: Usar Behavior-Driven Development con Gherkin.

**Estructura**:
```
tests/
├── unit/
│   └── application/
│       └── use-cases/
│           ├── create-user.feature          # Gherkin scenarios
│           └── CreateUserUseCase.test.ts    # Step definitions
├── fixtures/
│   └── userFixtures.ts                      # Builder & Factory
└── helpers/
    └── mocks.ts                             # Mock functions
```

**Ejemplo de test**:
```gherkin
Feature: Create User

  Scenario: Successfully create a user with valid data
    Given valid user data with email "john@example.com", firstName "John", and lastName "Doe"
    And no user exists with that email
    When I execute the CreateUser use case
    Then a new user should be created
    And the user should have the correct email
```

**Beneficios**:
- Tests legibles para no programadores
- Especificación ejecutable
- Documentación viva del comportamiento

### Coverage Objetivo: 80%+

**Actual**: 90.88% (superado el objetivo)

**Qué testeamos**:
- ✅ Application Layer (use cases) - 96.73%
- ✅ Domain Layer (entities, services) - Indirectamente via use cases
- ✅ Shared utilities - 76-100%

**Qué NO testeamos**:
- ❌ Infrastructure Layer (DynamoDB, Lambda handlers)
- ❌ CDK infrastructure

**Razón**: Testear infrastructure requiere integration tests con DynamoDB Local o mocks complejos. Para este proyecto de estudio, priorizamos unit tests rápidos.

## Próximos Pasos

Para mejorar la arquitectura en producción:

1. **Agregar Integration Tests**: Tests con DynamoDB Local
2. **Implementar Circuit Breaker**: Resilencia ante fallos
3. **Agregar Caching**: ElastiCache o DynamoDB DAX
4. **Authentication**: AWS Cognito
5. **Observability**: CloudWatch Dashboards, X-Ray tracing
6. **CI/CD**: GitHub Actions para deployment automático

---

**Versión**: 1.0.0
**Última actualización**: 2024-12-22
**Autor**: Dev Team
