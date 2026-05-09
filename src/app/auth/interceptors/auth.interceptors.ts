import { HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { HttpHandlerFn, HttpEvent } from "@angular/common/http";
import { Observable } from "rxjs";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const token = inject(AuthService).token();
  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${token}`),
  });
  return next(newReq);
}
