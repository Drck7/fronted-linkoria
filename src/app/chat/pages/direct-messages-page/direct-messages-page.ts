import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ChatConversation } from '../../interfaces/chat-conversation.interface';
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
  private lastLoadedConversationId: number | null = null;

  private readonly selectedParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('username'))),
    { initialValue: null },
  );

  readonly selectedConversation = computed<ChatConversation | null>(() => {
    const conversations = this.chatService.conversations();
    const param = this.selectedParam();

    if (!param) {
      return null;
    }

    const numericId = Number(param);
    if (!Number.isNaN(numericId)) {
      return conversations.find((conversation) => conversation.id === numericId) ?? null;
    }

    return conversations.find(
      (conversation) => conversation.participant?.username?.toLowerCase() === param.toLowerCase(),
    ) ?? null;
  });

  readonly activeConversation = computed(() => {
    const selectedConversation = this.selectedConversation();
    const currentConversation = this.chatService.currentConversation();

    if (currentConversation && selectedConversation && currentConversation.id === selectedConversation.id) {
      return currentConversation;
    }

    return selectedConversation;
  });

  readonly isLoading = this.chatService.isLoading;
  readonly error = this.chatService.error;

  constructor() {
    // Cargar mensajes solo cuando cambia la conversación seleccionada
    effect(() => {
      const conversation = this.selectedConversation();

      if (conversation && this.lastLoadedConversationId !== conversation.id) {
        this.lastLoadedConversationId = conversation.id;
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
