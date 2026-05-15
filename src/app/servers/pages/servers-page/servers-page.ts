import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServersService } from '../../services/servers.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'servers-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './servers-page.html'
})
export class ServersPage implements OnInit {
  private serversService = inject(ServersService);

  // Exponer servicio al template para acceder a signals y métodos
  readonly svc = this.serversService;

  ngOnInit(): void {
    // Cargar lista de servidores al iniciar la página
    this.svc.obtenerServidores();
  }
}
