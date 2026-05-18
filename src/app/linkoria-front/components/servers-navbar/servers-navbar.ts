import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServersService } from '../../../servers/services/servers.service';
import { ServerList } from '../../../servers/components/server-list/server-list';

@Component({
  selector: 'servers-navbar',
  standalone: true,
  imports: [ServerList],
  templateUrl: './servers-navbar.html',
  styles: ``,
})
export class ServersNavbar implements OnInit {
  readonly serversService = inject(ServersService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.serversService.obtenerServidores().subscribe({
      error: (err) => console.error('Error cargando servidores en navbar:', err)
    });
  }

  onSelectServer(id: number) {
    this.router.navigate(['/servers', id]).catch(err => {
      console.error('Error navegando al servidor desde navbar:', err);
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
    this.serversService.crearServidor(nombre, icon).subscribe({
      next: (server) => {
        if (!server) return;
        this.router.navigate(['/servers', server.id]).catch(err => {
          console.error('Error navegando al nuevo servidor:', err);
        });
      },
      error: (err) => console.error('Error creando servidor desde navbar:', err)
    });
  }
}
