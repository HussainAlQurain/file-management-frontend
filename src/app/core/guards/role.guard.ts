import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackbar = inject(SnackbarService);
    
    // First check if user is authenticated
    if (!authService.isAuthenticated()) {
      snackbar.error('You must be logged in to access this page');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    
    // Check if user has the required role
    if (authService.hasRole(requiredRole)) {
      return true;
    }
    
    snackbar.error(`You need ${requiredRole} permission to access this page`);
    router.navigate(['/']);
    return false;
  };
};
