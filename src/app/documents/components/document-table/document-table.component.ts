import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { Document } from '../../../core/models/document.model';

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="document-table">
      @if (loading) {
        <div class="flex justify-center my-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (documents.length) {
        <div class="overflow-auto">
          <table mat-table [dataSource]="documents" class="w-full">
            <!-- Title Column with Parent/Child indicator -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let document">
                <div class="flex items-center">
                  @if (document.parent) {
                    <mat-icon 
                      class="text-gray-500 mr-2" 
                      matTooltip="Child document of: {{document.parent.title}}"
                      [routerLink]="['/documents', document.parent.id]"
                      (click)="$event.stopPropagation()">
                      subdirectory_arrow_right
                    </mat-icon>
                  }
                  @if (document.children && document.children.length > 0) {
                    <mat-icon 
                      class="text-primary mr-2" 
                      matTooltip="Has {{document.children.length}} child document(s)"
                      matBadge="{{document.children.length}}"
                      matBadgeColor="accent"
                      matBadgeSize="small">
                      folder
                    </mat-icon>
                  }
                  <a [routerLink]="['/documents', document.id]" class="text-primary hover:underline">
                    {{ document.title }}
                  </a>
                </div>
              </td>
            </ng-container>
            
            <!-- Resource Code Column -->
            <ng-container matColumnDef="resourceCode">
              <th mat-header-cell *matHeaderCellDef>Resource Code</th>
              <td mat-cell *matCellDef="let document">{{ document.resourceCode }}</td>
            </ng-container>
            
            <!-- Resource Type Column -->
            <ng-container matColumnDef="resourceType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let document">{{ document.resourceType?.name || document.resourceTypeName }}</td>
            </ng-container>
            
            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let document">{{ document.status }}</td>
            </ng-container>
            
            <!-- Owner Column -->
            <ng-container matColumnDef="owner">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let document">{{ document.owner?.username || document.owner?.email }}</td>
            </ng-container>
            
            <!-- Mime Type Column -->
            <ng-container matColumnDef="mimeType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let document">
                <span class="flex items-center">
                  <mat-icon class="mr-1 text-gray-500" [matTooltip]="document.mimeType">
                    {{ getFileIcon(document.mimeType) }}
                  </mat-icon>
                  {{ getFileType(document.mimeType) }}
                </span>
              </td>
            </ng-container>
            
            <!-- Created At Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let document">{{ document.createdAt | date:'short' }}</td>
            </ng-container>
            
            <!-- Updated At Column -->
            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef>Updated</th>
              <td mat-cell *matCellDef="let document">{{ document.updatedAt | date:'short' }}</td>
            </ng-container>
            
            <!-- Tags Column -->
            <ng-container matColumnDef="tags">
              <th mat-header-cell *matHeaderCellDef>Tags</th>
              <td mat-cell *matCellDef="let document">
                <div class="flex flex-wrap gap-1">
                  @for (tag of (document.tags || []).slice(0, 2); track tag) {
                    <mat-chip color="primary" selected class="!min-h-6 !h-6 text-xs">{{ tag }}</mat-chip>
                  }
                  @if ((document.tags || []).length > 2) {
                    <span class="text-xs text-gray-500 flex items-center">+{{ (document.tags || []).length - 2 }} more</span>
                  }
                </div>
              </td>
            </ng-container>
            
            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let document">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Document actions" (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/documents', document.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/documents', document.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/documents', document.id, 'acl']">
                    <mat-icon>security</mat-icon>
                    <span>Manage Access</span>
                  </a>
                  <button mat-menu-item (click)="onDelete(document)">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr 
              mat-row 
              *matRowDef="let row; columns: displayedColumns;"
              class="hover:bg-gray-50 cursor-pointer"
              (click)="onRowClick(row)">
            </tr>
          </table>
        </div>
        
        <!-- Pagination -->
        <mat-paginator
          *ngIf="totalItems > 0"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25, 50]"
          [length]="totalItems"
          [pageIndex]="pageIndex"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      } @else {
        <div class="text-center py-8 text-gray-500">
          <mat-icon class="text-5xl">folder_open</mat-icon>
          <p class="mt-2">No documents found</p>
          <p class="text-sm">Try adjusting your filters or create a new document</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .mat-mdc-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class DocumentTableComponent {
  @Input() documents: Document[] = [];
  @Input() loading = false;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  
  @Output() page = new EventEmitter<PageEvent>();
  @Output() delete = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  
  displayedColumns: string[] = ['title', 'resourceCode', 'resourceType', 'status', 'owner', 'mimeType', 'createdAt', 'updatedAt', 'tags', 'actions'];
  
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  
  onPageChange(event: PageEvent): void {
    this.page.emit(event);
  }
  
  onRowClick(document: Document): void {
    this.view.emit(document.id);
  }
  
  onDelete(document: Document, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.delete.emit(document.id);
  }

  getFileIcon(mimeType: string | undefined): string {
    if (!mimeType) return 'insert_drive_file';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'movie';
    if (mimeType.startsWith('audio/')) return 'audiotrack';
    
    switch (mimeType) {
      case 'application/pdf': return 'picture_as_pdf';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        return 'description';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 
        return 'table_chart';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 
        return 'slideshow';
      case 'application/zip':
      case 'application/x-rar-compressed': 
        return 'folder_zip';
      case 'text/plain': return 'text_snippet';
      case 'text/html': return 'html';
      case 'application/json': return 'data_object';
      default: return 'insert_drive_file';
    }
  }

  getFileType(mimeType: string | undefined): string {
    if (!mimeType) return 'Unknown';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    
    switch (mimeType) {
      case 'application/pdf': return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        return 'Word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 
        return 'Excel';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 
        return 'PowerPoint';
      case 'application/zip': return 'ZIP';
      case 'application/x-rar-compressed': return 'RAR';
      case 'text/plain': return 'Text';
      case 'text/html': return 'HTML';
      case 'application/json': return 'JSON';
      default: return mimeType.split('/')[1] || 'File';
    }
  }
}
