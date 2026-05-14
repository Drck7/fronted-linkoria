import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, mapTo, Observable, of, tap } from 'rxjs';

import { Channel } from '../interfaces/channel.interface';
import { ChannelCategory } from '../interfaces/channel-category.interface';
import { Server } from '../interfaces/server.interface';
import { ServerMember } from '../interfaces/server-member.interface';

const baseUrl = 'http://localhost:8081/api/v1';

@Injectable({ providedIn: 'root' })
export class ServersService {
  private http = inject(HttpClient);

  private _servers = signal<Server[]>([]);
  private _selectedServer = signal<Server | null>(null);
  private _members = signal<ServerMember[]>([]);
  private _channels = signal<Channel[]>([]);
  private _selectedChannel = signal<Channel | null>(null);
  private _categories = signal<ChannelCategory[]>([]);

  servers = computed(() => this._servers());
  selectedServer = computed(() => this._selectedServer());
  serverMembers = computed(() => this._members());
  channels = computed(() => this._channels());
  selectedChannel = computed(() => this._selectedChannel());
  channelCategories = computed(() => this._categories());

  loadingServers = signal(false);
  loadingMembers = signal(false);
  loadingChannels = signal(false);
  loadingCategories = signal(false);

  errorServers = signal<string | null>(null);
  errorMembers = signal<string | null>(null);
  errorChannels = signal<string | null>(null);
  errorCategories = signal<string | null>(null);

