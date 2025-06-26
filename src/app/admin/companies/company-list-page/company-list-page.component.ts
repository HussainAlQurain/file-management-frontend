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

import { CompanyService } from '../../../core/services/company.service';
import { Company } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-list-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DatePipe,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold">Company Management</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Create Company
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          @if (isLoading()) {
            <div class="flex justify-center items-center py-8">
              <mat-spinner diameter="50"></mat-spinner>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="dataSource" matSort class="w-full">
                <!-- ID Column -->
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                  <td mat-cell *matCellDef="let company">{{ company.id }}</td>
                </ng-container>

                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                  <td mat-cell *matCellDef="let company">{{ company.name }}</td>
                </ng-container>

                <!-- Description Column -->
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let company">{{ company.description || 'N/A' }}</td>
                </ng-container>

                <!-- Created At Column -->
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                  <td mat-cell *matCellDef="let company">{{ company.createdAt | date:'medium' }}</td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let company">
                    <div class="flex gap-2">
                      <button mat-icon-button [routerLink]="[company.id]" matTooltip="Edit Company">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button [routerLink]="[company.id, 'acl']" matTooltip="Manage ACLs">
                        <mat-icon>security</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteCompany(company)" matTooltip="Delete Company">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            @if (dataSource.data.length === 0) {
              <div class="text-center py-8 text-gray-500">
                <mat-icon class="text-6xl mb-4">business</mat-icon>
                <p class="text-lg">No companies found</p>
                <p>Create your first company to get started</p>
              </div>
            }

            <mat-paginator
              [pageSizeOptions]="[5, 10, 25, 100]"
              [pageSize]="10"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mat-mdc-table {
      width: 100%;
    }
    
    .mat-mdc-row:hover {
      background-color: #f5f5f5;
    }
  `]
})
export class CompanyListPageComponent implements OnInit, AfterViewInit {
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = signal(false);
  dataSource = new MatTableDataSource<Company>([]);
  displayedColumns = ['id', 'name', 'description', 'createdAt', 'actions'];

  ngOnInit() {
    this.loadCompanies();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCompanies() {
    this.isLoading.set(true);
    this.companyService.listAll().subscribe({
      next: (companies) => {
        this.dataSource.data = companies;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.snackbar.error('Failed to load companies');
        this.isLoading.set(false);
      }
    });
  }

  deleteCompany(company: Company) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Company',
        message: `Are you sure you want to delete "${company.name}"? This action cannot be undone and will affect all related resource types.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.companyService.delete(company.id).subscribe({
          next: () => {
            this.snackbar.success('Company deleted successfully');
            this.loadCompanies();
          },
          error: (error) => {
            console.error('Error deleting company:', error);
            this.snackbar.error('Failed to delete company');
          }
        });
      }
    });
  }
}
