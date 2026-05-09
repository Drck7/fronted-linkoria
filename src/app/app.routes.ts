import { Routes } from '@angular/router';
import { NoAuthenticatedGuard } from './auth/guards/no-authenticated.guard';

export const routes: Routes = [

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canMatch: [NoAuthenticatedGuard]

  },
  {
    path: '',
    loadChildren: () => import('./linkoria-front/front.routes')
  }

];
