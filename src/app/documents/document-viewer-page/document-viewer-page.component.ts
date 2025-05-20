import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Document } from '../../core/models/document.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-document-viewer-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else if (document()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              {{ document()?.title || 'Document Viewer' }}
            </mat-card-title>
            <div class="flex-grow"></div>
            <div class="actions">
              <button mat-icon-button (click)="downloadFile()" matTooltip="Download">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button (click)="navigateBack()" matTooltip="Back">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <!-- Simple viewer for PDF files -->
            @if (isPdf()) {
              <iframe 
                [src]="trustedFileUrl()" 
                width="100%" 
                height="600px"
                style="border: none;">
              </iframe>
            } @else {
              <div class="text-center p-8">
                <mat-icon class="text-6xl text-gray-400">description</mat-icon>
                <p class="mt-4">This file type cannot be previewed directly.</p>
                <button mat-raised-button color="primary" class="mt-4" (click)="downloadFile()">
                  <mat-icon>download</mat-icon> Download File
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-center px-4">
          <h2 class="text-2xl font-semibold mb-2">Document Not Found</h2>
          <p class="text-gray-600 mb-6">
            The document you are trying to view could not be loaded.
          </p>
          <button mat-raised-button color="primary" (click)="navigateBack()">
            Go Back
          </button>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class DocumentViewerPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private snackbarService = inject(SnackbarService);
  private sanitizer = inject(DomSanitizer);

  documentId = signal<number | null>(null);
  document = signal<Document | null>(null);
  isLoading = signal(true);
  fileUrl = signal<string | null>(null);
  
  versionNo = signal<number | null>(null); // For viewing a specific version

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const version = params.get('version');
      
      if (id) {
        this.documentId.set(+id);
        
        if (version) {
          this.versionNo.set(+version);
          this.loadDocumentVersion(+id, +version);
        } else {
          this.loadDocument(+id);
        }
      } else {
        this.isLoading.set(false);
        this.snackbarService.error('Document ID not found in URL');
        this.router.navigate(['/documents']);
      }
    });
  }
  
  loadDocument(id: number): void {
    this.documentService.get(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        
        if (doc.storageKey) {
          // Use the document view URL from the service
          this.fileUrl.set(this.documentService.getDocumentViewUrl(id));
        } else {
          this.snackbarService.error('Document has no file attached');
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbarService.error('Failed to load document: ' + (err.error?.message || err.message));
      }
    });
  }
  
  loadDocumentVersion(docId: number, versionNo: number): void {
    // First, load the document to get metadata
    this.documentService.get(docId).subscribe({
      next: (doc) => {
        this.document.set(doc);
        
        // Use the version view URL from the service
        this.fileUrl.set(this.documentService.getVersionViewUrl(docId, versionNo));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbarService.error('Failed to load document: ' + (err.error?.message || err.message));
      }
    });
  }
  
  trustedFileUrl(): SafeResourceUrl {
    return this.fileUrl() ? 
      this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl()!) : 
      '';
  }
  
  isPdf(): boolean {
    const doc = this.document();
    return doc?.mimeType === 'application/pdf';
  }
  
  downloadFile(): void {
    if (!this.fileUrl() || !this.document()) return;
    
    const a = document.createElement('a');
    a.href = this.fileUrl()!;
    a.download = this.document()?.title || 'document';
    a.click();
  }
  
  navigateBack(): void {
    if (this.documentId()) {
      this.router.navigate(['/documents', this.documentId()]);
    } else {
      this.router.navigate(['/documents']);
    }
  }
}
