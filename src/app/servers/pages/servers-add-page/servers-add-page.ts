import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

import { ServersService } from '../../services/servers.service';
import { ImageUploadService } from '../../../shared/services/image-upload.service';

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
  private readonly imageUploadService = inject(ImageUploadService);

  serverName = '';
  iconUrl = '';
  readonly isCreating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly isUploadingIcon = signal(false);
  readonly iconUploadError = signal<string | null>(null);

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

  // Abre el selector de archivos para elegir el icono del servidor.
  abrirSelectorIcono(inputFile: HTMLInputElement): void {
    inputFile.click();
  }

  // Sube el icono a Supabase y rellena el campo URL con la dirección pública.
  onIconFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.iconUploadError.set('Selecciona una imagen válida para el icono.');
      return;
    }

    this.iconUploadError.set(null);
    this.isUploadingIcon.set(true);

    this.imageUploadService.subirImagen(file, 'servicios').pipe(
      finalize(() => this.isUploadingIcon.set(false))
    ).subscribe({
      next: (imageUrl) => {
        this.iconUrl = imageUrl;
      },
      error: (error) => {
        console.error('Error al subir icono del servidor:', error);
        this.iconUploadError.set('No se pudo subir el icono. Inténtalo de nuevo.');
      },
    });
  }
}
