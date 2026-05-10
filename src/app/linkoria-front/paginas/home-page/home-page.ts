import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FriendshipService } from '../../../shared/services/friendship.service';
import { ChatService } from '../../../chat/services/chat.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly friendshipService = inject(FriendshipService);
  private readonly chatService = inject(ChatService);
  private readonly router = inject(Router);

  searchText: string = '';

  /**
   * Filtra amigos según el texto de búsqueda
   */
  get amigosFiltrados() {
    return this.friendshipService.friends().filter((amigo) =>
      amigo.username.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  /**
   * Al clickear en un amigo, abre el chat con él
   */
  abrirChat(userId: string): void {
    this.chatService.openConversationWithUser(userId).subscribe({
      next: (conversation) => {
        const username = conversation.participant?.username;
        const target = username ?? (conversation.id ? String(conversation.id) : null);
        if (target) {
          this.router.navigate(['/chat', target]);
        } else {
          this.router.navigate(['/chat']);
        }
      },
      error: (error) => {
        console.error('Error opening conversation from home:', error);
      },
    });
  }

  /**
   * Navega a la página de búsqueda de usuarios para añadir amigos
   */
  irAAnadirAmigos(): void {
    this.router.navigate(['/users/search']);
  }
}
