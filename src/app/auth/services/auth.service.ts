import { computed, inject, Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { catchError, mapTo, Observable, of, tap } from 'rxjs'

// Estados posibles de autenticación
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated'
const baseUrl = 'http://localhost:8081/api/v1'

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
  private _token = signal<string | null>(null)

  private http = inject(HttpClient)

  authStatus= computed<AuthStatus>(() => {
    if(this._authStatus() === 'checking') return 'checking'
    if(this._user() === null) return 'not-authenticated'
    return 'authenticated'
  });

  user= computed(() => this._user());
  token= computed(() => this._token());

  private setSession(resp: AuthResponse) {
    this._user.set({
      userId: resp.userId,
      username: resp.username,
      tokenType: resp.tokenType
    });
    this._authStatus.set('authenticated');
    this._token.set(resp.accessToken);
    localStorage.setItem('token', resp.accessToken);
    localStorage.setItem('refreshToken', resp.refreshToken);
  }

  private clearSession() {
    this._user.set(null);
    this._authStatus.set('not-authenticated');
    this._token.set(null);
    localStorage.removeItem('token');
  }

  /**
   * Realiza el login del usuario con email y contraseña
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
    checkStatus():Observable<boolean> {
      const refreshToken = localStorage.getItem('refreshToken');
      if(!refreshToken) {
        this._authStatus.set('not-authenticated');
        return of(false);
      }

      return this.http.post<AuthResponse>(`${baseUrl}/auth/refresh`, {
        refreshToken
      }).pipe(
        tap(resp => this.setSession(resp)),
        mapTo(true),
        catchError(() => {
          this.clearSession();
          return of(false)
        })
      );
    }
}
