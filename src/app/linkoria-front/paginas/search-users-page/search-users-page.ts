import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, SearchUserResult } from '../../../shared/services/user.service';
import { FriendshipService } from '../../../shared/services/friendship.service';
import { signal, computed } from '@angular/core';

@Component({
  selector: 'app-search-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-users-page.html',
})
export class SearchUsersPage {
  private readonly userService = inject(UserService);
  readonly friendshipService = inject(FriendshipService);
  private readonly router = inject(Router);

  readonly searchText = signal('');
  readonly searchResults = signal<SearchUserResult[]>([]);
  readonly isSearching = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadingRequestForUser = signal<string | null>(null);

  readonly filteredResults = computed(() => {
    const query = this.searchText().toLowerCase();
    if (!query) return [];
    return this.searchResults().filter(
      (user) =>
        user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  });

  /**
   * Busca usuarios según el texto
   */
  searchUsers(): void {
    const query = this.searchText().trim();

    if (!query || query.length < 2) {
      this.searchResults.set([]);
      this.error.set('Escribe al menos 2 caracteres');
      return;
    }

    this.isSearching.set(true);
    this.error.set(null);

    this.userService.searchUsers(query).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);

        if (results.length === 0) {
          this.error.set('No se encontraron usuarios');
        }
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.error.set('Error al buscar usuarios');
        this.isSearching.set(false);
      },
    });
  }

  /**
   * Obtiene el estado de amistad del usuario
   */
  getFriendshipStatus(userId: string): 'amigos' | 'solicitud-enviada' | 'solicitud-recibida' | 'no-amigos' {
    if (this.friendshipService.isFriend(userId)) {
      return 'amigos';
    }

    if (this.friendshipService.hasPendingSentRequest(userId)) {
      return 'solicitud-enviada';
    }

    if (this.friendshipService.hasPendingReceivedRequest(userId)) {
      return 'solicitud-recibida';
    }

    return 'no-amigos';
  }

  /**
   * Envía una solicitud de amistad
   */
  addFriend(userId: string): void {
    this.loadingRequestForUser.set(userId);

    this.friendshipService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.loadingRequestForUser.set(null);
      },
      error: (error) => {
        console.error('Error sending friend request:', error);
        this.loadingRequestForUser.set(null);
        this.error.set('Error al enviar solicitud');
      },
    });
  }

  /**
   * Acepta una solicitud de amistad
   */
  acceptFriendRequest(userId: string): void {
    this.loadingRequestForUser.set(userId);

    this.friendshipService.acceptFriendRequest(userId).subscribe({
      next: () => {
        this.loadingRequestForUser.set(null);
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
        this.loadingRequestForUser.set(null);
        this.error.set('Error al aceptar solicitud');
      },
    });
  }

  /**
   * Vuelve a la página anterior
   */
  goBack(): void {
    this.router.navigate(['/']);
  }
}
