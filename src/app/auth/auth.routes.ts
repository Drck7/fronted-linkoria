import { AuthLayout } from './layout/auth-layout/auth-layout';
import { Routes } from '@angular/router';
import { LoginPages } from './pages/login-pages/login-pages';
import { RegisterPages } from './pages/register-pages/register-pages';


export const authRoutes:Routes = [
  {
    path: '',
    component: AuthLayout,
    children:[
    {
      path: 'login',
      component: LoginPages
    },
    {
      path: 'register',
      component: RegisterPages
    },
    {
      path:'**',
      redirectTo:'login'
    }
  ]
}];

export default authRoutes;
