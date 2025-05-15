import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { DocumentService } from '../services/document.service';
import { SnackbarService } from '../services/snackbar.service';

export const canViewDocGuard: CanActivateFn = (route) => {
  const documentService = inject(DocumentService);
  const snackbar = inject(SnackbarService);
  
  const documentId = Number(route.paramMap.get('id'));
  if (!documentId) {
    snackbar.error('Invalid document ID');
    return false;
  }
  
  return documentService.get(documentId).pipe(
    map(() => true),
    catchError(() => {
      snackbar.error('You do not have permission to view this document');
      return of(false);
    })
  );
};

export const canEditDocGuard: CanActivateFn = (route) => {
  const documentService = inject(DocumentService);
  const snackbar = inject(SnackbarService);
  
  const documentId = Number(route.paramMap.get('id'));
  if (!documentId) {
    snackbar.error('Invalid document ID');
    return false;
  }
  
  // Try to fetch the document. If backend returns 403, editing is not allowed.
  return documentService.get(documentId).pipe(
    map(() => true),
    catchError(() => {
      snackbar.error('You do not have permission to edit this document');
      return of(false);
    })
  );
};
