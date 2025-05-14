import { Component, OnInit, inject, signal, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { ResourceType } from '../../../core/models/resource-type.model';
import { Page } from '../../../core/models/document.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-resource-type-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold">Resource Type Management</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Create Resource Type
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          @if (isLoading()) {
            <div class="flex justify-center items-center py-8">
              <mat-spinner diameter="50"></mat-spinner>
            </div>
          } @else {
            @if (!dataSource.data.length && !isLoading()) {
              <div class="text-center py-8">
                <p class="text-xl text-gray-500">No resource types found.</p>
                <p class="mt-2">Click "Create Resource Type" to add a new one.</p>
              </div>
            } @else {
              <div class="overflow-auto">
                <table mat-table [dataSource]="dataSource" matSort (matSortChange)="announceSortChange($event)" class="w-full">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                    <td mat-cell *matCellDef="let rt">{{rt.id}}</td>
                  </ng-container>

                  <!-- Code Column -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Code</th>
                    <td mat-cell *matCellDef="let rt">{{rt.code}}</td>
                  </ng-container>

                  <!-- Description Column -->
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
                    <td mat-cell *matCellDef="let rt" class="truncate max-w-xs">{{rt.description || '-'}}</td>
                  </ng-container>

                  <!-- Fields Count Column -->
                  <ng-container matColumnDef="fieldsCount">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Fields</th>
                    <td mat-cell *matCellDef="let rt">{{rt.fields?.length || 0}}</td>
                  </ng-container>

                  <!-- Created At Column -->
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Created At</th>
                    <td mat-cell *matCellDef="let rt">{{rt.createdAt | date:'medium'}}</td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
                    <td mat-cell *matCellDef="let rt" class="text-right">
                      <button mat-icon-button [routerLink]="[rt.id]" matTooltip="Edit Resource Type">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="onDeleteResourceType(rt)" matTooltip="Delete Resource Type">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
              <mat-paginator 
                [length]="totalElements()" 
                [pageSize]="pageSize()" 
                [pageSizeOptions]="[5, 10, 25, 100]"
                (page)="handlePageEvent($event)"
                aria-label="Select page of resource types">
              </mat-paginator>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ResourceTypeListPageComponent implements OnInit {
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  isLoading = signal(true);
  resourceTypesPage: WritableSignal<Page<ResourceType> | null> = signal(null);
  
  dataSource = new MatTableDataSource<ResourceType>([]);
  displayedColumns: string[] = ['id', 'code', 'description', 'fieldsCount', 'createdAt', 'actions'];

  currentPage = signal(0);
  pageSize = signal(10);
  sortActive = signal('createdAt');
  sortDirection = signal<'asc' | 'desc' | '' >('desc');
  totalElements = signal(0);

  constructor() {
    effect(() => {
      this.loadResourceTypes(
        this.currentPage(), 
        this.pageSize(), 
        this.sortActive(), 
        this.sortDirection() as 'asc' | 'desc'
      );
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the effect
  }

  loadResourceTypes(page: number, size: number, sort: string, direction: 'asc' | 'desc'): void {
    this.isLoading.set(true);
    const params: Record<string, any> = { page, size };
    if (sort && direction) {
      params['sort'] = `${sort},${direction}`;
    }

    this.resourceTypeService.list(params).subscribe({
      next: (pageData) => {
        this.resourceTypesPage.set(pageData);
        this.dataSource.data = pageData.content;
        this.totalElements.set(pageData.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load resource types: ' + (err.error?.message || err.message));
        this.dataSource.data = [];
        this.totalElements.set(0);
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.isLoading.set(true);
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  announceSortChange(sortState: Sort): void {
    this.isLoading.set(true);
    this.currentPage.set(0);
    this.sortActive.set(sortState.active);
    this.sortDirection.set(sortState.direction);
  }

  onDeleteResourceType(resourceType: ResourceType): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Delete Resource Type',
        message: `Are you sure you want to delete resource type "${resourceType.code}" (ID: ${resourceType.id})? This action cannot be undone and might affect existing documents using this type.`,
        confirmButtonColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.resourceTypeService.delete(resourceType.id).subscribe({
          next: () => {
            this.snackbar.success(`Resource type "${resourceType.code}" deleted successfully.`);
            if (this.dataSource.data.length === 1 && this.currentPage() > 0) {
              this.currentPage.set(this.currentPage() - 1);
            } else {
              this.loadResourceTypes(this.currentPage(), this.pageSize(), this.sortActive(), this.sortDirection() as 'asc' | 'desc');
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackbar.error('Failed to delete resource type: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }
}
