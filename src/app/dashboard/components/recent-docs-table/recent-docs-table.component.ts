import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Document } from '../../../core/models/document.model';

@Component({
  selector: 'app-recent-docs-table',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="overflow-auto">
      @if (loading) {
        <div class="flex justify-center my-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (documents.length) {
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
          
          <!-- Resource Type Column -->
          <ng-container matColumnDef="resourceType">
            <th mat-header-cell *matHeaderCellDef>Resource Type</th>
            <td mat-cell *matCellDef="let document">{{ document.resourceTypeName }}</td>
          </ng-container>
          
          <!-- Tags Column -->
          <ng-container matColumnDef="tags">
            <th mat-header-cell *matHeaderCellDef>Tags</th>
            <td mat-cell *matCellDef="let document">
              <div class="flex flex-wrap gap-1">
                @for (tag of document.tags.slice(0, 3); track tag) {
                  <mat-chip color="primary" selected>{{ tag }}</mat-chip>
                }
                @if (document.tags.length > 3) {
                  <span class="text-xs text-gray-500">+{{ document.tags.length - 3 }} more</span>
                }
              </div>
            </td>
          </ng-container>
          
          <!-- Created At Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let document">
              {{ document.createdAt | date:'medium' }}
            </td>
          </ng-container>
          
          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let document">
              <button 
                mat-icon-button 
                color="primary" 
                [routerLink]="['/documents', document.id]"
                matTooltip="View Document">
                <mat-icon>visibility</mat-icon>
              </button>
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
      } @else {
        <div class="text-center py-8 text-gray-500">
          <p>No documents available</p>
        </div>
      }
    </div>
  `
})
export class RecentDocsTableComponent {
  @Input() documents: Document[] = [];
  @Input() loading = false;
  @Output() documentSelected = new EventEmitter<number>();
  
  displayedColumns: string[] = ['title', 'resourceType', 'tags', 'createdAt', 'actions'];
  
  onRowClick(document: Document): void {
    this.documentSelected.emit(document.id);
  }
}
