import { Routes } from '@angular/router';
import { DirectMessagesPage } from './pages/direct-messages-page/direct-messages-page';

export const chatRoutes: Routes = [
  {
    path: '',
    component: DirectMessagesPage,
  },
  {
    path: ':username',
    component: DirectMessagesPage,
  },
];

export default chatRoutes;
