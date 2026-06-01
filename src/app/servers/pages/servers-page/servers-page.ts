import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ChatComposerComponent } from '../../../chat/components/chat-composer/chat-composer';
import { ChatThreadComponent } from '../../../chat/components/chat-thread/chat-thread';
import { ChatService } from '../../../chat/services/chat.service';
import { ServersService } from '../../services/servers.service';
import { ChannelList } from '../../components/channel-list/channel-list';
import { MembersList } from '../../components/members-list/members-list';

@Component({
  selector: 'servers-page',
  standalone: true,
  imports: [CommonModule, ChannelList, MembersList, ChatThreadComponent, ChatComposerComponent],
  templateUrl: './servers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage implements OnInit {
  private readonly authService = inject(AuthService);
  readonly serversService = inject(ServersService);
  readonly chatService = inject(ChatService);
  private readonly route = inject(ActivatedRoute);
  private lastLoadedChannelId: number | null = null;

  /**
   * Sincroniza el chat visible con el canal seleccionado.
   */
  constructor() {
    effect(() => {
      const selectedChannel = this.serversService.selectedChannel();

      if (!selectedChannel) {
        this.lastLoadedChannelId = null;
        this.chatService.clearCurrentConversation();
        return;
      }

      if (this.lastLoadedChannelId === selectedChannel.id) {
        return;
      }

      this.lastLoadedChannelId = selectedChannel.id;

      this.chatService.openChannelConversation(selectedChannel.id).subscribe({
        next: (conversation) => {
          this.chatService.loadMessages(conversation.id);
        },
        error: (error) => {
          console.error('Error al abrir la conversación del canal:', error);
        },
      });
    });

    effect(() => {
      this.enrichCurrentConversationWithMemberNames();
    });
  }

  ngOnInit(): void {
    this.cargarServidores();

    this.route.paramMap.subscribe(params => {
      const rawServerId = params.get('serverId');
      if (!rawServerId) return;

      const serverId = Number(rawServerId);
      if (Number.isNaN(serverId)) {
        console.warn('ID de servidor invalido en la ruta:', rawServerId);
        return;
      }

      this.seleccionarServidor(serverId);
    });
  }

  /**
   * Carga la lista de servidores del usuario autenticado.
   */
  cargarServidores() {
    this.serversService.obtenerServidores().subscribe({
      next: () => {
        console.log('Servidores cargados');
      },
      error: (error) => {
        console.error('Error al cargar servidores:', error);
      }
    });
  }

  /**
   * Carga el servidor seleccionado y sus miembros, canales y categorías.
   */
  seleccionarServidor( serverId: number) {
    this.serversService.obtenerIdServidor(serverId).subscribe({
      next: (server) => {
        // Si el backend devolvió null o no encontró el servidor, no intentar cargar recursos relacionados.
        if (!server) {
          console.warn('Servidor no encontrado en backend, abortando carga de miembros/canales/categorías.');
          return;
        }

        this.serversService.obtenerMiembros(serverId).subscribe({
          next: () => this.enrichCurrentConversationWithMemberNames(),
          error: (error) => { console.error('Error al cargar miembros del servidor:', error);
          }
        });
        this.serversService.obtenerCanales(serverId).subscribe({
          error: (error) => { console.error('Error al cargar canales del servidor:', error);
          }
        });
        this.serversService.obtenerCategorias(serverId).subscribe({
           error: (error) => { console.error('Error al cargar categorías del servidor:', error);
          }
        });
      },
      error: (error) => { console.error('Error al cargar el servidor:', error);
      }
    });
  }

  /**
   * Crea un servidor nuevo.
   */
  crearServidor( nombre: string , iconUrl: string) {
    this.serversService.crearServidor(nombre, iconUrl).subscribe({
      next: () => {console.log('Servidor creado');
      },
      error: (error) => {
        console.error('Error al crear el servidor:', error);
      }
    });
  }

  /**
   * Elimina un servidor después de confirmar la acción.
   */
    eliminarServidor(serverId: number) {
      if (!confirm('¿Estás seguro de que deseas eliminar este servidor?')) {
        return;
      }
      this.serversService.eliminarServidor(serverId).subscribe({
        next: () => {
          console.log('Servidor eliminado');
          this.cargarServidores();
        },
        error: (error) => {
          console.error('Error al eliminar el servidor:', error);
        }
      });
  }

  /**
   * Elimina un miembro del servidor; el id del servidor se resuelve si no se pasa.
   */
  eliminarMiembro(serverId: number | undefined, userId: string) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) {
      console.warn('No hay servidor seleccionado para eliminar miembro.');
      return;
    }
    if (!this.esUsuarioPropietarioDelServidor()) {
      console.warn('Solo el propietario del servidor puede expulsar miembros.');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar a este miembro del servidor?')) {
      return;
    }
    this.serversService.eliminarMiembro(sid, userId).subscribe({
      next: () => {
        console.log('Miembro eliminado del servidor');
        this.seleccionarServidor(sid);
      },
      error: (error) => {
        console.error('Error al eliminar el miembro del servidor:', error);
      }
    });
  }

  /**
   * Cambia el rol de un miembro en el servidor seleccionado.
   */
  cambiarRolMiembro(serverId: number | undefined, userId: string, newRole: string) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) { console.warn('No hay servidor seleccionado para cambiar rol.'); return; }
    if (!this.esUsuarioPropietarioDelServidor()) {
      console.warn('Solo el propietario del servidor puede cambiar roles.');
      return;
    }
    this.serversService.cambiarRolMiembro(sid, userId, newRole).subscribe({
      next: () => this.seleccionarServidor(sid),
      error: (err) => console.error('Error cambiando rol:', err)
    });
  }

  /**
   * Abre prompts simples para crear un servidor rápido.
   */
  promptCrearServidor() {
    const nombre = prompt('Nombre del nuevo servidor')?.trim();
    if (!nombre) return;
    const icon = prompt('URL del icono (opcional)')?.trim() || '';
    this.crearServidor(nombre, icon);
  }

  /**
   * Selecciona un canal y lo carga en el servicio.
   */
  seleccionarCanal(channelId: number | undefined) {
    const sid = this.serversService.selectedServer()?.id;
    if (!sid || !channelId) { console.warn('Falta servidor o canal para seleccionar.'); return; }
    this.serversService.obtenerCanal(sid, channelId).subscribe({
      next: (canal) => {
        if (canal) console.log('Canal seleccionado:', canal.name);
      },
      error: (err) => console.error('Error al seleccionar canal:', err)
    });
  }

  /**
   * Envía un mensaje al chat activo del canal seleccionado.
   */
  enviarMensaje(payload: { content: string; messageType: 'TEXT' | 'IMAGE' }) {
    const conversation = this.chatService.currentConversation();

    if (!conversation) {
      console.warn('No hay conversación activa para enviar el mensaje.');
      return;
    }

    this.chatService.sendMessage(conversation.id, payload.content, payload.messageType);
  }

  /**
   * Elimina un canal y recarga la lista de canales.
   */
  eliminarCanal(serverId: number | undefined, channelId: number) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) { console.warn('No hay servidor seleccionado para eliminar canal.'); return; }
    if (!this.puedeGestionarCanales()) {
      console.warn('No tienes permisos para eliminar canales en este servidor.');
      return;
    }
    if (!confirm('¿Eliminar canal?')) return;
    this.serversService.eliminarCanal(sid, channelId).subscribe({
      next: (ok) => {
        if (ok) {
          console.log('Canal eliminado');
          this.serversService.obtenerCanales(sid).subscribe({ error: err => console.error('Error recargando canales:', err) });
        }
      },
      error: (err) => console.error('Error eliminando canal:', err)
    });
  }

  /**
   * Crea un canal en el servidor indicado.
   * - serverId: opcional. Si se omite, se usa el servidor seleccionado.
   * - nombre: requerido.
   * - categoriaId: opcional.
   */
  crearCanal(serverId?: number, nombre?: string, categoriaId?: number): void {
    const resolvedServerId = serverId ?? this.serversService.selectedServer()?.id;
    if (!resolvedServerId) {
      console.warn('No hay servidor seleccionado para crear el canal.');
      return;
    }
    if (!this.puedeGestionarCanales()) {
      console.warn('No tienes permisos para crear canales en este servidor.');
      return;
    }
    if (!nombre || !nombre.trim()) {
      console.warn('Nombre de canal vacío, se requiere nombre.');
      return;
    }

    this.serversService.crearCanal(resolvedServerId, nombre.trim(), categoriaId).subscribe({
      next: (canal) => {
        if (canal) {
          console.log('Canal creado:', canal);
          // Recargar canales para actualizar la UI
          this.serversService.obtenerCanales(resolvedServerId).subscribe({
            error: (err) => console.error('Error recargando canales:', err)
          });
        } else {
          console.error('La creación del canal devolvió null.');
        }
      },
      error: (error) => {
        console.error('Error al crear el canal:', error);
      }
    });
  }

  /**
   * Recibe eventos desde la lista de canales y crea un canal con el servidor actual.
   */
  crearCanalDesdeLista(event: { name: string; categoryId?: number }) {
    this.crearCanal(undefined, event.name, event.categoryId);
  }

  /**
   * Elimina un canal usando el servidor seleccionado actual.
   */
  eliminarCanalDesdeLista(channelId: number) {
    this.eliminarCanal(this.serversService.selectedServer()?.id, channelId);
  }

  /**
   * Comprueba si el usuario autenticado es el owner del servidor actualmente seleccionado.
   */
  public esUsuarioPropietarioDelServidor(): boolean {
    return this.obtenerRolUsuarioActualEnServidor() === 'owner';
  }

  /**
   * Comprueba si el usuario actual puede gestionar canales.
   * OWNER y ADMIN pueden crear/eliminar; MEMBER no.
   */
  public puedeGestionarCanales(): boolean {
    const role = this.obtenerRolUsuarioActualEnServidor();

    return role === 'owner' || role === 'admin';
  }

  /**
   * Devuelve el rol del usuario autenticado dentro del servidor seleccionado.
   */
  private obtenerRolUsuarioActualEnServidor(): string | null {
    const currentUserId = this.authService.user()?.userId;

    if (!currentUserId) {
      return null;
    }

    const member = this.serversService.serverMembers().find((serverMember) => {
      return serverMember.userId === currentUserId;
    });

    if (!member?.role) {
      return null;
    }

    return member.role.toLowerCase();
  }

  /**
   * Asigna el nombre de usuario a los mensajes del canal usando los miembros del servidor.
   */
  private enrichCurrentConversationWithMemberNames(): void {
    const conversation = this.chatService.currentConversation();
    const selectedServer = this.serversService.selectedServer();

    if (!conversation || !conversation.channelId || !selectedServer) {
      return;
    }

    const messages = conversation.messages ?? [];
    if (!messages.length) {
      return;
    }

    const membersById = new Map(
      this.serversService.serverMembers().map((member) => [member.userId, member.username]),
    );

    const enrichedMessages = messages.map((message) => ({
      ...message,
      authorName: membersById.get(message.userId) ?? message.authorName,
    }));

    const hasChanges = enrichedMessages.some((message, index) => message.authorName !== messages[index]?.authorName);
    if (!hasChanges) {
      return;
    }

    this.chatService.replaceCurrentConversation({
      ...conversation,
      messages: enrichedMessages,
    });
  }



}
