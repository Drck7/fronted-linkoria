import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FriendshipService } from '../../../../shared/services/friendship.service';
import { UserProfile, UserService } from '../../../../shared/services/user.service';


@Component({
  selector: 'user-profile-page',
  imports: [CommonModule],
  templateUrl: './user-profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly friendshipService = inject(FriendshipService);
  // Servicio de usuarios: lee el perfil desde el backend.
  private readonly userService = inject(UserService);

  // Perfil completo cargado desde el backend.
  readonly profile = signal<UserProfile | null>(null);
  // Indica si la petición está en curso.
  readonly loading = signal(true);
  // Mensaje de error visible en pantalla cuando falla la carga o el guardado.
  readonly error = signal<string | null>(null);
  // Flag que indica si el usuario autenticado ya es amigo del perfil visualizado.
  readonly isFriend = signal(false);

  constructor() {
    effect((onCleanup) => {
      // Nos suscribimos a los parámetros de la ruta para reaccionar cuando cambie `:id`.
      // Esto permite que la misma instancia del componente vuelva a cargar otro perfil
      // si el router navega entre `/users/123` y `/users/456` sin destruir el componente.
      const paramSub = this.route.paramMap.subscribe((params) => {
        // Extraemos el parámetro `id` (identificador del usuario a mostrar)
        const userId = params.get('id');

        // Si no hay id en la ruta, mostramos un error simple y salimos.
        if (!userId) {
          this.profile.set(null);
          this.error.set('Usuario no especificado.');
          this.loading.set(false);
          console.warn('No userId in route params');
          return;
        }

        console.log(`[UserProfilePage] Cargando perfil para userId: ${userId}`);

        // Preparamos el estado para la carga: habilitamos indicador y limpiamos errores previos.
        this.loading.set(true);
        this.error.set(null);

        // Llamamos al servicio para obtener el perfil del usuario solicitado.
        // Guardamos la suscripción para poder cancelarla si cambian los params
        // o cuando el componente se destruya (evitar fugas de memoria).
        const sub = this.userService.getUserProfile(userId).subscribe({
          next: (profile) => {
            // Guardamos el perfil en la señal para que la plantilla lo consuma.
            console.log(`[UserProfilePage] Perfil cargado:`, profile);
            this.profile.set(profile);
            // Comprobamos rápidamente si ya es amigo para ajustar la UI del botón.
            this.isFriend.set(this.friendshipService.isFriend(profile.userId));
            // Desactivamos el indicador de carga.
            this.loading.set(false);
          },
          error: (err) => {
            // En caso de error mostramos un mensaje sencillo y limpiamos el perfil.
            console.error(`[UserProfilePage] Error al cargar perfil para userId: ${userId}`, err);
            this.profile.set(null);
            this.error.set(`No se pudo cargar el perfil. Status: ${err.status || 'desconocido'}`);
            this.loading.set(false);
          },
        });

        // Aseguramos la limpieza de esta suscripción si el efecto se vuelve a ejecutar.
        onCleanup(() => sub.unsubscribe());
      });

      // Cuando el efecto se limpie (componente destruido), también cancelamos la suscripción
      // al paramMap para evitar callbacks posteriores.
      onCleanup(() => paramSub.unsubscribe());
    });
  }

  // Envía una solicitud de amistad al usuario mostrado.
  addFriend(): void {
    // 1) Obtenemos el perfil actualmente mostrado en la página. Si no existe, no hacemos nada.
    const profile = this.profile();
    if (!profile) return;

    // 2) Comprobaciones rápidas en cliente para evitar llamadas inútiles:
    //    - si ya son amigos, o ya hay una petición pendiente enviada, informamos al usuario.
    if (this.friendshipService.isFriend(profile.userId) || this.friendshipService.hasPendingSentRequest(profile.userId)) {
      // Este mensaje es amigable y evita reenviar múltiples requests.
      this.error.set('Ya existe amistad o solicitud pendiente.');
      return;
    }

    // 3) Marcamos la UI como cargando mientras la petición al backend está en vuelo.
    this.loading.set(true);

    // 4) Enviamos la petición de amistad y actualizamos el estado según la respuesta.
    //    Nota: FriendshipService.sendFriendRequest() ya refresca las listas internas cuando
    //    recibe respuesta (see FriendshipService.tap handlers), por eso aquí solo controlamos
    //    la UX inmediata (indicador y mensaje de error si falla).
    this.friendshipService.sendFriendRequest(profile.userId).subscribe({
      next: () => {
        // Petición enviada correctamente; desactivamos el indicador. El servicio
        // actualizará las señales globales de solicitudes pendientes.
        this.loading.set(false);
      },
      error: () => {
        // En caso de fallo mostramos un mensaje genérico. Podrías mapear errores
        // más concretos del backend para mensajes más específicos.
        this.error.set('No se pudo enviar la solicitud.');
        this.loading.set(false);
      },
    });
  }

  // Navega una ruta atrás (usado por el botón Volver en la plantilla).
  goBack(): void {
    // Usamos router.navigate en lugar de history.back() para mantener control del router
    // y que Angular gestione la navegación (guards, resolvers, etc.).
    // Navegamos a la ruta padre relativa: '/users' o lo que defina el árbol de rutas.
    this.router.navigate(['../']);
  }


}
