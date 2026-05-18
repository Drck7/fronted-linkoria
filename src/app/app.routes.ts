import { Routes } from '@angular/router';
import { NoAuthenticatedGuard } from './auth/guards/no-authenticated.guard';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';

export const routes: Routes = [

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canMatch: [NoAuthenticatedGuard]

  },
  {
    path: '',
    canMatch: [AuthenticatedGuard],
    loadChildren: () => import('./linkoria-front/front.routes')
  }

];