  obtenerServidores(): Observable<Server[]> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.get<Server[]>(`${baseUrl}/servers`).pipe(
      tap(list => this._servers.set(list)),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error inesperado al cargar los servidores');
        return of<Server[]>([]);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  crearServidor(name: string, iconUrl: string): Observable<Server | null> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.post<Server>(`${baseUrl}/servers`, { name, iconUrl }).pipe(
      tap(nuevoServidor => {
        this._servers.update(lista => [nuevoServidor, ...lista]);
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al crear el servidor');
        return of(null);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  obtenerIdServidor(serverId: number): Observable<Server | null> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.get<Server>(`${baseUrl}/servers/${serverId}`).pipe(
      tap(server => this._selectedServer.set(server)),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al cargar el servidor');
        return of(null);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  actualizarServidor(serverId: number, patch: Partial<Pick<Server, 'name' | 'iconUrl'>>): Observable<Server | null> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.patch<Server>(`${baseUrl}/servers/${serverId}`, patch).pipe(
      tap(updatedServer => {
        this._selectedServer.set(updatedServer);
        this._servers.update(lista => lista.map(server => server.id === updatedServer.id ? updatedServer : server));
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al actualizar el servidor');
        return of(null);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  eliminarServidor(serverId: number): Observable<boolean> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.delete<void>(`${baseUrl}/servers/${serverId}`).pipe(
      mapTo(true),
      tap(() => {
        this._servers.update(lista => lista.filter(server => server.id !== serverId));
        if (this._selectedServer()?.id === serverId) {
          this._selectedServer.set(null);
        }
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al eliminar el servidor');
        return of(false);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  unirseServidor(inviteCode: string): Observable<Server | null> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.post<Server>(`${baseUrl}/servers/join`, { inviteCode }).pipe(
      tap(server => {
        this._servers.update(lista => [server, ...lista]);
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al unirse al servidor');
        return of(null);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  abandonarServidor(serverId: number): Observable<boolean> {
    this.loadingServers.set(true);
    this.errorServers.set(null);

    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/leave`).pipe(
      mapTo(true),
      tap(() => {
        this._servers.update(lista => lista.filter(server => server.id !== serverId));
        if (this._selectedServer()?.id === serverId) {
          this._selectedServer.set(null);
        }
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al abandonar el servidor');
        return of(false);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  obtenerMiembros(serverId: number): Observable<ServerMember[]> {
    this.loadingMembers.set(true);
    this.errorMembers.set(null);

    return this.http.get<ServerMember[]>(`${baseUrl}/servers/${serverId}/members`).pipe(
      tap(list => this._members.set(list)),
      catchError(error => {
        this.errorMembers.set(error?.message ?? 'Error al cargar los miembros del servidor');
        return of<ServerMember[]>([]);
      }),
      finalize(() => this.loadingMembers.set(false))
    );
  }

  cambiarRolMiembro(serverId: number, userId: string, newRole: string): Observable<ServerMember | null> {
    this.loadingMembers.set(true);
    this.errorMembers.set(null);

    return this.http.patch<ServerMember>(`${baseUrl}/servers/${serverId}/members/${userId}/role`, { newRole }).pipe(
      tap(updatedMember => {
        this._members.update(lista => lista.map(member => member.userId === updatedMember.userId ? updatedMember : member));
      }),
      catchError(error => {
        this.errorMembers.set(error?.message ?? 'Error al cambiar el rol del miembro');
        return of(null);
      }),
      finalize(() => this.loadingMembers.set(false))
    );
  }

  eliminarMiembro(serverId: number, userId: string): Observable<boolean> {
    this.loadingMembers.set(true);
    this.errorMembers.set(null);

    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/members/${userId}`).pipe(
      mapTo(true),
      tap(() => {
        this._members.update(lista => lista.filter(member => member.userId !== userId));
      }),
      catchError(error => {
        this.errorMembers.set(error?.message ?? 'Error al eliminar el miembro del servidor');
        return of(false);
      }),
      finalize(() => this.loadingMembers.set(false))
    );
  }

  obtenerCanales(serverId: number, categoryId?: number): Observable<Channel[]> {
    this.loadingChannels.set(true);
    this.errorChannels.set(null);

    const url = categoryId !== undefined
      ? `${baseUrl}/servers/${serverId}/channels?categoryId=${categoryId}`
      : `${baseUrl}/servers/${serverId}/channels`;

    return this.http.get<Channel[]>(url).pipe(
      tap(list => this._channels.set(list)),
      catchError(error => {
        this.errorChannels.set(error?.message ?? 'Error al cargar los canales del servidor');
        return of<Channel[]>([]);
      }),
      finalize(() => this.loadingChannels.set(false))
    );
  }

  crearCanal(serverId: number, name: string, channelCategoryId?: number): Observable<Channel | null> {
    this.loadingChannels.set(true);
    this.errorChannels.set(null);

    const body: { name: string; channelCategoryId?: number } = { name };

    if (channelCategoryId !== undefined) {
      body.channelCategoryId = channelCategoryId;
    }

    return this.http.post<Channel>(`${baseUrl}/servers/${serverId}/channels`, body).pipe(
      tap(channel => this._channels.update(lista => [channel, ...lista])),
      catchError(error => {
        this.errorChannels.set(error?.message ?? 'Error al crear el canal');
        return of(null);
      }),
      finalize(() => this.loadingChannels.set(false))
    );
  }

  obtenerCanal(serverId: number, channelId: number): Observable<Channel | null> {
    this.loadingChannels.set(true);
    this.errorChannels.set(null);

    return this.http.get<Channel>(`${baseUrl}/servers/${serverId}/channels/${channelId}`).pipe(
      tap(channel => this._selectedChannel.set(channel)),
      catchError(error => {
        this.errorChannels.set(error?.message ?? 'Error al cargar el canal');
        return of(null);
      }),
      finalize(() => this.loadingChannels.set(false))
    );
  }

  eliminarCanal(serverId: number, channelId: number): Observable<boolean> {
    this.loadingChannels.set(true);
    this.errorChannels.set(null);

    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/channels/${channelId}`).pipe(
      mapTo(true),
      tap(() => {
        this._channels.update(lista => lista.filter(channel => channel.id !== channelId));
        if (this._selectedChannel()?.id === channelId) {
          this._selectedChannel.set(null);
        }
      }),
      catchError(error => {
        this.errorChannels.set(error?.message ?? 'Error al eliminar el canal');
        return of(false);
      }),
      finalize(() => this.loadingChannels.set(false))
    );
  }

  obtenerCategorias(serverId: number): Observable<ChannelCategory[]> {
    this.loadingCategories.set(true);
    this.errorCategories.set(null);

    return this.http.get<ChannelCategory[]>(`${baseUrl}/servers/${serverId}/categories`).pipe(
      tap(list => this._categories.set(list)),
      catchError(error => {
        this.errorCategories.set(error?.message ?? 'Error al cargar las categorias de canales');
        return of<ChannelCategory[]>([]);
      }),
      finalize(() => this.loadingCategories.set(false))
    );
  }

  crearCategoria(serverId: number, name: string): Observable<ChannelCategory | null> {
    this.loadingCategories.set(true);
    this.errorCategories.set(null);

    return this.http.post<ChannelCategory>(`${baseUrl}/servers/${serverId}/categories`, { name }).pipe(
      tap(category => this._categories.update(lista => [category, ...lista])),
      catchError(error => {
        this.errorCategories.set(error?.message ?? 'Error al crear la categoria de canal');
        return of(null);
      }),
      finalize(() => this.loadingCategories.set(false))
    );
  }

  obtenerCategoria(serverId: number, categoryId: number): Observable<ChannelCategory | null> {
    this.loadingCategories.set(true);
    this.errorCategories.set(null);

    return this.http.get<ChannelCategory>(`${baseUrl}/servers/${serverId}/categories/${categoryId}`).pipe(
      catchError(error => {
        this.errorCategories.set(error?.message ?? 'Error al cargar la categoria de canal');
        return of(null);
      }),
      finalize(() => this.loadingCategories.set(false))
    );
  }

  eliminarCategoria(serverId: number, categoryId: number): Observable<boolean> {
    this.loadingCategories.set(true);
    this.errorCategories.set(null);

    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/categories/${categoryId}`).pipe(
      mapTo(true),
      tap(() => {
        this._categories.update(lista => lista.filter(category => category.id !== categoryId));
      }),
      catchError(error => {
        this.errorCategories.set(error?.message ?? 'Error al eliminar la categoria de canal');
        return of(false);
      }),
      finalize(() => this.loadingCategories.set(false))
    );
  }
}
