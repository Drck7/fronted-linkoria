import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const API_BASE_URL = 'http://localhost:8081/api/v1';

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  status?: 'online' | 'idle' | 'offline';
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchUserResult {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  status?: 'online' | 'idle' | 'offline';
  createdAt: string;
  updatedAt: string;
}

interface RawUserResponse {
  userId?: string | number;
  id?: string | number;
  user_id?: string | number;
  username?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
  status?: 'online' | 'idle' | 'offline' | string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Obtiene el perfil de un usuario específico
   */
  getUserProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE_URL}/users/${userId}`);
  }

  /**
   * Busca usuarios por nombre
   */
  searchUsers(username: string): Observable<SearchUserResult[]> {
    return this.http.get<RawUserResponse[]>(`${API_BASE_URL}/users/search?username=${username}`).pipe(
      map((users) =>
        users.map((user, index) => ({
          userId: String(user.userId ?? user.id ?? user.user_id ?? `user-${index}`),
          username: user.username ?? 'Usuario',
          email: user.email ?? '',
          avatarUrl: user.avatarUrl,
          isActive: user.isActive ?? false,
          status: user.status as 'online' | 'idle' | 'offline' | undefined,
          createdAt: user.createdAt ?? '',
          updatedAt: user.updatedAt ?? '',
        }))
      )
    );
  }

  /**
   * Obtiene todos los usuarios (si existe el endpoint)
   */
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE_URL}/users`);
  }
}
