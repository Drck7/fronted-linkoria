import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ChatService } from '../../../chat/services/chat.service';
import { ChatConversation } from '../../../chat/interfaces/chat-conversation.interface';

@Component({
  selector: 'messages-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './messages-navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesNavbar {
  private readonly chatService = inject(ChatService);

  readonly conversations = this.chatService.conversations;

  // Construye la ruta del chat usando el username; si no existe, abre la vista general.
  rutaConversacion(conversation: ChatConversation): string[] {
    const username = conversation.participant?.username?.trim();
    return username ? ['/chat', username] : ['/chat'];
  }

  // Devuelve el nombre visible de la conversación; si no hay username, no muestra texto.
  nombreConversacion(conversation: ChatConversation): string {
    return conversation.participant?.username?.trim() ?? '';
  }
}
