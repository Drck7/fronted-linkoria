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

  private readonly conversationId = toSignal(
    this.route.paramMap.pipe(map((params) => {
      const id = params.get('conversationId');
      return id ? parseInt(id, 10) : null;
    })),
    { initialValue: null },
  );

  readonly activeConversation = computed(() => {
    const selectedConversation = this.chatService.conversationById(this.conversationId());
    return selectedConversation ?? this.chatService.firstConversation();
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