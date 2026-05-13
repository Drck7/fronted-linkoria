import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { Server } from '../interfaces/server.interface';
import { ServerMember } from '../interfaces/server-member.interface';
import { Channel } from '../interfaces/channel.interface';
import { ChannelCategory } from '../interfaces/channel-category.interface';

const baseUrl = 'http://localhost:8081/api/v1';

@Injectable({ providedIn: 'root' })
export class ServersService {
  private http = inject(HttpClient);

  // Signals (estado local)
  servers = signal<Server[]>([]);
  selectedServer = signal<Server | null>(null);
  members = signal<ServerMember[]>([]);
  channels = signal<Channel[]>([]);
  categories = signal<ChannelCategory[]>([]);

  /* ---------- Helpers ---------- */
  private handleError<T>(fallback: T) {
    return (error: any): Observable<T> => {
      console.error('ServersService error', error);
      return of(fallback);
    };
  }

  /* ---------- Servidores ---------- */
  obtenerServidores(): Observable<Server[]> {
    return this.http.get<Server[]>(`${baseUrl}/servers`).pipe(
      tap(list => this.servers.set(list)),
      catchError(this.handleError<Server[]>([]))
    );
  }

  crearServidor(name: string, iconUrl?: string): Observable<Server | null> {
    const body = { name, iconUrl };
    return this.http.post<Server>(`${baseUrl}/servers`, body).pipe(
      tap(s => this.servers.update(list => [s, ...list])),
      catchError(this.handleError<Server | null>(null))
    );
  }

  obtenerIdServidor(serverId: number): Observable<Server | null> {
    return this.http.get<Server>(`${baseUrl}/servers/${serverId}`).pipe(
      tap(s => this.selectedServer.set(s)),
      catchError(this.handleError<Server | null>(null))
    );
  }

  actualizarServidor(serverId: number, patch: Partial<Pick<Server, 'name' | 'iconUrl'>>): Observable<Server | null> {
    return this.http.patch<Server>(`${baseUrl}/servers/${serverId}`, patch).pipe(
      tap(s => {
        this.selectedServer.set(s);
        this.servers.update(list => list.map(x => x.id === s.id ? s : x));
      }),
      catchError(this.handleError<Server | null>(null))
    );
  }

  eliminarServidor(serverId: number): Observable<boolean> {
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}`).pipe(
      tap(() => this.servers.update(list => list.filter(s => s.id !== serverId))),
      tap(() => { if (this.selectedServer()?.id === serverId) this.selectedServer.set(null); }),
      catchError((err) => { console.error(err); return of(false); })
    );
  }

  leaveServidor(serverId: number): Observable<boolean> {
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/leave`).pipe(
      tap(() => this.servers.update(list => list.filter(s => s.id !== serverId))),
      catchError((err) => { console.error(err); return of(false); })
    );
  }

  joinServidor(inviteCode: string): Observable<Server | null> {
    return this.http.post<Server>(`${baseUrl}/servers/join`, { inviteCode }).pipe(
      tap(s => this.servers.update(list => [s, ...list])),
      catchError(this.handleError<Server | null>(null))
    );
  }

  /* ---------- Miembros ---------- */
  obtenerMiembrosServidor(serverId: number): Observable<ServerMember[]> {
    return this.http.get<ServerMember[]>(`${baseUrl}/servers/${serverId}/members`).pipe(
      tap(list => this.members.set(list)),
      catchError(this.handleError<ServerMember[]>([]))
    );
  }

  cambiarRolMiembro(serverId: number, userId: string, newRole: string): Observable<ServerMember | null> {
    return this.http.patch<ServerMember>(`${baseUrl}/servers/${serverId}/members/${userId}/role`, { newRole }).pipe(
      tap(updated => this.members.update(list => list.map(m => m.userId === updated.userId ? updated : m))),
      catchError(this.handleError<ServerMember | null>(null))
    );
  }

  expulsarMiembro(serverId: number, userId: string): Observable<boolean> {
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/members/${userId}`).pipe(
      tap(() => this.members.update(list => list.filter(m => m.userId !== userId))),
      catchError((err) => { console.error(err); return of(false); })
    );
  }

  /* ---------- Canales ---------- */
  obtenerCanales(serverId: number, categoryId?: number): Observable<Channel[]> {
    const url = `${baseUrl}/servers/${serverId}/channels${categoryId ? `?categoryId=${categoryId}` : ''}`;
    return this.http.get<Channel[]>(url).pipe(
      tap(list => this.channels.set(list)),
      catchError(this.handleError<Channel[]>([]))
    );
  }

  crearCanal(serverId: number, name: string, channelCategoryId?: number): Observable<Channel | null> {
    const body: any = { name };
    if (channelCategoryId !== undefined) body.ChannelCategoryId = channelCategoryId;
    return this.http.post<Channel>(`${baseUrl}/servers/${serverId}/channels`, body).pipe(
      tap(c => this.channels.update(list => [c, ...list])),
      catchError(this.handleError<Channel | null>(null))
    );
  }

  obtenerCanal(serverId: number, channelId: number): Observable<Channel | null> {
    return this.http.get<Channel>(`${baseUrl}/servers/${serverId}/channels/${channelId}`).pipe(
      catchError(this.handleError<Channel | null>(null))
    );
  }

  eliminarCanal(serverId: number, channelId: number): Observable<boolean> {
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/channels/${channelId}`).pipe(
      tap(() => this.channels.update(list => list.filter(c => c.id !== channelId))),
      catchError((err) => { console.error(err); return of(false); })
    );
  }

  /* ---------- Categorías de Canal ---------- */
  obtenerCategorias(serverId: number): Observable<ChannelCategory[]> {
    return this.http.get<ChannelCategory[]>(`${baseUrl}/servers/${serverId}/categories`).pipe(
      tap(list => this.categories.set(list)),
      catchError(this.handleError<ChannelCategory[]>([]))
    );
  }

  crearCategoria(serverId: number, name: string): Observable<ChannelCategory | null> {
    return this.http.post<ChannelCategory>(`${baseUrl}/servers/${serverId}/categories`, { name }).pipe(
      tap(c => this.categories.update(list => [c, ...list])),
      catchError(this.handleError<ChannelCategory | null>(null))
    );
  }

  obtenerCategoria(serverId: number, categoryId: number): Observable<ChannelCategory | null> {
    return this.http.get<ChannelCategory>(`${baseUrl}/servers/${serverId}/categories/${categoryId}`).pipe(
      catchError(this.handleError<ChannelCategory | null>(null))
    );
  }

  eliminarCategoria(serverId: number, categoryId: number): Observable<boolean> {
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}/categories/${categoryId}`).pipe(
      tap(() => this.categories.update(list => list.filter(c => c.id !== categoryId))),
      catchError((err) => { console.error(err); return of(false); })
    );
  }

}