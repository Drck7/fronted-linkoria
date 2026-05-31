import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServersService } from '../../../servers/services/servers.service';
import { ServerList } from '../../../servers/components/server-list/server-list';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'servers-navbar',
  standalone: true,
  imports: [ServerList, RouterLink],
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
    this.router.navigate(['/servers/add']).catch(err => {
      console.error('Error navegando a crear servidor:', err);
    });
  }
}
