import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

import { ServersService } from '../../services/servers.service';

@Component({
  selector: 'app-servers-add-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servers-add-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersAddPage {
  private readonly serversService = inject(ServersService);
  private readonly router = inject(Router);

  serverName = '';
  iconUrl = '';
  readonly isCreating = signal(false);
  readonly createError = signal<string | null>(null);

  createServer(): void {
    const name = this.serverName.trim();
    const icon = this.iconUrl.trim();

    if (!name) {
      this.createError.set('Introduce un nombre válido para el servidor.');
      return;
    }

    this.createError.set(null);
    this.isCreating.set(true);

    this.serversService.crearServidor(name, icon).pipe(
      finalize(() => this.isCreating.set(false))
    ).subscribe({
      next: (server) => {
        if (!server) {
          this.createError.set('No se ha podido crear el servidor. Inténtalo de nuevo.');
          return;
        }

        this.serverName = '';
        this.iconUrl = '';
        this.router.navigate(['/servers', server.id]).catch((error) => {
          console.error('Error navegando al servidor creado:', error);
        });
      },
      error: (error) => {
        console.error('Error al crear servidor:', error);
        this.createError.set('Error inesperado al crear el servidor.');
      },
    });
  }
}