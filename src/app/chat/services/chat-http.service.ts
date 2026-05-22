import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatConversation, ChatMessage } from '../interfaces/chat-conversation.interface';

const API_BASE_URL = 'http://localhost:8081/api/v1';

@Injectable({ providedIn: 'root' })
export class ChatHttpService {
  private readonly http = inject(HttpClient);

  /**
    * Obtiene todas las conversaciones directas del usuario autenticado.
   */
  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${API_BASE_URL}/conversations/dm`);
  }

  /**
    * Obtiene una conversación específica por ID.
   */
  getConversation(conversationId: number): Observable<ChatConversation> {
    return this.http.get<ChatConversation>(
      `${API_BASE_URL}/conversations/dm/${conversationId}`
    );
  }

  /**
   * Obtiene la conversación asociada a un canal de servidor.
   */
  getChannelConversation(channelId: number): Observable<ChatConversation> {
    return this.http.get<ChatConversation>(
      `${API_BASE_URL}/conversations/channel/${channelId}`
    );
  }

  /**
    * Crea o recupera una conversación directa con otro usuario.
   */
  createOrGetConversation(targetUserId: string): Observable<ChatConversation> {
    return this.http.post<ChatConversation>(`${API_BASE_URL}/conversations/dm`, {
      targetId: targetUserId,
    });
  }

  /**
    * Obtiene los mensajes de una conversación con paginación.
   * @param conversationId ID de la conversación
   * @param cursor ID del último mensaje visto (null para primera página)
   * @param limit Cantidad de mensajes a recuperar (default 50)
   * @param direction 'BACKWARDS' (atrás en el tiempo) o 'FORWARDS' (adelante)
   */
  getMessages(
    conversationId: number,
    cursor: number | null = null,
    limit: number = 50,
    direction: 'BACKWARDS' | 'FORWARDS' = 'BACKWARDS'
  ): Observable<{ messages: ChatMessage[]; hasMore: boolean; nextCursor: number | null }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      direction: direction,
    });

    if (cursor !== null) {
      params.append('cursor', cursor.toString());
    }

    return this.http.get<any>(
      `${API_BASE_URL}/conversations/${conversationId}/messages?${params.toString()}`
    );
  }

  /**
    * Obtiene el último mensaje de una conversación para mostrarlo como vista previa.
   */
  getLastMessage(conversationId: number): Observable<ChatMessage | null> {
    return this.http.get<ChatMessage | null>(
      `${API_BASE_URL}/conversations/${conversationId}/messages/last`
    );
  }

  /**
    * Envía un mensaje a una conversación.
   */
  sendMessage(
    conversationId: number,
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' = 'TEXT',
    replyToMessageId: number | null = null
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${API_BASE_URL}/conversations/${conversationId}/messages`,
      {
        content,
        messageType,
        replyToMessageId,
      }
    );
  }

  /**
    * Busca usuarios por nombre para iniciar nuevas conversaciones.
   */
  searchUsers(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/users/search?username=${username}`);
  }

  /**
    * Obtiene el perfil de un usuario específico.
   */
  getUser(userId: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/users/${userId}`);
  }
}
