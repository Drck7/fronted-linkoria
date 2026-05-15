import { ServersPage } from './pages/servers-page/servers-page';
import { ServerDetailPage } from './pages/server-detail-page/server-detail-page';

// Export default routes so they can be loaded with `loadChildren()` uniformly.
export default [
  { path: '', component: ServersPage },
  { path: ':serverId', component: ServerDetailPage }
];
