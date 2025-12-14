/**
 * User Entity - Domain Layer
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Desarrollo de aplicaciones
 * - Entidad de dominio pura (sin dependencias de AWS)
 * - Lógica de negocio encapsulada
 * - Validaciones de dominio
 *
 * Clean Architecture: Esta entidad NO conoce nada sobre DynamoDB, Lambda o AWS
 */

export interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly _id: string;
  private _email: string;
  private _firstName: string;
  private _lastName: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Factory method para crear un nuevo usuario
   * 📚 EXAMEN: Validaciones de negocio en el dominio
   */
  public static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }): User {
    const now = new Date();

    return new User({
      id: '', // Se generará en la capa de aplicación
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      isActive: props.isActive !== undefined ? props.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method para reconstruir usuario desde base de datos
   * 📚 EXAMEN: Separación entre creación y reconstrucción
   */
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // ============================================
  // Getters (Encapsulación)
  // ============================================

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // Domain Logic (Business Rules)
  // ============================================

  /**
   * Nombre completo del usuario
   * 📚 EXAMEN: Lógica de negocio en la entidad
   */
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  /**
   * Actualizar información del usuario
   * 📚 EXAMEN: Métodos de negocio que mantienen la consistencia
   */
  public update(props: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }): void {
    if (props.email !== undefined) {
      this.validateEmail(props.email);
      this._email = props.email;
    }

    if (props.firstName !== undefined) {
      this.validateName(props.firstName, 'First name');
      this._firstName = props.firstName;
    }

    if (props.lastName !== undefined) {
      this.validateName(props.lastName, 'Last name');
      this._lastName = props.lastName;
    }

    this._updatedAt = new Date();
  }

  /**
   * Activar usuario
   * 📚 EXAMEN: Estado del dominio manejado por métodos
   */
  public activate(): void {
    if (this._isActive) {
      throw new Error('User is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Desactivar usuario
   * 📚 EXAMEN: Validaciones de estado
   */
  public deactivate(): void {
    if (!this._isActive) {
      throw new Error('User is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }

  // ============================================
  // Domain Validations
  // ============================================

  /**
   * Validar email
   * 📚 EXAMEN: Validaciones de dominio (no solo formato)
   */
  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    // Validación básica de formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validación de longitud
    if (email.length > 255) {
      throw new Error('Email is too long (max 255 characters)');
    }
  }

  /**
   * Validar nombre
   * 📚 EXAMEN: Validaciones específicas de negocio
   */
  private validateName(name: string, fieldName: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }

    if (name.length < 2) {
      throw new Error(`${fieldName} must be at least 2 characters`);
    }

    if (name.length > 50) {
      throw new Error(`${fieldName} is too long (max 50 characters)`);
    }

    // Solo letras, espacios y algunos caracteres especiales
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!nameRegex.test(name)) {
      throw new Error(`${fieldName} contains invalid characters`);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Convertir a objeto plano (para serialización)
   * 📚 EXAMEN: DTOs y mappers (separación de capas)
   */
  public toObject(): UserProps {
    return {
      id: this._id,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Comparar igualdad (por ID)
   * 📚 EXAMEN: Value Objects y Entity equality
   */
  public equals(other: User): boolean {
    if (!other) return false;
    return this._id === other._id;
  }
}
