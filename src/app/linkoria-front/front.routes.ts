import { Routes } from "@angular/router"  ;
import { LinkoriaFrontLayout } from "./layout/linkoria-front-layout/linkoria-front-layout";
import { OnlinePage } from "./paginas/online-page/online-page";
import { PendingPages } from "./paginas/pending-pages/pending-pages";
import { NotFoundPage } from "./paginas/not-found-page/not-found-page";
import { HomePage } from "./paginas/home-page/home-page";

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
          path: 'chat',
          loadChildren: () => import('../chat/chat.routes')
        },
        {
          path: 'pending/:pending',
          component: PendingPages
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
