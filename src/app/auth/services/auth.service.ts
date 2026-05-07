import { computed, inject,Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { catchError, mapTo, Observable, of, tap } from 'rxjs';

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
        tap(resp=>
        {
          // Guardar datos del usuario en el signal
          this._user.set({
            userId: resp.userId,
            username: resp.username,
            tokenType: resp.tokenType
          });
          // Cambiar estado a autenticado
          this._authStatus.set('authenticated');
          // Guardar el access token en el signal (acceso corta duración)
          this._token.set(resp.accessToken);
          // Persistir tokens en localStorage para mantener sesión
          localStorage.setItem('token',resp.accessToken);        // Token de acceso
          localStorage.setItem('refreshToken',resp.refreshToken); // Token para renovar
        }
        ),
        mapTo(true),
        catchError((error: any)=>{
          this._user.set(null);
          this._authStatus.set('not-authenticated');
          this._token.set(null);
          return of(false)
        })
      );
    }
}
