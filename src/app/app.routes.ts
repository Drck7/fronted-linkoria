import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadChildren: () => import('./linkoria-front/front.rotues')
  }

];
