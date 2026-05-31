import { ServersPage } from './pages/servers-page/servers-page';
import { ServersBuscarPage } from './pages/servers-buscar-page/servers-buscar-page';
import { ServersAddPage } from './pages/servers-add-page/servers-add-page';

// Export default routes so they can be loaded with `loadChildren()` uniformly.
export default [
  { path: '', component: ServersPage },
  { path: 'buscar', component: ServersBuscarPage },
  { path: 'add', component: ServersAddPage },
  { path: ':serverId', component: ServersPage }
];
