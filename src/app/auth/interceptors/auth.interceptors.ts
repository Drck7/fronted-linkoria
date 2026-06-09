import { HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { HttpHandlerFn, HttpEvent } from "@angular/common/http";
import { Observable, catchError, switchMap, throwError } from "rxjs";
import { Router } from "@angular/router";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  // 1. Agregar token a la petición si existe
  let newReq = req;
  if (token) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  // 2. Pasar la petición y capturar respuesta/error
  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Si es 401 (Unauthorized), intentar renovar token
      if (error.status === 401) {
        // Evitar reintentos infinitos en las peticiones de refresh
        if (req.url.includes('/auth/refresh')) {
          authService.clearSession();
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }

        // Intentar renovar el token
        return authService.checkStatus().pipe(
          switchMap((renovado) => {
            // Renovación exitosa: reintentar la petición original con token nuevo
            if (renovado) {
              const nuevoToken = authService.token();
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${nuevoToken}`),
              });
              return next(retryReq);
            }
            // Renovación falló: redirigir a login
            return throwError(() => new Error('No se pudo renovar la sesión'));
          }),
          catchError((err) => {
            // Si falla el refresh, limpiar sesión y redirigir
            authService.clearSession();
            router.navigate(['/auth/login']);
            return throwError(() => err);
          })
        );
      }
      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
}
