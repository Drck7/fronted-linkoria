import { Routes } from '@angular/router';

import { ServersAddPage } from './pages/servers-add-page/servers-add-page';

export const serversAddRoutes: Routes = [
  {
    path: '',
    component: ServersAddPage,
  },
];

export default serversAddRoutes;