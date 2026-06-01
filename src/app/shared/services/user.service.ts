import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Base URL del backend para todas las llamadas relacionadas con usuarios.
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

export interface UpdateUserProfileRequest {
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
}

function normalizeUser(rawUser: RawUserResponse, fallbackId: string): UserProfile {
  return {
    userId: String(rawUser.userId ?? rawUser.id ?? rawUser.user_id ?? fallbackId),
    username: rawUser.username ?? 'Usuario',
    email: rawUser.email ?? '',
    avatarUrl: rawUser.avatarUrl,
    isActive: rawUser.isActive ?? false,
    status: rawUser.status as 'online' | 'idle' | 'offline' | undefined,
    bio: rawUser.bio,
    createdAt: rawUser.createdAt ?? '',
    updatedAt: rawUser.updatedAt ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Obtiene el perfil de un usuario específico
   */
  getUserProfile(userId: string): Observable<UserProfile> {
    return this.http.get<RawUserResponse>(`${API_BASE_URL}/users/${userId}`).pipe(
      map((user) => normalizeUser(user, userId))
    );
  }

  /**
   * Actualiza los campos editables del perfil de usuario.
   */
  updateUserProfile(userId: string, payload: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http.patch<RawUserResponse>(`${API_BASE_URL}/users/${userId}`, payload).pipe(
      map((user) => normalizeUser(user, userId))
    );
  }

  /**
   * Busca usuarios por nombre
   */
  searchUsers(username: string): Observable<SearchUserResult[]> {
    return this.http.get<RawUserResponse[]>(`${API_BASE_URL}/users/search?username=${username}`).pipe(
      map((users) => users.map((user, index) => normalizeUser(user, `user-${index}`)))
    );
  }

  /**
   * Obtiene todos los usuarios (si existe el endpoint)
   */
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE_URL}/users`);
  }
}
