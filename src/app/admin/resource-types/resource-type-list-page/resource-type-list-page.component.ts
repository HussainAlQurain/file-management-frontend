import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { ResourceType } from '../../../core/models/resource-type.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-resource-type-list-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule, // MatDialogModule is needed for MatDialog service
    DatePipe,
    MatPaginatorModule,
    MatSortModule
    // ConfirmDialogComponent is not directly used in the template, so not needed here
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
                <table mat-table [dataSource]="dataSource" matSort class="w-full">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                    <td mat-cell *matCellDef="let rt">{{rt.id}}</td>
                  </ng-container>

                  <!-- Code Column -->
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Code</th>
                    <td mat-cell *matCellDef="let rt">{{rt.code}}</td>
                  </ng-container>

                  <!-- Description Column -->
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
                    <td mat-cell *matCellDef="let rt">{{rt.description}}</td>
                  </ng-container>

                  <!-- Fields Count Column -->
                  <ng-container matColumnDef="fieldsCount">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-center">Fields</th>
                    <td mat-cell *matCellDef="let rt" class="text-center">{{rt.fields?.length || 0}}</td>
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
                      <button mat-icon-button color="primary" [routerLink]="['edit', rt.id]" matTooltip="Edit Resource Type">
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
                [length]="dataSource.data.length" 
                [pageSize]="10" 
                [pageSizeOptions]="[5, 10, 25, 100]"
                aria-label="Select page of resource types">
              </mat-paginator>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ResourceTypeListPageComponent implements OnInit, AfterViewInit {
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  isLoading = signal(true);
  
  dataSource = new MatTableDataSource<ResourceType>([]);
  displayedColumns: string[] = ['id', 'code', 'description', 'fieldsCount', 'createdAt', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {}

  ngOnInit(): void {
    // Data loading will be triggered in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fetchAllResourceTypes();
  }

  fetchAllResourceTypes(): void {
    this.isLoading.set(true);
    this.resourceTypeService.listAllNonPaged().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load resource types: ' + (err.error?.message || err.message));
        this.dataSource.data = [];
      }
    });
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
            this.fetchAllResourceTypes(); // Refresh data by re-fetching all
          },
          error: (err) => {
            this.isLoading.set(false); // Ensure loading is false on error too
            this.snackbar.error('Failed to delete resource type: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }
}
