/**
 * Interfaz que representa la respuesta del endpoint de login
 * Los campos coinciden exactamente con lo que devuelve el API
 */
export interface AuthResponse {
  /** Token de acceso corta duracion (15 minutos) */
  accessToken: string;
  /** Token para renovar el acceso cuando expire (30 días) */
  refreshToken: string;
  /** Tipo de token (ej: "Bearer") */
  tokenType: string;
  /** ID unico del usuario autenticado */
  userId: string;
  /** Nombre de usuario */
  username: string;
}
