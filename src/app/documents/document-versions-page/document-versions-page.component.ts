import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Document, DocumentVersionInfo } from '../../core/models/document.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-document-versions-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoadingDocument() || isLoadingVersions()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else if (document()) {
        <header class="mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">Version History for: {{ document()?.title }}</h1>
            <p class="text-sm text-gray-500">Current Version: {{ document()?.version }}</p>
          </div>
          <button mat-stroked-button [routerLink]="['/documents', document()?.id]">
            <mat-icon>arrow_back</mat-icon>
            Back to Document Details
          </button>
        </header>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Versions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (versions().length > 0) {
              <mat-list>
                @for (version of versions(); track version.version; let i = $index) {
                  <mat-list-item class="h-auto py-3">
                    <mat-icon matListItemIcon>history</mat-icon>
                    <div matListItemTitle class="font-semibold">Version {{ version.version }}</div>
                    <div matListItemLine class="text-sm">
                      Created At: {{ version.createdAt | date:'medium' }}
                    </div>
                    @if (version.createdByName) {
                      <div matListItemLine class="text-sm">
                        By: {{ version.createdByName }}
                      </div>
                    }
                     <!-- Add more version details here if available, e.g., a link to view that specific version if supported -->
                  </mat-list-item>
                  @if (i < versions().length - 1) {
                    <mat-divider></mat-divider>
                  }
                }
              </mat-list>
            } @else {
              <p class="text-center text-gray-500 py-6">No version history found for this document.</p>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="text-center p-8">
          <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
          <h2 class="text-2xl font-semibold mt-4 mb-2">Document Not Found</h2>
          <p class="text-gray-600 mb-6">The document details or version history could not be loaded.</p>
          <button mat-stroked-button routerLink="/documents">
            <mat-icon>arrow_back</mat-icon> Back to Documents List
          </button>
        </mat-card>
      }
    </div>
  `
})
export class DocumentVersionsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private snackbar = inject(SnackbarService);

  documentId = signal<number | null>(null);
  document: WritableSignal<Document | null> = signal(null);
  versions: WritableSignal<DocumentVersionInfo[]> = signal([]);

  isLoadingDocument = signal(true);
  isLoadingVersions = signal(true);

  constructor() {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocumentDetails(+id);
        this.loadVersionHistory(+id);
      } else {
        this.isLoadingDocument.set(false);
        this.isLoadingVersions.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  loadDocumentDetails(id: number): void {
    this.isLoadingDocument.set(true);
    this.documentService.get(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.isLoadingDocument.set(false);
      },
      error: (err) => {
        this.isLoadingDocument.set(false);
        this.snackbar.error('Failed to load document details: ' + (err.error?.message || err.message));
        // Optionally navigate away or show a more specific error for the document part
      }
    });
  }

  loadVersionHistory(id: number): void {
    this.isLoadingVersions.set(true);
    this.documentService.getVersions(id).subscribe({
      next: (versionHistory) => {
        this.versions.set(versionHistory.sort((a, b) => b.version - a.version)); // Sort by version descending
        this.isLoadingVersions.set(false);
      },
      error: (err) => {
        this.isLoadingVersions.set(false);
        this.snackbar.error('Failed to load version history: ' + (err.error?.message || err.message));
      }
    });
  }
}
