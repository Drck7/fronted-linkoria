import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { UserProfile, UserService } from '../../../shared/services/user.service';
import { ImageUploadService } from '../../../shared/services/image-upload.service';

@Component({
  selector: 'profile-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  // Servicio de sesión: da acceso al usuario autenticado y permite refrescar su nombre en el navbar.
  private readonly authService = inject(AuthService);
  // Servicio de usuarios: lee y actualiza el perfil desde el backend.
  private readonly userService = inject(UserService);
  // Servicio compartido de imágenes: sube archivos a Supabase y devuelve la URL pública.
  private readonly imageUploadService = inject(ImageUploadService);

  // Perfil completo cargado desde el backend.
  readonly profile = signal<UserProfile | null>(null);
  // Indica si la petición está en curso.
  readonly loading = signal(true);
  // Mensaje de error visible en pantalla cuando falla la carga o el guardado.
  readonly error = signal<string | null>(null);
  // Controla si el formulario está en modo edición.
  readonly editar = signal(false);
  // Indica si se está subiendo un avatar desde el selector de archivos.
  readonly isUploadingAvatar = signal(false);
  // Mensaje de error específico de la subida de avatar.
  readonly avatarUploadError = signal<string | null>(null);

  readonly currentUser = computed(() => this.authService.user());
  readonly currentUserId = computed(() => this.currentUser()?.userId ?? null);

  // Formulario reactivo para editar solo los campos permitidos por Swagger.
  readonly profileForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    avatarUrl: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect((onCleanup) => {
      const userId = this.currentUserId();

      if (!userId) {
        this.profile.set(null);
        this.error.set('No hay una sesión activa.');
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.error.set(null);

      const subscription = this.userService.getUserProfile(userId).subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.setValue({
            username: profile.username,
            avatarUrl: profile.avatarUrl ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.profile.set(null);
          this.error.set('No se pudo cargar tu perfil.');
          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  editarPerfil(): void {
    const profile = this.profile();

    if (!profile) {
      return;
    }

    this.profileForm.setValue({
      username: profile.username,
      avatarUrl: profile.avatarUrl ?? '',
    });
    this.editar.set(true);
    this.error.set(null);
  }

  cancelarEditar(): void {
    const profile = this.profile();

    if (profile) {
      this.profileForm.setValue({
        username: profile.username,
        avatarUrl: profile.avatarUrl ?? '',
      });
    }

    this.editar.set(false);
  }

  guardarPerfil(): void {
    const userId = this.currentUserId();

    if (!userId || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      username: this.profileForm.value.username?.trim(),
      avatarUrl: this.profileForm.value.avatarUrl?.trim() || undefined,
    };

    this.userService.updateUserProfile(userId, payload).subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.profileForm.setValue({
          username: updatedProfile.username,
          avatarUrl: updatedProfile.avatarUrl ?? '',
        });
        this.authService.updateCurrentUser({ username: updatedProfile.username });
        this.editar.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo actualizar tu perfil.');
        this.loading.set(false);
      },
    });
  }

  // Abre el selector de archivos para elegir un avatar nuevo.
  abrirSelectorAvatar(inputFile: HTMLInputElement): void {
    inputFile.click();
  }

  // Sube el avatar a Supabase y deja la URL lista en el formulario.
  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.avatarUploadError.set('Selecciona una imagen válida para el avatar.');
      return;
    }

    this.avatarUploadError.set(null);
    this.isUploadingAvatar.set(true);

    this.imageUploadService.subirImagen(file, 'perfiles').pipe(
      finalize(() => this.isUploadingAvatar.set(false))
    ).subscribe({
      next: (imageUrl) => {
        this.profileForm.patchValue({
          avatarUrl: imageUrl,
        });
        this.editar.set(true);
      },
      error: (error) => {
        console.error('Error al subir avatar:', error);
        this.avatarUploadError.set('No se pudo subir el avatar. Inténtalo de nuevo.');
      },
    });
  }

}
