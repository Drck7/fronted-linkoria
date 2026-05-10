import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Subject, Observable, filter } from 'rxjs';
import { WebSocketNotification, ChatMessage } from '../interfaces/chat-conversation.interface';

/**
 * Servicio de WebSocket para comunicación en tiempo real de mensajes.
 * Usa STOMP sobre SockJS.
 *
 * Nota: Esta es una implementación básica que prepara la estructura.
 * La conexión real requiere una librería como 'stompjs' con 'sockjs-client'.
 */
@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {
  private readonly authService = inject(AuthService);

  private connected = signal(false);
  private stompClient: any = null;

  private messageCreated$ = new Subject<WebSocketNotification<ChatMessage>>();
  private messageEdited$ = new Subject<WebSocketNotification<ChatMessage>>();
  private messageDeleted$ = new Subject<WebSocketNotification<{ messageId: number; conversationId: number }>>();

  readonly isConnected = this.connected.asReadonly();

  /**
   * Conecta al WebSocket del servidor
   * Requiere token JWT válido del usuario autenticado
   */
  connect(): void {
    if (this.connected()) {
      return;
    }

    const token = this.authService.token();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    // NOTA: Para una implementación real, se debe instalar:
    // npm install stompjs sockjs-client
    // npm install --save-dev @types/stompjs @types/sockjs-client

    // Código de conexión (requiere las librerías mencionadas):
    // const Stomp = require('stompjs');
    // const SockJS = require('sockjs-client');
    //
    // const socket = new SockJS('/ws');
    // this.stompClient = Stomp.over(socket);
    //
    // this.stompClient.connect(
    //   { Authorization: `Bearer ${token}` },
    //   (frame: any) => {
    //     this.connected.set(true);
    //     console.log('Connected to WebSocket', frame);
    //   },
    //   (error: any) => {
    //     console.error('WebSocket connection error:', error);
    //     this.connected.set(false);
    //   }
    // );

    console.log('WebSocket connection not fully initialized (requires stompjs/sockjs-client)');
  }

  /**
   * Desconecta del WebSocket
   */
  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        this.connected.set(false);
        console.log('Disconnected from WebSocket');
      });
    }
  }

  /**
   * Se suscribe a los mensajes de una conversación específica
   */
  subscribeToConversation(conversationId: number): Observable<WebSocketNotification<ChatMessage>> {
    // NOTA: Para uso real, descomentar:
    // if (this.stompClient && this.stompClient.connected) {
    //   this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: any) => {
    //     const notification = JSON.parse(message.body) as WebSocketNotification<any>;
    //     switch (notification.type) {
    //       case 'MESSAGE_CREATED':
    //         this.messageCreated$.next(notification);
    //         break;
    //       case 'MESSAGE_EDITED':
    //         this.messageEdited$.next(notification);
    //         break;
    //       case 'MESSAGE_DELETED':
    //         this.messageDeleted$.next(notification);
    //         break;
    //     }
    //   });
    // }

    return this.messageCreated$.asObservable();
  }

  /**
   * Envía un mensaje a una conversación
   */
  sendMessage(
    conversationId: number,
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' = 'TEXT',
    replyToMessageId: number | null = null
  ): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      content,
      messageType,
      replyToMessageId,
    };

    // NOTA: Para uso real, descomentar:
    // this.stompClient.send(
    //   `/app/message/send/${conversationId}`,
    //   { 'Content-Type': 'application/json' },
    //   JSON.stringify(payload)
    // );

    console.log(
      `Message queued (WebSocket not fully connected): ${payload.content} to conversation ${conversationId}`
    );
  }

  /**
   * Edita un mensaje existente
   */
  editMessage(conversationId: number, messageId: number, newContent: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      messageId,
      newContent,
    };

    // NOTA: Para uso real, descomentar:
    // this.stompClient.send(
    //   `/app/message/edit/${conversationId}`,
    //   { 'Content-Type': 'application/json' },
    //   JSON.stringify(payload)
    // );
  }

  /**
   * Elimina un mensaje
   */
  deleteMessage(conversationId: number, messageId: number): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      messageId,
    };

    // NOTA: Para uso real, descomentar:
    // this.stompClient.send(
    //   `/app/message/delete/${conversationId}`,
    //   { 'Content-Type': 'application/json' },
    //   JSON.stringify(payload)
    // );
  }

  /**
   * Observable para mensajes creados
   */
  onMessageCreated(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageCreated$.asObservable();
  }

  /**
   * Observable para mensajes editados
   */
  onMessageEdited(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageEdited$.asObservable();
  }

  /**
   * Observable para mensajes eliminados
   */
  onMessageDeleted(): Observable<WebSocketNotification<{ messageId: number; conversationId: number }>> {
    return this.messageDeleted$.asObservable();
  }
}
