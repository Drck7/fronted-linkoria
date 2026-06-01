import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ImageUploadService } from '../../../shared/services/image-upload.service';

type ChatComposerSubmission = {
  content: string;
  messageType: 'TEXT' | 'IMAGE';
};

@Component({
  selector: 'chat-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chat-composer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    form {
      width: 100%;
    }
  `],
})
export class ChatComposerComponent {
  private readonly imageUploadService = inject(ImageUploadService);

  readonly submitted = output<ChatComposerSubmission>();
  readonly message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly isUploadingImage = signal(false);
  readonly uploadError = signal<string | null>(null);

  submit(): void {
    const value = this.message.value.trim();

    if (!value) {
      this.message.markAsTouched();
      return;
    }

    this.submitted.emit({
      content: value,
      messageType: 'TEXT',
    });
    this.message.setValue('');
  }

  // Abre el selector de archivos para no mezclar esa lógica con la vista.
  abrirSelectorImagen(inputFile: HTMLInputElement): void {
    inputFile.click();
  }

  // Sube la imagen a Supabase y emite el mensaje como adjunto de chat.
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Selecciona un archivo de imagen válido.');
      return;
    }

    this.uploadError.set(null);
    this.isUploadingImage.set(true);

    this.imageUploadService.subirImagen(file, 'chat').pipe(
      finalize(() => this.isUploadingImage.set(false))
    ).subscribe({
      next: (imageUrl) => {
        this.submitted.emit({
          content: imageUrl,
          messageType: 'IMAGE',
        });
      },
      error: (error) => {
        console.error('Error al subir imagen del chat:', error);
        this.uploadError.set('No se pudo subir la imagen. Inténtalo de nuevo.');
      },
    });
  }
}
