import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/services/auth.service';
import { ChatConversation, ChatMessage } from '../interfaces/chat-conversation.interface';
import { ChatHttpService } from './chat-http.service';
import { ChatWebSocketService } from './chat-websocket.service';


type BackendConversation = ChatConversation & {
  targetId?: string;
  targetUsername?: string;
  targetIconUrl?: string | null;
};

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

  /**
   * Devuelve la ruta de navegación para una conversación directa.
   */
  getConversationRoute(conversation: ChatConversation): string[] {
    const username = conversation.participant?.username?.trim();
    return username ? ['/chat', username] : [];
  }  
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
    return (
      this.conversations().find((conversation) => conversation.id === id) ??
      (this.currentConversationSignal()?.id === id ? this.currentConversationSignal() : null)
    );
  }

  /**
   * Limpia la conversación activa actual.
   */
  clearCurrentConversation(): void {
    this.currentConversationSignal.set(null);
  }

  /**
   * Reemplaza la conversación activa visible.
   */
  replaceCurrentConversation(conversation: ChatConversation): void {
    this.currentConversationSignal.set(conversation);

    this.conversationsSignal.update((conversations) => {
      return conversations.map((existing) => (existing.id === conversation.id ? { ...existing, ...conversation } : existing));
    });
  }

  /**
   * Devuelve la primera conversación ordenada por tiempo.
   */
  firstConversation(): ChatConversation | null {
    return this.conversations()[0] ?? null;
  }

  /**
   * Abre o crea una conversación directa con un usuario específico.
   * Se usa cuando se selecciona un amigo desde la interfaz.
   */
  openConversationWithUser(userId: string): Observable<ChatConversation> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.httpService.createOrGetConversation(userId).pipe(
      map((conversation) => this.formatConversation(conversation)),
      tap((formattedConv) => {

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
    * Abre la conversación asociada a un canal de servidor.
   */
  openChannelConversation(channelId: number): Observable<ChatConversation> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.httpService.getChannelConversation(channelId).pipe(
      map((conversation) => this.formatConversation(conversation)),
      tap((formattedConversation) => {
        this.currentConversationSignal.set(formattedConversation);
        this.loadingSignal.set(false);
      }),
    );
  }

  /**
    * Carga los mensajes de una conversación y suscribe el canal en tiempo real.
   */
  loadMessages(conversationId: number): void {
    this.loadingSignal.set(true);
    this.httpService.getMessages(conversationId).subscribe({
      next: (response) => {
        const conversation = this.conversationById(conversationId);
        if (conversation) {
          const mensajesOrdenados = this.ordenarMensajesCronologicos(
            response.messages.map((msg) => this.formatMessage(msg)),
          );

          const updated = {
            ...conversation,
            messages: mensajesOrdenados,
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
    * Envía un mensaje por STOMP a la conversación activa.
   */
    sendMessage(conversationId: number, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT'): void {
    const text = content.trim();

    if (!text) {
      return;
    }

      this.wsService.enviarMensaje(conversationId, text, messageType, null);
  }

  /**
       * Maneja los mensajes nuevos que llegan por WebSocket.
   */
  private handleNewMessage(message: ChatMessage): void {
    const currentUser = this.authService.user();
    const formattedMessage = this.formatMessage(message);
    const currentConversation = this.currentConversationSignal();

    if (currentConversation?.id === message.conversationId) {
      const current = currentConversation;
      const currentMessages = current?.messages ?? [];
      const alreadyExists = currentMessages.some((existing) => existing.messageId === formattedMessage.messageId);

      if (current && !alreadyExists) {
        const mensajesOrdenados = this.ordenarMensajesCronologicos([
          ...currentMessages,
          formattedMessage,
        ]);

        this.currentConversationSignal.set({
          ...current,
          messages: mensajesOrdenados,
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
          lastMessagePreview: this.obtenerVistaPreviaMensaje(message),
          lastMessageLabel: timeFormatter.format(new Date(message.createdAt)),
          lastMessageAt: message.createdAt,
          unreadCount:
            currentUser?.userId !== message.userId ? (conv.unreadCount ?? 0) + 1 : 0,
        };
      });
    });
  }

  /**
    * Convierte un mensaje del backend al formato que usa el frontend.
   */
  private formatMessage(msg: ChatMessage): ChatMessage {
    const currentUser = this.authService.user();
    // Ensure authorName is correct for messages sent by the current user
    const authorName = msg.userId === currentUser?.userId ? currentUser?.username ?? msg.authorName : msg.authorName;

    return {
      ...msg,
      authorName,
      isMine: msg.userId === currentUser?.userId,
      sentAtLabel: timeFormatter.format(new Date(msg.createdAt)),
    };
  }

  /**
    * Convierte una conversación del backend al formato que usa el frontend.
   */
  private formatConversation(conv: ChatConversation): ChatConversation {
    const backendConversation = conv as BackendConversation;
    const participant = conv.participant
      ? conv.participant
      : backendConversation.targetUsername
        ? {
            userId: backendConversation.targetId ?? '',
            username: backendConversation.targetUsername,
            email: '',
            avatarUrl: backendConversation.targetIconUrl ?? undefined,
            isActive: false,
            createdAt: conv.createdAt,
            updatedAt: conv.createdAt,
          }
        : undefined;

    return {
      ...conv,
      participant,
      messages: this.ordenarMensajesCronologicos(
        conv.messages?.map((msg) => this.formatMessage(msg)) || [],
      ),
    };
  }

  /**
    * Ordena los mensajes del más antiguo al más reciente.
   */
  private ordenarMensajesCronologicos(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }

  // Genera una vista previa compacta que no muestre una URL cruda para mensajes multimedia.
  private obtenerVistaPreviaMensaje(message: ChatMessage): string {
    switch (message.messageType) {
      case 'IMAGE':
        return 'Imagen';
      case 'FILE':
        return 'Archivo';
      case 'VIDEO':
        return 'Video';
      case 'AUDIO':
        return 'Audio';
      default:
        return message.content.substring(0, 50);
    }
  }
}
