import { Routes } from "@angular/router"  ;
import { LinkoriaFrontLayout } from "./layout/linkoria-front-layout/linkoria-front-layout";
import { OnlinePage } from "./paginas/online-page/online-page";
import { NotifyPage } from "./paginas/notify-pages/notify-pages";
import { NotFoundPage } from "./paginas/not-found-page/not-found-page";
import { HomePage } from "./paginas/home-page/home-page";
import { SearchUsersPage } from "./paginas/search-users-page/search-users-page";
import { ProfilePage } from "./paginas/profile-page/profile-page";
import { UserProfilePage } from "./paginas/user-profile-page/user-profile-page/user-profile-page";

export const linkoriaFrontRoutes = [
  {
    path: '',
    component: LinkoriaFrontLayout,
    children:[
        {
          path: '',
          component: HomePage
        },
        {
          path: 'users/all',
          component: HomePage
        },
        {
          path: 'users/online',
          component: OnlinePage
        },
        {
          path: 'users/search',
          component: SearchUsersPage
        },
        {
          path: 'users/notify',
          component: NotifyPage
        },
        {
          path: 'profile',
          component: ProfilePage
        },
        {
          path: 'users/:id',
          component: UserProfilePage
        },
        {
          path: 'chat',
          loadChildren: () => import('../chat/chat.routes')
        },

        {
          path:'**',
          component:NotFoundPage
        }
    ]
  }
,

  {
    path:'**',
    redirectTo:''
  }
]
export default linkoriaFrontRoutes;
