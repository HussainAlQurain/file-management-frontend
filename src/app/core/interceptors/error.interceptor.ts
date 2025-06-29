import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const snackbar = inject(SnackbarService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Auto logout if 401 response returned from api
        authService.logoutWithoutRedirect();
        router.navigate(['/login']);
        snackbar.error('Session expired. Please login again.');
      } else if (error.status === 403) {
        snackbar.error('You do not have permission to perform this action');
      } else if (error.status === 404) {
        snackbar.error('Resource not found');
      } else if (error.status === 0 || error.status >= 500) {
        snackbar.error('Server error. Please try again later.');
      } else {
        // Get the error message from the response if available
        const message = error.error?.message || 'An error occurred';
        snackbar.error(message);
      }
      
      return throwError(() => error);
    })
  );
};
