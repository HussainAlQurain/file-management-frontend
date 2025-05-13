import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Only intercept API requests, not assets or other resources
  if (req.url.includes('/api/')) {
    loadingService.show();
    
    return next(req).pipe(
      finalize(() => loadingService.hide())
    );
  }
  
  return next(req);
};
