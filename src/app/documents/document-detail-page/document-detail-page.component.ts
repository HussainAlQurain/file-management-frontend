import { Component, OnInit, inject, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule, DatePipe, KeyValuePipe } from '@angular/common';
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
    DatePipe,
    KeyValuePipe,
    FileSizePipe,
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
                <mat-card-title class="text-2xl font-semibold">{{ doc.title }}</mat-card-title>
                <mat-card-subtitle>
                  Resource Type: {{ doc.resourceTypeName || 'N/A' }} | Version: {{ doc.version }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (doc.description) {
                  <p class="text-gray-700 mb-4">{{ doc.description }}</p>
                }
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                  <div><strong>ID:</strong> {{ doc.id }}</div>
                  <div><strong>Created By:</strong> {{ doc.createdByName || 'System' }}</div>
                  <div><strong>Created At:</strong> {{ doc.createdAt | date:'medium' }}</div>
                  <div><strong>Updated At:</strong> {{ doc.updatedAt | date:'medium' }}</div>
                </div>

                @if (doc.tags && doc.tags.length) {
                  <div class="mb-4">
                    <strong class="mr-2">Tags:</strong>
                    <mat-chip-listbox aria-label="Document tags">
                      @for (tag of doc.tags; track tag) {
                        <mat-chip disabled>{{tag}}</mat-chip>
                      }
                    </mat-chip-listbox>
                  </div>
                }
              </mat-card-content>
              <mat-card-actions class="!pt-0 !pb-3 !px-4">
                <button mat-stroked-button color="primary" [routerLink]="['/documents', doc.id, 'edit']">
                  <mat-icon>edit</mat-icon> Edit Document
                </button>
                <button mat-stroked-button [routerLink]="['/documents', doc.id, 'acl']">
                  <mat-icon>security</mat-icon> Manage ACL
                </button>
                <button mat-stroked-button [routerLink]="['/documents', doc.id, 'versions']">
                  <mat-icon>history</mat-icon> View Versions
                </button>
              </mat-card-actions>
            </mat-card>

            <mat-tab-group animationDuration="0ms">
              <mat-tab label="Attachments">
                <div class="py-4">
                  @if (doc.attachments && doc.attachments.length) {
                    <h3 class="text-xl font-medium mb-3">Attachments ({{doc.attachments.length}})</h3>
                    <mat-list role="list">
                      @for (attachment of doc.attachments; track attachment.id) {
                        <mat-list-item role="listitem" class="h-auto py-2">
                          <mat-icon matListItemIcon>attachment</mat-icon>
                          <div matListItemTitle class="font-medium">{{ attachment.fileName }}</div>
                          <div matListItemLine class="text-xs text-gray-500">
                            Size: {{ attachment.fileSize | fileSize }} | Type: {{ attachment.contentType }}
                          </div>
                          <div matListItemMeta>
                            <a mat-icon-button [href]="getAttachmentDownloadUrl(attachment)" target="_blank" matTooltip="Download {{attachment.fileName}}">
                              <mat-icon>download</mat-icon>
                            </a>
                          </div>
                        </mat-list-item>
                        <mat-divider></mat-divider>
                      }
                    </mat-list>
                  } @else {
                    <p class="text-gray-500 text-center py-6">No attachments found for this document.</p>
                  }
                </div>
              </mat-tab>

              <mat-tab label="Metadata">
                <div class="py-4">
                  @if (getMetadataKeys(doc.metadata).length > 0) {
                    <h3 class="text-xl font-medium mb-3">Metadata</h3>
                    <mat-list role="list">
                      @for (item of doc.metadata | keyvalue; track item.key) {
                        <mat-list-item role="listitem" class="h-auto py-2">
                          <div matListItemTitle class="font-semibold">{{ item.key }}:</div>
                          <div matListItemLine class="whitespace-pre-wrap">{{ formatMetadataValue(item.value) }}</div>
                        </mat-list-item>
                         <mat-divider></mat-divider>
                      }
                    </mat-list>
                  } @else {
                    <p class="text-gray-500 text-center py-6">No metadata available for this document.</p>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
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
        } @else { <!-- This case should ideally not be reached if document() is initialized to null and loading works -->
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
export class DocumentDetailPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  isLoading = signal(true);
  document: WritableSignal<Document | null> = signal(null);
  documentId = signal<number | null>(null);
  apiBaseUrl = environment.apiBase;

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

  getAttachmentDownloadUrl(attachment: Attachment): string {
    if (!this.documentId()) return '#';
    return `${this.apiBaseUrl}/documents/${this.documentId()}/files/${attachment.key}`;
  }

  getMetadataKeys(metadata: Record<string, any> | undefined | null): string[] {
    return metadata ? Object.keys(metadata) : [];
  }

  formatMetadataValue(value: any): string {
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
}
