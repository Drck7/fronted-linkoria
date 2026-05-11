import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { UserProfile, UserService } from '../../../shared/services/user.service';

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

  // Perfil completo cargado desde el backend.
  readonly profile = signal<UserProfile | null>(null);
  // Indica si la petición está en curso.
  readonly loading = signal(true);
  // Mensaje de error visible en pantalla cuando falla la carga o el guardado.
  readonly error = signal<string | null>(null);
  // Controla si el formulario está en modo edición.
  readonly editar = signal(false);

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

}
