import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Subject, Observable } from 'rxjs';
import { WebSocketNotification, ChatMessage } from '../interfaces/chat-conversation.interface';

/**
 * Servicio de WebSocket para comunicación en tiempo real de mensajes.
 * Usa WebSocket nativo del navegador.
 */
@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {
  private readonly authService = inject(AuthService);

  private connected = signal(false);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private messageCreated$ = new Subject<WebSocketNotification<ChatMessage>>();
  private messageEdited$ = new Subject<WebSocketNotification<ChatMessage>>();
  private messageDeleted$ = new Subject<WebSocketNotification<{ messageId: number; conversationId: number }>>();

  readonly isConnected = this.connected.asReadonly();

  connect(): void {
    if (this.connected() || this.ws) {
      return;
    }

    const token = this.authService.token();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    try {
      const wsUrl = `ws://localhost:8081/ws?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected.set(true);
        this.reconnectAttempts = 0;
        console.log('? Connected to WebSocket');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onerror = (error: Event) => {
        console.error('? WebSocket error:', error);
        this.connected.set(false);
      };

      this.ws.onclose = () => {
        this.connected.set(false);
        console.log('WebSocket closed');
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connected.set(false);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected.set(false);
      console.log('Disconnected from WebSocket');
    }
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const notification = JSON.parse(data) as WebSocketNotification<any>;
      console.log(`?? Message from WebSocket:`, notification);

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

  subscribeToConversation(conversationId: number): Observable<WebSocketNotification<ChatMessage>> {
    if (!this.connected()) {
      console.warn('WebSocket not connected, will retry when connected');
    }
    console.log(`?? Subscribed to conversation ${conversationId}`);
    return this.messageCreated$.asObservable();
  }

  sendMessage(conversationId: number, content: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' = 'TEXT', replyToMessageId: number | null = null): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot send message');
      return;
    }

    const message = {
      type: 'SEND_MESSAGE',
      conversationId,
      payload: { content, messageType, replyToMessageId },
    };

    this.ws.send(JSON.stringify(message));
    console.log(`?? Message sent via WebSocket to conversation ${conversationId}`);
  }

  editMessage(conversationId: number, messageId: number, newContent: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot edit message');
      return;
    }

    const message = { type: 'EDIT_MESSAGE', conversationId, payload: { messageId, newContent } };
    this.ws.send(JSON.stringify(message));
    console.log(`?? Message edited via WebSocket in conversation ${conversationId}`);
  }

  deleteMessage(conversationId: number, messageId: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot delete message');
      return;
    }

    const message = { type: 'DELETE_MESSAGE', conversationId, payload: { messageId } };
    this.ws.send(JSON.stringify(message));
    console.log(`??? Message deleted via WebSocket in conversation ${conversationId}`);
  }

  onMessageCreated(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageCreated$.asObservable();
  }

  onMessageEdited(): Observable<WebSocketNotification<ChatMessage>> {
    return this.messageEdited$.asObservable();
  }

  onMessageDeleted(): Observable<WebSocketNotification<{ messageId: number; conversationId: number }>> {
    return this.messageDeleted$.asObservable();
  }
}
