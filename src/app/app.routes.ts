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
import { AuthGuard } from './auth.guard';


export const routes: Routes = [
  { path: 'login', children: LOGIN_ROUTES },
  { path: 'register', children: SIGNUP},

  { path: 'layout/:username', canActivate: [AuthGuard], children: LAYOUT_ROUTES },
  { path: 'details-professional/:username/:businessName', canActivate: [AuthGuard], children: DETAILS_PROFESSIONAL},
  { path: 'user/profile/:username', canActivate: [AuthGuard], children: USER_PROFILE },
  { path: 'user/professional-profile/:username', canActivate: [AuthGuard], children: USER_PROFILE_PROFESSIONAL },
  { path: 'user/professional-profile/payment/:username', canActivate: [AuthGuard], children: PAYMENT },
  { path: 'user/register/professional-profile/:username', canActivate: [AuthGuard], children: REGISTER_PROFESSIONAL },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

export const APP_ROUTER = provideRouter(routes);
