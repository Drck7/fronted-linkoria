import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

const API_BASE_URL = 'http://localhost:8081/api/v1';

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  senderUsername?: string;
  receiverUsername?: string;
}

export interface FriendUser {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  subtitle?: string;
  status?: 'online' | 'idle' | 'offline';
  createdAt: string;
  updatedAt: string;
}

interface RawFriendUser {
  userId?: string | number;
  id?: string | number;
  user_id?: string | number;
  username?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
  subtitle?: string;
  status?: 'online' | 'idle' | 'offline' | string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawFriendship {
  id?: string | number;
  senderId?: string | number;
  receiverId?: string | number;
  sender_id?: string | number;
  receiver_id?: string | number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  senderUsername?: string;
  receiverUsername?: string;
}

@Injectable({ providedIn: 'root' })
export class FriendshipService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly friendsSignal = signal<FriendUser[]>([]);
  private readonly pendingSentSignal = signal<Friendship[]>([]);
  private readonly pendingReceivedSignal = signal<Friendship[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly friends = this.friendsSignal.asReadonly();
  readonly pendingSent = this.pendingSentSignal.asReadonly();
  readonly pendingReceived = this.pendingReceivedSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly hasFriends = computed(() => this.friendsSignal().length > 0);

  constructor() {
    // Auto-cargar amigos cuando se autentica
    effect(() => {
      if (this.authService.authStatus() === 'authenticated') {
        this.loadFriends();
        this.loadPendingRequests();
      }
    });
  }

  /**
   * Carga la lista de amigos del usuario autenticado
   */
  loadFriends(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<RawFriendUser[]>(`${API_BASE_URL}/friendships/friends`).subscribe({
      next: (friends) => {
        this.friendsSignal.set(
          friends.map((friend, index) => ({
            userId: String(friend.userId ?? friend.id ?? friend.user_id ?? `friend-${index}`),
            username: friend.username ?? 'Amigo',
            email: friend.email ?? '',
            avatarUrl: friend.avatarUrl,
            isActive: friend.isActive ?? false,
            subtitle: friend.subtitle,
            status: friend.status as 'online' | 'idle' | 'offline' | undefined,
            createdAt: friend.createdAt ?? '',
            updatedAt: friend.updatedAt ?? '',
          }))
        );
        this.loadingSignal.set(false);
      },
      error: (error) => {
        console.error('Error loading friends:', error);
        this.errorSignal.set('No se pudieron cargar los amigos');
        this.loadingSignal.set(false);
        this.friendsSignal.set([]);
      },
    });
  }

  /**
   * Carga solicitudes de amistad pendientes
   */
  loadPendingRequests(): void {
    this.http.get<RawFriendship[]>(`${API_BASE_URL}/friendships/pending/sent`).subscribe({
      next: (sent) =>
        this.pendingSentSignal.set(
          sent.map((request, index) => ({
            id: String(request.id ?? `sent-${index}`),
            senderId: String(request.senderId ?? request.sender_id ?? ''),
            receiverId: String(request.receiverId ?? request.receiver_id ?? ''),
            status: request.status ?? 'PENDING',
            createdAt: request.createdAt ?? '',
            updatedAt: request.updatedAt ?? '',
            senderUsername: request.senderUsername,
            receiverUsername: request.receiverUsername,
          }))
        ),
      error: (error) => console.error('Error loading pending sent:', error),
    });

    this.http.get<RawFriendship[]>(`${API_BASE_URL}/friendships/pending/received`).subscribe({
      next: (received) =>
        this.pendingReceivedSignal.set(
          received.map((request, index) => ({
            id: String(request.id ?? `received-${index}`),
            senderId: String(request.senderId ?? request.sender_id ?? ''),
            receiverId: String(request.receiverId ?? request.receiver_id ?? ''),
            status: request.status ?? 'PENDING',
            createdAt: request.createdAt ?? '',
            updatedAt: request.updatedAt ?? '',
            senderUsername: request.senderUsername,
            receiverUsername: request.receiverUsername,
          }))
        ),
      error: (error) => console.error('Error loading pending received:', error),
    });
  }

  /**
   * Envía solicitud de amistad
   */
  sendFriendRequest(targetId: string): Observable<Friendship> {
    return this.http
      .post<Friendship>(`${API_BASE_URL}/friendships`, {
        targetId,
        targetUserId: targetId,
      })
      .pipe(
        tap(() => {
          this.loadPendingRequests();
        })
      );
  }

  /**
   * Acepta una solicitud de amistad
   */
  acceptFriendRequest(targetId: string): Observable<Friendship> {
    return this.http
      .patch<Friendship>(`${API_BASE_URL}/friendships/${targetId}/accept`, {})
      .pipe(
        tap(() => {
          this.loadFriends();
          this.loadPendingRequests();
        })
      );
  }

  /**
   * Rechaza una solicitud de amistad
   */
  declineFriendRequest(targetId: string): Observable<Friendship> {
    return this.http
      .patch<Friendship>(`${API_BASE_URL}/friendships/${targetId}/decline`, {})
      .pipe(
        tap(() => {
          this.loadPendingRequests();
        })
      );
  }

  /**
   * Elimina un amigo
   */
  removeFriend(targetId: string): Observable<Friendship> {
    return this.http
      .patch<Friendship>(`${API_BASE_URL}/friendships/${targetId}/remove`, {})
      .pipe(
        tap(() => {
          this.loadFriends();
        })
      );
  }

  /**
   * Verifica si un usuario es amigo
   */
  isFriend(userId: string): boolean {
    return this.friendsSignal().some((friend) => friend.userId === userId);
  }

  /**
   * Verifica si hay solicitud pendiente enviada
   */
  hasPendingSentRequest(userId: string): boolean {
    return this.pendingSentSignal().some((f) => f.receiverId === userId);
  }

  /**
   * Verifica si hay solicitud pendiente recibida
   */
  hasPendingReceivedRequest(userId: string): boolean {
    return this.pendingReceivedSignal().some((f) => f.senderId === userId);
  }
}
