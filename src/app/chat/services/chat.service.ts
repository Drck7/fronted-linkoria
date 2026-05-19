import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/services/auth.service';
import { ChatConversation, ChatMessage } from '../interfaces/chat-conversation.interface';
import { ChatHttpService } from './chat-http.service';
import { ChatWebSocketService } from './chat-websocket.service';

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
});

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly authService = inject(AuthService);
  private readonly httpService = inject(ChatHttpService);
  private readonly wsService = inject(ChatWebSocketService);

  private readonly conversationsSignal = signal<ChatConversation[]>([]);
  private readonly currentConversationSignal = signal<ChatConversation | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly conversations = computed(() => {
    return [...this.conversationsSignal()].sort((left, right) => {
      const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
      return rightTime - leftTime;
    });
  });

  readonly currentConversation = this.currentConversationSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    // Escuchar mensajes nuevos en tiempo real (solo si están disponibles)
    this.wsService.onMensajeCreado().subscribe((notification) => {
      this.handleNewMessage(notification.payload);
    });

    // Cargar conversaciones y conectar WebSocket cuando se autentica el usuario
    effect(() => {
      if (this.authService.authStatus() === 'authenticated') {
        this.loadConversations();
        // Conectar WebSocket cuando estemos autenticados
        this.wsService.conectar();
      }
    });
  }

  /**
   * Carga las conversaciones directas del usuario
   */
  loadConversations(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.httpService.getConversations().subscribe({
      next: (conversations) => {
        console.log('✓ Conversaciones cargadas:', conversations.length);
        this.conversationsSignal.set(
          conversations.map((conv) => this.formatConversation(conv))
        );
        this.loadingSignal.set(false);
      },
      error: (error) => {
        console.error('✗ Error loading conversations:', error);
        this.errorSignal.set('No se pudieron cargar las conversaciones');
        this.loadingSignal.set(false);
        this.conversationsSignal.set([]);
      },
    });
  }

  /**
   * Obtiene una conversación por ID
   */
  conversationById(conversationId: string | number | null): ChatConversation | null {
    if (!conversationId) {
      return null;
    }

    const id = typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId;
    return this.conversations().find((conversation) => conversation.id === id) ?? null;
  }

  /**
   * Primera conversación ordenada por tiempo
   */
  firstConversation(): ChatConversation | null {
    return this.conversations()[0] ?? null;
  }

  /**
   * Abre o crea una conversación directa con un usuario específico
   * Útil para cuando se clickea en un amigo y se quiere abrir el chat
   */
  openConversationWithUser(userId: string): Observable<ChatConversation> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.httpService.createOrGetConversation(userId).pipe(
      tap((conversation) => {
        const formattedConv = this.formatConversation(conversation);

        this.conversationsSignal.update((convs) => {
          const exists = convs.find((c) => c.id === formattedConv.id);
          if (exists) {
            return convs.map((c) => (c.id === formattedConv.id ? formattedConv : c));
          }

          return [formattedConv, ...convs];
        });

        this.currentConversationSignal.set(formattedConv);
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Carga los mensajes de una conversación
   */
  loadMessages(conversationId: number): void {
    this.loadingSignal.set(true);
    this.httpService.getMessages(conversationId).subscribe({
      next: (response) => {
        const conversation = this.conversationById(conversationId);
        if (conversation) {
          const updated = {
            ...conversation,
            messages: response.messages.map((msg) => this.formatMessage(msg)),
          };
          this.currentConversationSignal.set(updated);

          // Subscribirse a nuevos mensajes de esta conversación
          this.wsService.suscribirseAConversacion(conversationId);
        }
        this.loadingSignal.set(false);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.errorSignal.set('No se pudieron cargar los mensajes');
        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * Envía un mensaje (HTTP por ahora, WebSocket después)
   */
    sendMessage(conversationId: number, content: string): void {
    const text = content.trim();

    if (!text) {
      return;
    }

        this.wsService.enviarMensaje(conversationId, text, 'TEXT', null);
  }

  /**
   * Maneja nuevos mensajes que llegan por WebSocket
   */
  private handleNewMessage(message: ChatMessage): void {
    const conversation = this.conversationById(message.conversationId);

    if (!conversation) {
      return;
    }

    const currentUser = this.authService.user();
    const formattedMessage = this.formatMessage(message);

    if (this.currentConversationSignal()?.id === message.conversationId) {
      const current = this.currentConversationSignal();
      const currentMessages = current?.messages ?? [];
      const alreadyExists = currentMessages.some((existing) => existing.messageId === formattedMessage.messageId);

      if (current && !alreadyExists) {
        this.currentConversationSignal.set({
          ...current,
          messages: [...currentMessages, formattedMessage],
        });
      }
    }

    // Actualizar lista de conversaciones
    this.conversationsSignal.update((conversations) => {
      return conversations.map((conv) => {
        if (conv.id !== message.conversationId) {
          return conv;
        }

        return {
          ...conv,
          lastMessagePreview: message.content.substring(0, 50),
          lastMessageLabel: timeFormatter.format(new Date(message.createdAt)),
          lastMessageAt: message.createdAt,
          unreadCount:
            currentUser?.userId !== message.userId ? (conv.unreadCount ?? 0) + 1 : 0,
        };
      });
    });
  }

  /**
   * Formatea un mensaje del backend al formato frontend
   */
  private formatMessage(msg: ChatMessage): ChatMessage {
    const currentUser = this.authService.user();
    return {
      ...msg,
      isMine: msg.userId === currentUser?.userId,
      sentAtLabel: timeFormatter.format(new Date(msg.createdAt)),
    };
  }

  /**
   * Formatea una conversación del backend al formato frontend
   */
  private formatConversation(conv: ChatConversation): ChatConversation {
    return {
      ...conv,
      messages: conv.messages?.map((msg) => this.formatMessage(msg)) || [],
    };
  }
}
