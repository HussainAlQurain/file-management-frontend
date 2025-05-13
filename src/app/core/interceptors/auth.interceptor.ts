import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    const authHeaderValue = `Bearer ${token}`;
    
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', authHeaderValue)
    });
    
    return next(clonedReq);
  }
  
  return next(req);
};
