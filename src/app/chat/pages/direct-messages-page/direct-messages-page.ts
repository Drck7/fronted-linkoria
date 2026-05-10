import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ChatComposerComponent } from '../../components/chat-composer/chat-composer';
import { ChatThreadComponent } from '../../components/chat-thread/chat-thread';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-direct-messages-page',
  imports: [ChatThreadComponent, ChatComposerComponent, RouterLink],
  templateUrl: './direct-messages-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectMessagesPage {
  readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly route = inject(ActivatedRoute);

  private readonly selectedUsername = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('username'))),
    { initialValue: null },
  );

  readonly activeConversation = computed(() => {
    const param = this.selectedUsername();
    if (param) {
      // Primero intentar por username
      const byUsername = this.chatService.conversations().find(
        (conv) => conv.participant?.username === param
      );
      if (byUsername) {
        return byUsername;
      }

      // Si no hay username, intentar tratar el param como ID numérico
      const id = Number(param);
      if (!Number.isNaN(id)) {
        const byId = this.chatService.conversations().find((conv) => conv.id === id);
        if (byId) {
          return byId;
        }
      }

      // No se encontró; devolver null para mostrar estado vacío
      return null;
    }

    return this.chatService.firstConversation();
  });

  readonly isLoading = this.chatService.isLoading;
  readonly error = this.chatService.error;

  constructor() {
    // Cargar mensajes cuando cambia la conversación activa
    effect(() => {
      const conversation = this.activeConversation();
      if (conversation) {
        this.chatService.loadMessages(conversation.id);
      }
    });
  }

  sendMessage(content: string): void {
    const conversation = this.activeConversation();

    if (!conversation) {
      return;
    }

    this.chatService.sendMessage(conversation.id, content);
  }
}
