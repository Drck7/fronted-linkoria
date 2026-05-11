import { computed, inject, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { catchError, mapTo, Observable, of, tap } from 'rxjs'

// Estados posibles de autenticación.
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated'
// URL base del backend para auth y sesión.
const baseUrl = 'http://localhost:8081/api/v1'
// Clave usada para persistir el usuario autenticado en localStorage.
const userStorageKey = 'authUser'

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

/**
 * Servicio de autenticación
 * Gestiona el login, tokens y estado de autenticación del usuario
 */
@Injectable({providedIn: 'root'})
export class AuthService {
  // Signal para rastrear el estado de autenticación
  private _authStatus=signal<AuthStatus>('checking')
  // Signal para guardar datos del usuario autenticado
  private _user = signal<User | null>(null)
  // Signal para guardar el token de acceso
  private _token = signal<string | null>(localStorage.getItem('token') )

  private http = inject(HttpClient)

  authStatus= computed<AuthStatus>(() => {
    if(this._authStatus() === 'checking') return 'checking'
    if(this._user() === null) return 'not-authenticated'
    return 'authenticated'
  });

  user= computed(() => this._user());
  token= computed(() => this._token());

  /**
   * Actualiza los datos del usuario autenticado en memoria y en localStorage.
   * Se usa cuando el perfil propio cambia para reflejarlo también en el navbar.
   */
  updateCurrentUser(patch: Partial<User>) {
    const currentUser = this._user();

    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...patch,
    };

    this._user.set(updatedUser);
    localStorage.setItem(userStorageKey, JSON.stringify(updatedUser));
  }

  // Lee el usuario guardado en localStorage para restaurar la sesión tras recargar la app.
  private getStoredUser(): User | null {
    const userRaw = localStorage.getItem(userStorageKey);

    if (!userRaw) return null;

    try {
      return JSON.parse(userRaw) as User;
    } catch {
      localStorage.removeItem(userStorageKey);
      return null;
    }
  }

  // Guarda en memoria y en localStorage la sesión obtenida en login.
  private setSession(resp: AuthResponse) {
    const user: User = {
      userId: resp.userId,
      username: resp.username,
      tokenType: resp.tokenType
    };

    this._user.set(user);
    this._authStatus.set('authenticated');
    this._token.set(resp.accessToken);
    localStorage.setItem(userStorageKey, JSON.stringify(user));
    localStorage.setItem('token', resp.accessToken);
    localStorage.setItem('refreshToken', resp.refreshToken);
  }

  // Restaura el token nuevo devuelto por refresh sin perder el usuario ya guardado localmente.
  private setSessionFromRefresh(resp: RefreshResponse) {
    const storedUser = this.getStoredUser();

    this._user.set(storedUser);
    this._authStatus.set(storedUser ? 'authenticated' : 'not-authenticated');
    this._token.set(resp.accessToken);
    localStorage.setItem('token', resp.accessToken);
    localStorage.setItem('refreshToken', resp.refreshToken);
  }


  // Limpia por completo la sesión local cuando el usuario cierra sesión o el refresh falla.
  clearSession() {
    this._user.set(null);
    this._authStatus.set('not-authenticated');
    this._token.set(null);
    localStorage.removeItem(userStorageKey);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  /**
    * Realiza el login del usuario con email y contraseña.
    * Se usa en la pantalla de acceso para crear la sesión inicial.
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta del servidor
   */
  login(email: string, password: string):Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/auth/login`,{
      email:email,
      password:password }).pipe(
        tap(resp => this.setSession(resp)),
        mapTo(true),
        catchError((error: any)=>{
          this.clearSession();
          return of(false)
        })
      );
    }

    /**
     * Registra un usuario nuevo y deja la sesión iniciada si el backend responde con tokens.
     * Se usa en la pantalla de registro para evitar obligar al usuario a hacer login manual.
     */
    register(username: string, email: string, password: string): Observable<boolean> {
      return this.http.post<AuthResponse>(`${baseUrl}/auth/register`, {
        username,
        email,
        password
      }).pipe(
        tap(resp => this.setSession(resp)),
        mapTo(true),
        catchError(() => {
          this.clearSession();
          return of(false);
        })
      );
    }

    /**
     * Revalida la sesión al arrancar la app o al recargar la página.
     * Si existe refreshToken, pide un accessToken nuevo al backend.
     */
    checkStatus():Observable<boolean> {
      const refreshToken = localStorage.getItem('refreshToken');
      if(!refreshToken) {
        this.clearSession();
        return of(false);
      }

      return this.http.post<RefreshResponse>(`${baseUrl}/auth/refresh`, {
        refreshToken
      }).pipe(
        tap(resp => this.setSessionFromRefresh(resp)),
        mapTo(true),
        catchError(() => {
          this.clearSession();
          return of(false)
        })
      );
    }

}
