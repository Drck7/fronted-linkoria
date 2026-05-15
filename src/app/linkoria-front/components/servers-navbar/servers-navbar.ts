import { Component, inject } from '@angular/core';
import { ServersService } from '../../../servers/services/servers.service';
import { ServerList } from '../../../servers/components/server-list/server-list';

@Component({
  selector: 'servers-navbar',
  standalone: true,
  imports: [ServerList],
  templateUrl: './servers-navbar.html',
  styles: ``,
})
export class ServersNavbar {
  readonly serversService = inject(ServersService);

  onSelectServer(id: number) {
    this.serversService.obtenerIdServidor(id).subscribe({
      next: () => {
        this.serversService.obtenerMiembros(id).subscribe();
        this.serversService.obtenerCanales(id).subscribe();
        this.serversService.obtenerCategorias(id).subscribe();
      },
      error: (err) => console.error('Error seleccionando servidor desde navbar:', err)
    });
  }

  onDeleteServer(id: number) {
    if (!confirm('¿Eliminar servidor?')) return;
    this.serversService.eliminarServidor(id).subscribe();
  }

  onCreateRequest() {
    const nombre = prompt('Nombre del servidor')?.trim();
    if (!nombre) return;
    const icon = prompt('URL icono (opcional)')?.trim() || '';
    this.serversService.crearServidor(nombre, icon).subscribe();
  }
}
