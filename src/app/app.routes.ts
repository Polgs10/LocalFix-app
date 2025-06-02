import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LOGIN_ROUTES } from './login/login-routing';
import { LAYOUT_ROUTES } from './layout/layout/layout-routing';
import { SIGNUP } from './sign-up/sign-up-routing';


export const routes: Routes = [
  { path: 'login', children: LOGIN_ROUTES },
  { path: 'register', children: SIGNUP},
  { path: 'layout', children: LAYOUT_ROUTES },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

export const APP_ROUTER = provideRouter(routes);
