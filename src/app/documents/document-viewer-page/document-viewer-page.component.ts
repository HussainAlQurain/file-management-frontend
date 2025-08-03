import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Translation imports
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../core/services/translation.service';

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
    TranslateModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  template: `
    <div class="p-4 md:p-8 document-viewer-container" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else if (document()) {
        <mat-card class="document-viewer-card">
          <mat-card-header>
            <mat-card-title>
              {{ document()?.title || ('documents.viewer.title' | translate) }}
            </mat-card-title>
            <div class="flex-grow"></div>
            <div class="actions">
              <button mat-icon-button (click)="downloadFile()" [matTooltip]="'documents.viewer.actions.download' | translate">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button (click)="navigateBack()" [matTooltip]="'documents.viewer.actions.back' | translate">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <!-- Viewer for PDF files -->
            @if (isPdf()) {
              <iframe 
                [src]="trustedFileUrl()" 
                width="100%" 
                height="600px"
                style="border: none;">
              </iframe>
            } @else if (isImage()) {
              <!-- Image viewer -->
              <div class="text-center">
                <img 
                  [src]="fileUrl()" 
                  [alt]="document()?.title || 'Document Image'"
                  class="max-w-full max-h-[80vh] mx-auto rounded-lg shadow-lg object-contain image-viewer"
                  style="border: 1px solid #e0e0e0; transition: transform 0.3s ease; cursor: zoom-in;"
                  (error)="onImageError($event)"
                  (mouseover)="onImageHover($event, true)"
                  (mouseout)="onImageHover($event, false)">
              </div>
            } @else {
              <div class="text-center p-8">
                <mat-icon class="text-6xl text-gray-400">description</mat-icon>
                <p class="mt-4">{{ 'documents.viewer.messages.cannot_preview' | translate }}</p>
                <button mat-raised-button color="primary" class="mt-4" (click)="downloadFile()">
                  <mat-icon>download</mat-icon> {{ 'documents.viewer.actions.download_file' | translate }}
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-center px-4">
          <h2 class="text-2xl font-semibold mb-2">{{ 'documents.viewer.messages.not_found' | translate }}</h2>
          <p class="text-gray-600 mb-6">
            {{ 'documents.viewer.messages.not_found_description' | translate }}
          </p>
          <button mat-raised-button color="primary" (click)="navigateBack()">
            {{ 'documents.viewer.messages.go_back' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .document-viewer-container {
      max-width: 100%;
      overflow-x: auto;
    }
    
    .image-viewer {
      transition: transform 0.3s ease;
      cursor: zoom-in;
    }
    
    .image-viewer:hover {
      transform: scale(1.02);
    }
  `]
})
export class DocumentViewerPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private snackbarService = inject(SnackbarService);
  private sanitizer = inject(DomSanitizer);
  private translateService = inject(TranslateService);
  public translationService = inject(TranslationService);

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
        this.snackbarService.error(this.translateService.instant('documents.viewer.messages.loading_error'));
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
          this.snackbarService.error(this.translateService.instant('documents.viewer.messages.no_file'));
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbarService.error(this.translateService.instant('documents.viewer.messages.loading_error') + ': ' + (err.error?.message || err.message));
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
        this.snackbarService.error(this.translateService.instant('documents.viewer.messages.loading_error') + ': ' + (err.error?.message || err.message));
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
  
  isImage(): boolean {
    const doc = this.document();
    if (!doc?.mimeType) return false;
    
    const imageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];
    
    return imageTypes.includes(doc.mimeType.toLowerCase());
  }
  
  onImageError(event: any): void {
    console.error('Failed to load image:', event);
    this.snackbarService.error(this.translateService.instant('documents.viewer.messages.image_load_error'));
  }
  
  onImageHover(event: Event, isHover: boolean): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.transform = isHover ? 'scale(1.02)' : 'scale(1)';
    }
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
