import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ServersService } from '../../services/servers.service';
import { ChannelList } from '../../components/channel-list/channel-list';
import { MembersList } from '../../components/members-list/members-list';

@Component({
  selector: 'servers-page',
  standalone: true,
  imports: [CommonModule, ChannelList, MembersList],
  templateUrl: './servers-page.html'
})
export class ServersPage implements OnInit {
  readonly serversService = inject(ServersService);
  private readonly route = inject(ActivatedRoute);

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

  seleccionarServidor( serverId: number) {
    this.serversService.obtenerIdServidor(serverId).subscribe({
      next:() => {
        this.serversService.obtenerMiembros(serverId).subscribe({
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
  crearServidor( nombre: string , iconUrl: string) {
    this.serversService.crearServidor(nombre, iconUrl).subscribe({
      next: () => {console.log('Servidor creado');
      },
      error: (error) => {
        console.error('Error al crear el servidor:', error);
      }
    });
  }
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

  /** Elimina miembro; serverId puede ser undefined y se valida internamente */
  eliminarMiembro(serverId: number | undefined, userId: string) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) {
      console.warn('No hay servidor seleccionado para eliminar miembro.');
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

  /** Cambia rol de un miembro en el servidor seleccionado */
  cambiarRolMiembro(serverId: number | undefined, userId: string, newRole: string) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) { console.warn('No hay servidor seleccionado para cambiar rol.'); return; }
    this.serversService.cambiarRolMiembro(sid, userId, newRole).subscribe({
      next: () => this.seleccionarServidor(sid),
      error: (err) => console.error('Error cambiando rol:', err)
    });
  }

  /** Pide datos al usuario y crea un servidor rápido (usar modal sería mejor) */
  promptCrearServidor() {
    const nombre = prompt('Nombre del nuevo servidor')?.trim();
    if (!nombre) return;
    const icon = prompt('URL del icono (opcional)')?.trim() || '';
    this.crearServidor(nombre, icon);
  }

  /** Selecciona un canal: carga el canal y lo marca como seleccionado en el servicio */
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

  /** Elimina un canal y recarga la lista de canales */
  eliminarCanal(serverId: number | undefined, channelId: number) {
    const sid = serverId ?? this.serversService.selectedServer()?.id;
    if (!sid) { console.warn('No hay servidor seleccionado para eliminar canal.'); return; }
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

  /** Recibe eventos desde channel-list y crea un canal con el servidor actual */
  crearCanalDesdeLista(event: { name: string; categoryId?: number }) {
    this.crearCanal(undefined, event.name, event.categoryId);
  }

  /** Elimina un canal usando el servidor seleccionado actual */
  eliminarCanalDesdeLista(channelId: number) {
    this.eliminarCanal(this.serversService.selectedServer()?.id, channelId);
  }



}
