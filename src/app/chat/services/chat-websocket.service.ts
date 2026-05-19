import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import type { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from '../../auth/services/auth.service';
import { ChatMessage, WebSocketNotification } from '../interfaces/chat-conversation.interface';

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {
  private readonly authService = inject(AuthService);

  private readonly connected = signal(false);
  private client: Client | null = null;
  private connecting = false;
  private readonly subscriptions = new Map<number, StompSubscription>();
  private readonly pendingSubscriptions = new Set<number>();

  private readonly messageCreated$ = new Subject<WebSocketNotification<ChatMessage>>();
  private readonly messageEdited$ = new Subject<WebSocketNotification<ChatMessage>>();
  private readonly messageDeleted$ = new Subject<WebSocketNotification<{ messageId: number; conversationId: number }>>();

  readonly isConnected = this.connected.asReadonly();

  // Abre la conexión WebSocket cuando el usuario ya tiene sesión iniciada.
  async conectar(): Promise<void> {
    if (this.client || this.connecting) {
      console.log('WebSocket already connected');
      return;
    }

    const token = this.authService.token();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    this.connecting = true;

    try {
      const { Client } = await import('@stomp/stompjs');
      const wsUrl = `ws://localhost:8081/ws?token=${encodeURIComponent(token)}`;

      const client = new Client({
        webSocketFactory: () => new WebSocket(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (message) => console.log('[STOMP]', message),
      });

      client.onConnect = () => {
        console.log('✓ Connected to WebSocket STOMP');
        this.connected.set(true);
        this.connecting = false;
        this.sincronizarSuscripciones();
      };

      client.onStompError = (frame) => {
        console.error('✗ STOMP error:', frame.headers['message'], frame.body);
        this.connected.set(false);
      };

      client.onWebSocketClose = () => {
        console.log('WebSocket closed');
        this.connected.set(false);
        this.client = null;
        this.connecting = false;
        this.subscriptions.clear();
      };

      client.onWebSocketError = (event) => {
        console.error('✗ WebSocket error:', event);
        this.connected.set(false);
      };

      this.client = client;
      client.activate();
    } catch (error) {
      console.error('Error creating WebSocket client:', error);
      this.connecting = false;
      this.connected.set(false);
    }
  }

  // Cierra la conexión y borra las suscripciones activas.
  desconectar(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();
    this.pendingSubscriptions.clear();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.connected.set(false);
    console.log('Disconnected from WebSocket');
  }

  // Se apunta al canal de una conversación concreta para recibir sus mensajes.
  suscribirseAConversacion(conversationId: number): Observable<WebSocketNotification<ChatMessage>> {
    this.pendingSubscriptions.add(conversationId);
    this.sincronizarSuscripciones();

    return this.messageCreated$.asObservable().pipe(
      filter((notification) => notification.payload.conversationId === conversationId),
    );
  }

  // Envía un mensaje nuevo al backend por STOMP.
  enviarMensaje(
    conversationId: number,
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' = 'TEXT',
    replyToMessageId: number | null = null,
  ): void {
    if (!this.client || !this.connected()) {
      console.error('WebSocket not connected, cannot send message');
      return;
    }

    this.client.publish({
      destination: `/app/message/send/${conversationId}`,
      body: JSON.stringify({
        content,
        messageType,
        replyToMessageId,
      }),
    });

    console.log(`✓ Message sent via STOMP to conversation ${conversationId}`);
  }

  // Edita un mensaje ya enviado.
  editarMensaje(conversationId: number, messageId: number, newContent: string): void {
    if (!this.client || !this.connected()) {
      console.error('WebSocket not connected, cannot edit message');
      return;
    }

    this.client.publish({
      destination: `/app/message/edit/${conversationId}`,
      body: JSON.stringify({
        messageId,
        newContent,
      }),
    });

    console.log(`✓ Message edited via STOMP in conversation ${conversationId}`);
  }

  // Elimina un mensaje de la conversación.
  eliminarMensaje(conversationId: number, messageId: number): void {
    if (!this.client || !this.connected()) {
      console.error('WebSocket not connected, cannot delete message');
      return;
    }

    this.client.publish({
      destination: `/app/message/delete/${conversationId}`,
      body: JSON.stringify({
        messageId,
      }),
    });

    console.log(`✓ Message deleted via STOMP in conversation ${conversationId}`);
  }

  // Notifica cuando llega un mensaje nuevo.
  onMensajeCreado(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageCreated$.asObservable();
  }

  // Notifica cuando se edita un mensaje.
  onMensajeEditado(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageEdited$.asObservable();
  }

  // Notifica cuando se elimina un mensaje.
  onMensajeEliminado(): Observable<WebSocketNotification<{ messageId: number; conversationId: number }>> {
    return this.messageDeleted$.asObservable();
  }

  // Sincroniza las conversaciones ya suscritas con la conexión actual.
  private sincronizarSuscripciones(): void {
    if (!this.client || !this.connected()) {
      return;
    }

    for (const conversationId of this.pendingSubscriptions) {
      if (this.subscriptions.has(conversationId)) {
        continue;
      }

      const subscription = this.client.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
        this.procesarMensajeWebSocket(message.body);
      });

      this.subscriptions.set(conversationId, subscription);
      console.log(`✓ Subscribed to conversation ${conversationId}`);
    }
  }

  // Convierte el JSON recibido en un evento de chat entendible por la app.
  private procesarMensajeWebSocket(data: string): void {
    try {
      const notification = JSON.parse(data) as WebSocketNotification<any>;
      console.log('📨 Message from WebSocket:', notification);

      switch (notification.type) {
        case 'MESSAGE_CREATED':
          this.messageCreated$.next(notification);
          break;
        case 'MESSAGE_EDITED':
          this.messageEdited$.next(notification);
          break;
        case 'MESSAGE_DELETED':
          this.messageDeleted$.next(notification);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
}
