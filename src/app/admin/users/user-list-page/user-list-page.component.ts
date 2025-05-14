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

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { Page } from '../../../core/models/document.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-list-page',
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
        <h2 class="text-3xl font-bold">User Management</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Create User
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
                <p class="text-xl text-gray-500">No users found.</p>
                <p class="mt-2">Click "Create User" to add a new user.</p>
              </div>
            } @else {
              <div class="overflow-auto">
                <table mat-table [dataSource]="dataSource" matSort (matSortChange)="announceSortChange($event)" class="w-full">
                  <!-- ID Column -->
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                    <td mat-cell *matCellDef="let user">{{user.id}}</td>
                  </ng-container>

                  <!-- Username Column -->
                  <ng-container matColumnDef="username">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Username</th>
                    <td mat-cell *matCellDef="let user">{{user.username}}</td>
                  </ng-container>

                  <!-- Email Column -->
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
                    <td mat-cell *matCellDef="let user">{{user.email}}</td>
                  </ng-container>

                  <!-- Roles Column -->
                  <ng-container matColumnDef="roles">
                    <th mat-header-cell *matHeaderCellDef>Roles</th>
                    <td mat-cell *matCellDef="let user">
                      @for(role of user.roles; track role){
                        <span class="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                          {{role}}
                        </span>
                      }
                    </td>
                  </ng-container>

                  <!-- Created At Column -->
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Created At</th>
                    <td mat-cell *matCellDef="let user">{{user.createdAt | date:'medium'}}</td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
                    <td mat-cell *matCellDef="let user" class="text-right">
                      <button mat-icon-button [routerLink]="[user.id]" matTooltip="Edit User">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button (click)="onResetPassword(user)" matTooltip="Reset Password">
                        <mat-icon>lock_reset</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="onDeleteUser(user)" matTooltip="Delete User">
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
                aria-label="Select page of users">
              </mat-paginator>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class UserListPageComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router); // Not strictly used yet, but good for navigation
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  isLoading = signal(true); // Start with loading true
  usersPage: WritableSignal<Page<User> | null> = signal(null);
  
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['id', 'username', 'email', 'roles', 'createdAt', 'actions'];

  currentPage = signal(0);
  pageSize = signal(10);
  sortActive = signal('createdAt');
  sortDirection = signal<'asc' | 'desc' | '' >('desc'); // Allow empty for no sort initially by table
  totalElements = signal(0);

  constructor() {
    effect(() => {
      this.loadUsers(
        this.currentPage(), 
        this.pageSize(), 
        this.sortActive(), 
        this.sortDirection() as 'asc' | 'desc' // Cast here as effect runs with initial empty string
      );
    });
  }

  ngOnInit(): void {
    // Initial load is triggered by the effect. 
    // Set isLoading to true before the first effect run.
    // this.isLoading.set(true); // Already set at declaration
  }

  loadUsers(page: number, size: number, sort: string, direction: 'asc' | 'desc'): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page,
      size,
    };
    if (sort && direction) {
      params['sort'] = `${sort},${direction}`;
    }

    this.userService.list(params).subscribe({
      next: (pageData) => {
        this.usersPage.set(pageData);
        this.dataSource.data = pageData.content;
        this.totalElements.set(pageData.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load users: ' + (err.error?.message || err.message));
        this.dataSource.data = [];
        this.totalElements.set(0);
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.isLoading.set(true); // Show loading when page changes
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  announceSortChange(sortState: Sort): void {
    this.isLoading.set(true); // Show loading when sort changes
    this.currentPage.set(0); 
    this.sortActive.set(sortState.active);
    this.sortDirection.set(sortState.direction);
  }

  onResetPassword(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reset Password',
        message: `Are you sure you want to reset the password for ${user.username}? A new temporary password will be generated and shown.`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const operationLoading = signal(false); // Local loading for this operation
        operationLoading.set(true);
        this.userService.resetPassword(user.id).subscribe({
          next: (response) => {
            operationLoading.set(false);
            this.dialog.open(ConfirmDialogComponent, { // Using ConfirmDialog to show info, can be a dedicated InfoDialog
                data: {
                    title: 'Password Reset Successful',
                    message: `Password for ${user.username} has been reset. The new temporary password (reset token) is: ${response.resetToken}. Please save this securely.`,
                    confirmText: 'Close',
                    showCancel: false
                }
            });
            this.snackbar.success(`Password reset initiated for ${user.username}.`);
          },
          error: (err) => {
            operationLoading.set(false);
            this.snackbar.error('Failed to reset password: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }

  onDeleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user ${user.username} (ID: ${user.id})? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true); // Use main loading for delete as it affects the whole table
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.snackbar.success(`User ${user.username} deleted successfully.`);
            // The effect will automatically reload the users due to potential changes in totalElements or if we manually trigger it.
            // To ensure it reloads if the current page becomes empty:
            if (this.dataSource.data.length === 1 && this.currentPage() > 0) {
              this.currentPage.set(this.currentPage() - 1); // Go to previous page if current page becomes empty
            } else {
              // Force a reload by re-setting a dependency of the effect, or call loadUsers directly
              this.loadUsers(this.currentPage(), this.pageSize(), this.sortActive(), this.sortDirection() as 'asc' | 'desc');
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackbar.error('Failed to delete user: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }
}
