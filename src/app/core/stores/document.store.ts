import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DocumentService } from '../services/document.service';
import { Document, DocQuery, Page, DocumentVersionInfo, CreateDocumentDto, UpdateDocumentDto } from '../models/document.model';
import { AclEntryResponse, AclRecordDto } from '../models/acl.model';

interface DocumentState {
  documents: Page<Document>;
  currentDocument: Document | null;
  versions: DocumentVersionInfo[];
  acls: AclEntryResponse[];
  loading: boolean;
  error: HttpErrorResponse | null;
}

const initialState: DocumentState = {
  documents: {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    pageable: { pageNumber: 0, pageSize: 10, sort: { sorted: false, unsorted: true } },
    first: true,
    last: true,
    sort: { sorted: false, unsorted: true },
    numberOfElements: 0,
    empty: true,
  },
  currentDocument: null,
  versions: [],
  acls: [],
  loading: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class DocumentStore {
  private documentService = inject(DocumentService);

  private readonly state = signal(initialState);

  // Selectors
  documents = () => this.state().documents;
  currentDocument = () => this.state().currentDocument;
  versions = () => this.state().versions;
  acls = () => this.state().acls;
  isLoading = () => this.state().loading;
  error = () => this.state().error;

  // Actions
  loadDocuments(query: DocQuery): void {
    this.state.mutate(s => s.loading = true);
    this.documentService.list(query)
      .pipe(
        takeUntilDestroyed(),
        tap(docs => this.state.set({ ...initialState, documents: docs, loading: false })),
        catchError(err => this._handleError(err))
      )
      .subscribe();
  }

  getDocument(id: string): void {
    this.state.mutate(s => s.loading = true);
    this.documentService.get(id)
      .pipe(
        takeUntilDestroyed(),
        tap(doc => this.state.mutate(s => {
          s.currentDocument = doc;
          s.loading = false;
        })),
        catchError(err => this._handleError(err))
      )
      .subscribe();
  }

  createDocument(createDto: CreateDocumentDto): Observable<Document> {
    this.state.mutate(s => s.loading = true);
    return this.documentService.create(createDto).pipe(
      takeUntilDestroyed(),
      tap(newDoc => {
        this.state.mutate(s => {
          s.documents.content = [newDoc, ...s.documents.content];
          s.documents.totalElements++;
          s.currentDocument = newDoc;
          s.loading = false;
        });
      }),
      catchError(err => this._handleError(err))
    );
  }

  updateDocument(id: string, updateDto: UpdateDocumentDto): Observable<Document> {
    this.state.mutate(s => s.loading = true);
    return this.documentService.update(id, updateDto).pipe(
      takeUntilDestroyed(),
      tap(updatedDoc => {
        this.state.mutate(s => {
          s.documents.content = s.documents.content.map(d => d.id === id ? updatedDoc : d);
          s.currentDocument = updatedDoc;
          s.loading = false;
        });
      }),
      catchError(err => this._handleError(err))
    );
  }

  deleteDocument(id: string): Observable<void> {
    this.state.mutate(s => s.loading = true);
    return this.documentService.delete(id).pipe(
      takeUntilDestroyed(),
      tap(() => {
        this.state.mutate(s => {
          s.documents.content = s.documents.content.filter(d => d.id !== id);
          s.documents.totalElements--;
          if (s.currentDocument?.id === id) {
            s.currentDocument = null;
          }
          s.loading = false;
        });
      }),
      catchError(err => this._handleError(err))
    );
  }

  getDocumentVersions(id: string): void {
    this.state.mutate(s => s.loading = true);
    this.documentService.getVersions(id)
      .pipe(
        takeUntilDestroyed(),
        tap(versions => this.state.mutate(s => {
          s.versions = versions;
          s.loading = false;
        })),
        catchError(err => this._handleError(err))
      )
      .subscribe();
  }
  
  // ACL related methods
  loadAcls(documentId: string): void {
    this.state.mutate(s => s.loading = true);
    // Assuming AclService has a method like getAclsForDocument(documentId: string)
    // This part needs to be adjusted based on actual AclService implementation
    // For now, let's assume DocumentService handles this or AclService is injected here
    // If DocumentService.getAcls(documentId) exists:
    /*
    this.documentService.getAcls(documentId) 
      .pipe(
        takeUntilDestroyed(),
        tap(acls => this.state.mutate(s => {
          s.acls = acls;
          s.loading = false;
        })),
        catchError(err => this._handleError(err))
      )
      .subscribe();
    */
    // Placeholder:
    console.warn('loadAcls in DocumentStore needs actual implementation with AclService or DocumentService');
    this.state.mutate(s => s.loading = false);
  }

  grantPermission(documentId: string, aclRecord: AclRecordDto): Observable<AclEntryResponse> {
    this.state.mutate(s => s.loading = true);
    // Assuming AclService.grant(documentId, aclRecord)
    // This part needs to be adjusted
    /*
    return this.aclService.grant(documentId, aclRecord).pipe( // aclService would need to be injected
      takeUntilDestroyed(),
      tap(newAcl => {
        this.state.mutate(s => {
          s.acls = [...s.acls, newAcl];
          s.loading = false;
        });
      }),
      catchError(err => this._handleError(err))
    );
    */
    // Placeholder:
    console.warn('grantPermission in DocumentStore needs actual implementation');
    this.state.mutate(s => s.loading = false);
    return throwError(() => new Error('Grant permission not implemented in store'));
  }

  revokePermission(documentId: string, principalId: string, principalType: string): Observable<void> {
    this.state.mutate(s => s.loading = true);
    // Assuming AclService.revoke(documentId, principalId, principalType)
    /*
    return this.aclService.revoke(documentId, principalId, principalType).pipe( // aclService would need to be injected
      takeUntilDestroyed(),
      tap(() => {
        this.state.mutate(s => {
          s.acls = s.acls.filter(acl => !(acl.principalId === principalId && acl.principalType === principalType));
          s.loading = false;
        });
      }),
      catchError(err => this._handleError(err))
    );
    */
    // Placeholder:
    console.warn('revokePermission in DocumentStore needs actual implementation');
    this.state.mutate(s => s.loading = false);
    return throwError(() => new Error('Revoke permission not implemented in store'));
  }


  private _handleError(error: HttpErrorResponse) {
    this.state.mutate(s => {
      s.error = error;
      s.loading = false;
    });
    return throwError(() => error);
  }

  // Reset state if needed, e.g., on logout or component destruction
  resetState(): void {
    this.state.set(initialState);
  }
}
