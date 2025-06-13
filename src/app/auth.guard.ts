import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = !!authService.getAccessToken();

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
