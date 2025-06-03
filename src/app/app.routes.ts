import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LOGIN_ROUTES } from './login/login-routing';
import { LAYOUT_ROUTES } from './layout/layout/layout-routing';
import { SIGNUP } from './sign-up/sign-up-routing';
import { DETAILS_PROFESSIONAL } from './details-professional/details-professional-routing';


export const routes: Routes = [
  { path: 'login', children: LOGIN_ROUTES },
  { path: 'register', children: SIGNUP},
  { path: 'layout/:username', children: LAYOUT_ROUTES },
  { path: 'details-professional/:businessName', children: DETAILS_PROFESSIONAL},
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

export const APP_ROUTER = provideRouter(routes);
