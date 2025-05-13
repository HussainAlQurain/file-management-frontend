import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  snackbar.error('You must be logged in to access this page');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
