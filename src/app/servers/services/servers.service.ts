import { Server } from '../interfaces/server.interface';
import { ServerMember } from '../interfaces/server-member.interface';
import { Channel } from '../interfaces/channel.interface';
import { ChannelCategory } from '../interfaces/channel-category.interface';
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap, mapTo } from 'rxjs';


const baseUrl = 'http://localhost:8081/api/v1'



@Injectable({providedIn: 'root'})
export class ServersService {

  private http = inject(HttpClient);

  //lista de servidores del usuario, el servidor seleccionado, miembros del servidor, canales y categorias de canales
  private _servers=signal<Server[]>([])
  private _selectedServer=signal<Server | null>(null)
  private _members=signal<ServerMember[]>([])
  private _channels=signal<Channel[]>([])
  private _categories=signal<ChannelCategory[]>([])

  //signal() almacena un valor
  //computed() calcula un valor
  //tap funciona como suscribe para el observable

  //señales computadas para exponer los datos a los componentes
  servers=computed(() => this._servers());
  selectedServer=computed(() => this._selectedServer());
  serverMembers=computed(() => this._members())
  channels=computed(() => this._channels())
  channelCategories=computed(() => this._categories())

  //señales para controlar la carga y errores de cada sección
  loadingServers=signal<boolean>(false);
  loadingMembers=signal<boolean>(false);
  loadingChannels=signal<boolean>(false)
  loadingCategories=signal<boolean>(false)

  errorServers=signal<string | null>(null)
  errorMembers=signal<string | null>(null)
  errorChannels=signal<string | null>(null)
  errorCategories=signal<string | null>(null)


  //Metodos para Servidores
  obtenerServidores(): Observable<Server[]> {
    this.loadingServers.set(true);
    this.errorServers.set(null);
    return this.http.get<Server[]>(`${baseUrl}/servers`).pipe(
      tap(list=>this._servers.set(list)),       // actualizar estado
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error inesperado al cargar los servidores');
        return of <Server[]>([]);         // fallback seguro
      }),
      finalize(() => this.loadingServers.set(false))  // siempre apagar spinner
    )
  }

  crearServidor(name: string, iconUrl: string): Observable<Server | null> { //null es por si falla la creación, así si da error puede devolver null
  this.loadingServers.set(true);
  this.errorServers.set(null);

  return this.http.post<Server>(`${baseUrl}/servers`, { name, iconUrl }).pipe(
    tap(nuevoServidor => {
      // Solo después de que el backend respondió, actualizar la lista
      this._servers.update(lista => [nuevoServidor, ...lista]);
    }),
    catchError(error => {
      this.errorServers.set(error?.message ?? 'Error al crear el servidor');
      return of(null); // fallback
    }),
    finalize(() => this.loadingServers.set(false))
  );
}

  obtenerIdServidor(serverId: number): Observable<Server | null> {
    this.loadingServers.set(true);
    this.errorServers.set(null);
    return this.http.get<Server | null>(`${baseUrl}/servers/${serverId}`).pipe(
      tap(server => this._selectedServer.set(server)),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al cargar el servidor');
        return of(null);
      }),
      finalize(() => this.loadingServers.set(false))
    );
  }

  eliminarServidor(serverId: number): Observable<boolean> {
    this.loadingServers.set(true);
    this.errorServers.set(null);
    return this.http.delete<void>(`${baseUrl}/servers/${serverId}`).pipe(
      mapTo(true) ,// Si la petición es exitosa, devolvemos true
      tap(() => {
        this._servers.update(lista => lista.filter(s => s.id !== serverId)); // Actualizamos la lista local eliminando el servidor
        if (this._selectedServer()?.id === serverId) {
          this._selectedServer.set(null); // Si el servidor eliminado era el seleccionado, limpiamos la selección
        }
      }),
      catchError(error => {
        this.errorServers.set(error?.message ?? 'Error al eliminar el servidor');
        return of(false);
      }),
      finalize(() => this.loadingServers.set(false))
    )


  }
  //Metodos para Miembros del Servidor

  //Metodos para Canales
}
