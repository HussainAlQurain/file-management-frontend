import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {MatChipsModule} from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Document } from '../../core/models/document.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AttachmentListComponent } from '../components/attachment-list/attachment-list.component';
import { TagChipsComponent } from '../components/tag-chips/tag-chips.component';
import { VersionTimelineComponent } from '../components/version-timeline/version-timeline.component';
import { AclDialogComponent } from '../components/acl-dialog/acl-dialog.component';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TagChipsComponent,
    AttachmentListComponent,
    VersionTimelineComponent
  ],
  template: `
    <div class="document-detail-page">
      @if (isLoading()) {
        <div class="flex justify-center my-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (document()) {
        <header class="mb-6">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-2xl font-bold">{{ document()?.title }}</h1>
              <p class="text-gray-500 mt-1">
                <span>{{ document()?.resourceTypeName }}</span>
                <span class="mx-2">•</span>
                <span>Version {{ document()?.version }}</span>
              </p>
            </div>
            
            <div class="flex gap-2">
              <button 
                mat-icon-button 
                color="primary" 
                matTooltip="Manage Access"
                (click)="openAclDialog()">
                <mat-icon>people</mat-icon>
              </button>
              
              <button 
                mat-stroked-button 
                color="primary"
                [routerLink]="['/documents', document()?.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              
              <button 
                mat-stroked-button 
                color="warn"
                (click)="confirmDelete()">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </div>
          </div>
          
          <!-- Tags -->
          <app-tag-chips 
            [tags]="document()?.tags || []"
            [readonly]="true"
            class="mt-3 block">
          </app-tag-chips>
        </header>
        
        <!-- Main Content -->
        <mat-card class="mb-6">
          <mat-card-content>
            <div class="mb-4">
              <h3 class="text-lg font-medium">Description</h3>
              <p class="mt-1">{{ document()?.description || 'No description provided.' }}</p>
            </div>
            
            <mat-divider class="my-4"></mat-divider>
            
            <div class="mt-4">
              <h3 class="text-lg font-medium mb-2">Metadata</h3>
              @if (document()?.metadata && getMetadataKeys().length) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (key of getMetadataKeys(); track key) {
                    <div>
                      <span class="text-gray-500">{{ key }}:</span>
                      <span class="ml-2">{{ document()?.metadata[key] }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-gray-500">No metadata available.</p>
              }
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Tabs for Attachments, Versions, etc. -->
        <mat-tab-group animationDuration="0ms">
          <mat-tab label="Attachments">
            <div class="py-4">
              <app-attachment-list 
                [attachments]="document()?.attachments || []">
              </app-attachment-list>
            </div>
          </mat-tab>
          
          <mat-tab label="Version History">
            <div class="py-4">
              <app-version-timeline 
                [documentId]="document()?.id || 0"
                [currentVersion]="document()?.version || 1">
              </app-version-timeline>
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="text-center py-8 text-gray-500">
          <p>Document not found</p>
          <button 
            mat-flat-button 
            color="primary" 
            class="mt-4"
            routerLink="/documents">
            Return to Documents
          </button>
        </div>
      }
    </div>
  `
})
export class DocumentDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private authService = inject(AuthService);
  
  document = signal<Document | null>(null);
  isLoading = signal(false);
  
  ngOnInit(): void {
    this.loadDocument();
  }
  
  loadDocument(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.snackbar.error('Invalid document ID');
      this.router.navigate(['/documents']);
      return;
    }
    
    this.isLoading.set(true);
    this.documentService.get(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (doc) => {
          this.document.set(doc);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
  
  getMetadataKeys(): string[] {
    const doc = this.document();
    if (!doc?.metadata) return [];
    return Object.keys(doc.metadata);
  }
  
  openAclDialog(): void {
    if (!this.document()?.id) return;
    
    this.dialog.open(AclDialogComponent, {
      width: '500px',
      data: this.document()?.id
    });
  }
  
  confirmDelete(): void {
    if (!this.document()?.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to delete "${this.document()?.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        dangerous: true
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteDocument();
      }
    });
  }
  
  deleteDocument(): void {
    if (!this.document()?.id) return;
    
    this.isLoading.set(true);
    this.documentService.delete(this.document()!.id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.snackbar.success('Document deleted successfully');
          this.router.navigate(['/documents']);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
}
