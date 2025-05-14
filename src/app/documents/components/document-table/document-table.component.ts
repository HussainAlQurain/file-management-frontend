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
    MatTooltipModule
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
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let document">
                <a [routerLink]="['/documents', document.id]" class="text-primary hover:underline">
                  {{ document.title }}
                </a>
              </td>
            </ng-container>
            
            <!-- Resource Code Column -->
            <ng-container matColumnDef="resourceCode">
              <th mat-header-cell *matHeaderCellDef>Resource Code</th>
              <td mat-cell *matCellDef="let document">{{ document.resourceCode }}</td>
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
              <th mat-header-cell *matHeaderCellDef>Mime Type</th>
              <td mat-cell *matCellDef="let document">{{ document.mimeType }}</td>
            </ng-container>
            
            <!-- Created At Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created At</th>
              <td mat-cell *matCellDef="let document">{{ document.createdAt | date:'medium' }}</td>
            </ng-container>
            
            <!-- Updated At Column -->
            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef>Updated At</th>
              <td mat-cell *matCellDef="let document">{{ document.updatedAt | date:'medium' }}</td>
            </ng-container>
            
            <!-- Field Values Column -->
            <ng-container matColumnDef="fieldValues">
              <th mat-header-cell *matHeaderCellDef>Fields</th>
              <td mat-cell *matCellDef="let document">
                <div *ngIf="document.fieldValues">
                  <div *ngFor="let key of objectKeys(document.fieldValues)">
                    <span class="font-semibold">{{ key }}:</span> {{ document.fieldValues[key] }}<br />
                  </div>
                </div>
              </td>
            </ng-container>
            
            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let document">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Document actions">
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
  `
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
  
  displayedColumns: string[] = ['title', 'resourceCode', 'status', 'owner', 'mimeType', 'createdAt', 'updatedAt', 'fieldValues', 'actions'];
  
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
}
