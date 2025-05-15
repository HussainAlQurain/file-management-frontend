import { Component, OnInit, inject, signal, WritableSignal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';

import { DocumentService } from '../../core/services/document.service';
import { Document, Attachment } from '../../core/models/document.model';
import { SnackbarService } from '../../core/services/snackbar.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else {
        @if (document(); as doc) {
          @if(doc) {
            <mat-card class="mb-6">
              <mat-card-header class="!pb-2">
                <mat-card-title class="text-2xl font-semibold flex flex-col gap-1">
                  {{ doc.title }}
                  <span class="text-base font-normal text-gray-600">Resource Code: {{ doc.resourceCode }}</span>
                </mat-card-title>
                <mat-card-subtitle>
                  Resource Type: {{ doc.resourceType?.name || doc.resourceType?.code || 'N/A' }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="mb-4 flex items-center gap-2">
                  <mat-icon color="primary">description</mat-icon>
                  <span class="font-semibold">Primary File:</span>
                  @if (doc.storageKey) {
                    <button mat-stroked-button color="primary" (click)="downloadLatestPrimaryFile(doc)">
                      <mat-icon>download</mat-icon> Download Current Version
                    </button>
                  } @else {
                    <span class="text-gray-500">No file uploaded yet.</span>
                  }
                  <label class="ml-4">
                    <input type="file" hidden (change)="onPrimaryFileSelected($event)" #fileInput />
                    <button mat-stroked-button color="accent" type="button" (click)="fileInput.click()">
                      <mat-icon>upload</mat-icon> Upload Primary File
                    </button>
                  </label>
                </div>
                @if (doc.description) {
                  <p class="text-gray-700 mb-4">{{ doc.description }}</p>
                }
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                  <div><strong>ID:</strong> {{ doc.id }}</div>
                  <div><strong>Resource Type:</strong> {{ doc.resourceType?.name || doc.resourceType?.code || 'N/A' }}</div>
                  <div><strong>Resource Code:</strong> {{ doc.resourceCode }}</div>
                  <div><strong>Status:</strong> {{ doc.status }}</div>
                  <div><strong>Created By:</strong> {{ doc.owner?.username || doc.owner?.email || 'System' }}</div>
                  <div><strong>Created At:</strong> {{ doc.createdAt | date:'medium' }}</div>
                  <div><strong>Updated At:</strong> {{ doc.updatedAt | date:'medium' }}</div>
                </div>
                @if (doc.fieldValues && getFieldValueKeys(doc.fieldValues).length > 0) {
                  <div class="mb-4">
                    <h3 class="text-lg font-medium mb-2">Field Values</h3>
                    <mat-list role="list">
                      @for (item of doc.fieldValues | keyvalue; track item.key) {
                        <mat-list-item role="listitem" class="h-auto py-2">
                          <div matListItemTitle class="font-semibold">{{ item.key }}:</div>
                          <div matListItemLine class="whitespace-pre-wrap">{{ formatFieldValue(item.value) }}</div>
                        </mat-list-item>
                        <mat-divider></mat-divider>
                      }
                    </mat-list>
                  </div>
                }
                @if (doc.attachments && doc.attachments.length) {
                  <div class="mb-4">
                    <h3 class="text-lg font-medium mb-2">Attachments ({{doc.attachments.length}})</h3>
                    <mat-list role="list">
                      @for (attachment of doc.attachments; track attachment.id) {
                        <mat-list-item role="listitem" class="h-auto py-2">
                          <mat-icon matListItemIcon>attachment</mat-icon>
                          <div matListItemTitle class="font-medium">{{ attachment.fileName }}</div>
                          <div matListItemLine class="text-xs text-gray-500">
                            Size: {{ attachment.fileSize }} | Type: {{ attachment.contentType }}
                          </div>
                          <div matListItemMeta>
                            <button mat-icon-button (click)="downloadAttachment(attachment.id, attachment.fileName)" matTooltip="Download {{attachment.fileName}}">
                              <mat-icon>download</mat-icon>
                            </button>
                          </div>
                        </mat-list-item>
                        <mat-divider></mat-divider>
                      }
                    </mat-list>
                  </div>
                }
                <div class="flex gap-2 mt-4">
                  <button mat-stroked-button color="primary" [routerLink]="['/documents', doc.id, 'edit']">
                    <mat-icon>edit</mat-icon> Edit Document
                  </button>
                  <button mat-stroked-button [routerLink]="['/documents', doc.id, 'acl']">
                    <mat-icon>security</mat-icon> Manage ACL
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <mat-card class="text-center p-8">
              <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
              <h2 class="text-2xl font-semibold mt-4 mb-2">Document Not Found</h2>
              <p class="text-gray-600 mb-6">The document you are looking for does not exist or could not be loaded.</p>
              <button mat-stroked-button routerLink="/documents">
                <mat-icon>arrow_back</mat-icon> Back to Documents List
              </button>
            </mat-card>
          }
        } @else {
          <mat-card class="text-center p-8">
            <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
            <h2 class="text-2xl font-semibold mt-4 mb-2">Document data is unavailable</h2>
            <button mat-stroked-button routerLink="/documents">
              <mat-icon>arrow_back</mat-icon> Back to Documents List
            </button>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    mat-list-item {
      height: auto !important; /* Override default fixed height */
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }
    .mat-mdc-list-item-unscoped-content {
      width: 100%;
    }
  `]
})
export class DocumentDetailPageComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  isLoading = signal(true);
  document: WritableSignal<Document | null> = signal(null);
  documentId = signal<number | null>(null);
  apiBaseUrl = environment.apiBase;
  versions: any[] = [];
  versionsLoaded = false;
  versionsLoading = false;
  private versionsSub?: Subscription;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocument(+id);
      } else {
        this.isLoading.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  loadDocument(id: number): void {
    this.isLoading.set(true);
    this.documentService.get(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.document.set(null);
        this.snackbar.error('Failed to load document: ' + (err.error?.message || err.message));
      }
    });
  }

  downloadLatestPrimaryFile(doc: Document): void {
    if (!doc || !doc.id || !doc.storageKey) return;
    this.documentService.downloadLatestPrimaryFile(doc.id, doc.storageKey).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title || `document_${doc.id}_latest`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download file: ' + (err.error?.message || err.message));
      }
    });
  }

  downloadAttachment(attachmentId: number, fileName: string): void {
    this.documentService.downloadAttachment(attachmentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `attachment_${attachmentId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download attachment: ' + (err.error?.message || err.message));
      }
    });
  }

  onPrimaryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.documentId()) {
      const file = input.files[0];
      this.documentService.uploadNewPrimaryVersion(this.documentId()!, file).subscribe({
        next: () => {
          this.snackbar.success('New version uploaded successfully.');
          this.loadDocument(this.documentId()!); // Refresh document details
        },
        error: (err) => {
          this.snackbar.error('Failed to upload new version: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  getAttachmentDownloadUrl(attachment: Attachment): string {
    if (!this.documentId()) return '#';
    return `${this.apiBaseUrl}/documents/${this.documentId()}/files/${attachment.storageKey}`;
  }

  getVersionDownloadUrl(docId: number, versionNo: number): string {
    return `${this.apiBaseUrl}/documents/${docId}/versions/${versionNo}/file`;
  }

  getFieldValueKeys(fieldValues: Record<string, any> | undefined | null): string[] {
    return fieldValues ? Object.keys(fieldValues) : [];
  }

  formatFieldValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') { 
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string' && value.startsWith('http')) {
        return value;
    }
    return String(value);
  }

  loadVersions(): void {
    if (!this.documentId()) return;
    this.versionsLoading = true;
    this.versionsSub = this.documentService
      .getVersions(this.documentId()!)
      .subscribe({
        next: (data) => {
          this.versions = data;
          this.versionsLoaded = true;
          this.versionsLoading = false;
        },
        error: () => {
          this.versions = [];
          this.versionsLoaded = true;
          this.versionsLoading = false;
        }
      });
  }

  downloadVersion(docId: number, versionNo: number, fileName: string): void {
    this.documentService.downloadVersionFile(docId, versionNo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `document_${docId}_v${versionNo}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download file: ' + (err.error?.message || err.message));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.versionsSub) this.versionsSub.unsubscribe();
  }
}
