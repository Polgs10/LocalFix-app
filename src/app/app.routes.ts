import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LOGIN_ROUTES } from './login/login-routing';
import { LAYOUT_ROUTES } from './layout/layout/layout-routing';
import { SIGNUP } from './sign-up/sign-up-routing';
import { USER_PROFILE } from './user-profile/user-profile-routing';
import { DETAILS_PROFESSIONAL } from './details-professional/details-professional-routing';
import { USER_PROFILE_PROFESSIONAL } from './user-profile-professional/user-profile-routing';
import { PAYMENT } from './payment/payment-routing';
import { REGISTER_PROFESSIONAL } from './register-professional/register-professional-routing';


export const routes: Routes = [
  { path: 'login', children: LOGIN_ROUTES },
  { path: 'register', children: SIGNUP},
  { path: 'layout/:username', children: LAYOUT_ROUTES },
  { path: 'details-professional/:username/:businessName', children: DETAILS_PROFESSIONAL},
  { path: 'user/profile/:username', children: USER_PROFILE },
  { path: 'user/professional-profile/:username', children: USER_PROFILE_PROFESSIONAL },
  { path: 'user/professional-profile/payment/:username', children: PAYMENT },
  { path: 'user/register/professional-profile/:username', children: REGISTER_PROFESSIONAL },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

export const APP_ROUTER = provideRouter(routes);
