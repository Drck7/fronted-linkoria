/**
 * Interfaz que representa los datos del usuario autenticado
 * Se almacena en el signal this._user del AuthService
 */
export interface User {
  /** ID unico del usuario */
  userId: string;
  /** Nombre de usuario para mostrar en la interfaz */
  username: string;
  /** URL del avatar del usuario */
  avatarUrl?: string;
  /** Breve biografía del usuario */
  bio?: string;
  /** Tipo de autenticacion (ej: "Bearer") */
  tokenType: string;

  // Campos opcionales que puedas necesitar agregar después:
  // email?: string;              // Email del usuario
  // fullName?: string;           // Nombre completo
  // isActive?: boolean;          // Estado de la cuenta
  // roles?: string[];            // Roles de autorización
}
