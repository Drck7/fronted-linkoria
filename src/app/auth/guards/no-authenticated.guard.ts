import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { first, firstValueFrom } from 'rxjs';

export const NoAuthenticatedGuard: CanMatchFn =async (
  route: Route,
  segments: UrlSegment[]
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await firstValueFrom(authService.checkStatus()) ;
  console.log({isAuthenticated})

  if (isAuthenticated) {
    router.navigate(['/']);
    return false;
  }

/*
  if (authService.authStatus() === 'authenticated') {
    router.navigate(['/']);
    return false;
  }

*/
  return true;
}
