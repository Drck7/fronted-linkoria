import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ServersService } from '../../services/servers.service';

@Component({
  selector: 'app-servers-buscar-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servers-buscar-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersBuscarPage {
  private readonly serversService = inject(ServersService);
  private readonly router = inject(Router);

  inviteCode = '';
  readonly isJoining = signal(false);
  readonly joinError = signal<string | null>(null);

  joinServer(): void {
    const code = this.inviteCode.trim();

    if (!code) {
      this.joinError.set('Introduce un código de servidor válido.');
      return;
    }

    this.joinError.set(null);
    this.isJoining.set(true);

    this.serversService.unirseServidor(code).pipe(
      finalize(() => this.isJoining.set(false))
    ).subscribe({
      next: (server) => {
        if (!server) {
          this.joinError.set('No se ha podido unir al servidor. Comprueba el código e inténtalo de nuevo.');
          return;
        }

        this.inviteCode = '';
        this.router.navigate(['/servers', server.id]).catch((error) => {
          console.error('Error navegando al servidor unido:', error);
        });
      },
      error: (error) => {
        console.error('Error al unirse al servidor:', error);
        this.joinError.set('Error inesperado al unirse al servidor.');
      },
    });
  }
}
