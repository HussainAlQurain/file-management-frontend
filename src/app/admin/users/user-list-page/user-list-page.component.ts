import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { Page } from '../../../core/models/document.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzCardModule,
    NzTagModule,
    NzEmptyModule,
    NzDropDownModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
          <p class="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <button nz-button nzType="primary" routerLink="new">
          <nz-icon nzType="user-add"></nz-icon>
          Create User
        </button>
      </div>

      <!-- Users Table -->
      <nz-card>
        <nz-table 
          #basicTable 
          [nzData]="users()" 
          [nzLoading]="isLoading()"
          [nzTotal]="totalElements()"
          [nzPageSize]="pageSize()"
          [nzPageIndex]="currentPage()"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzSize]="'middle'"
          [nzFrontPagination]="false"
          (nzQueryParams)="onQueryParamsChange($event)">
          <thead>
            <tr>
              <th nzWidth="80px" nzSortKey="id">ID</th>
              <th nzSortKey="username">Username</th>
              <th nzSortKey="email">Email</th>
              <th>Roles</th>
              <th nzWidth="180px" nzSortKey="createdAt">Created At</th>
              <th nzWidth="140px" nzAlign="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users(); trackBy: trackByUserId">
              <td>
                <span class="font-mono text-gray-600">{{ user.id }}</span>
              </td>
              <td>
                <div class="flex items-center">
                  <nz-icon 
                    nzType="user" 
                    [class]="getUserIcon(user.roles)"
                    class="mr-2">
                  </nz-icon>
                  <span class="font-medium">{{ user.username }}</span>
                </div>
              </td>
              <td>
                <span class="text-gray-600">{{ user.email }}</span>
              </td>
              <td>
                <div class="flex gap-1 flex-wrap">
                  @for (role of user.roles; track role) {
                    <nz-tag [nzColor]="getRoleColor(role)">
                      <nz-icon [nzType]="getRoleIcon(role)" class="mr-1"></nz-icon>
                      {{ role }}
                    </nz-tag>
                  }
                </div>
              </td>
              <td>
                <span class="text-sm text-gray-500">{{ user.createdAt | date:'MMM dd, yyyy' }}</span>
              </td>
              <td nzAlign="center">
                <div class="flex justify-center">
                  <button 
                    nz-button 
                    nzType="text" 
                    nzSize="small"
                    nz-dropdown 
                    [nzDropdownMenu]="menu">
                    <nz-icon nzType="more" nzTheme="outline"></nz-icon>
                  </button>
                  <nz-dropdown-menu #menu="nzDropdownMenu">
                    <ul nz-menu>
                      <li nz-menu-item [routerLink]="[user.id]">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        Edit User
                      </li>
                      <li nz-menu-item (click)="onResetPassword(user)">
                        <nz-icon nzType="key" nzTheme="outline"></nz-icon>
                        Reset Password
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="onDeleteUser(user)" class="text-red-500">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        Delete User
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <!-- Empty State -->
        @if (users().length === 0 && !isLoading()) {
          <nz-empty 
            nzNotFoundImage="simple" 
            nzNotFoundContent="No users found">
            <div nz-empty-footer>
              <button nz-button nzType="primary" routerLink="new">
                <nz-icon nzType="user-add"></nz-icon>
                Create First User
              </button>
            </div>
          </nz-empty>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    nz-table ::ng-deep .ant-table-tbody > tr:hover > td {
      background: #f5f5f5;
    }
  `]
})
export class UserListPageComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private modal = inject(NzModalService);

  isLoading = signal(true);
  usersPage: WritableSignal<Page<User> | null> = signal(null);
  users = signal<User[]>([]);
  
  currentPage = signal(0);
  pageSize = signal(10);
  sortActive = signal('createdAt');
  sortDirection = signal<'ascend' | 'descend' | null>('descend');
  totalElements = signal(0);

  constructor() {
    // Remove the effect to avoid conflicts with pagination
  }

  ngOnInit(): void {
    // Load initial data
    this.loadUsers(
      this.currentPage(), 
      this.pageSize(), 
      this.sortActive(), 
      this.sortDirection()
    );
  }

  loadUsers(page: number, size: number, sort: string, direction: 'ascend' | 'descend' | null): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page,
      size,
    };
    
    if (sort && direction) {
      const sortDir = direction === 'ascend' ? 'asc' : 'desc';
      params['sort'] = `${sort},${sortDir}`;
    }

    this.userService.list(params).subscribe({
      next: (pageData) => {
        this.usersPage.set(pageData);
        this.users.set(pageData.content);
        this.totalElements.set(pageData.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load users: ' + (err.error?.message || err.message));
        this.users.set([]);
        this.totalElements.set(0);
      }
    });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort } = params;
    const currentSort = sort.find(item => item.value !== null);
    
    this.currentPage.set(pageIndex);
    this.pageSize.set(pageSize);
    
    let sortKey = '';
    let sortDirection: 'ascend' | 'descend' | null = null;
    
    if (currentSort) {
      sortKey = currentSort.key;
      sortDirection = currentSort.value as 'ascend' | 'descend' | null;
    }
    
    this.sortActive.set(sortKey);
    this.sortDirection.set(sortDirection);
    
    // Load data with new parameters
    this.loadUsers(pageIndex, pageSize, sortKey, sortDirection);
  }

  onResetPassword(user: User): void {
    this.modal.confirm({
      nzTitle: 'Reset Password',
      nzContent: `Are you sure you want to reset the password for ${user.username}? A new temporary password will be generated.`,
      nzOkText: 'Reset Password',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
             nzOnOk: () => {
         return this.userService.resetPassword(user.id).toPromise().then((response) => {
           if (response) {
             this.modal.info({
               nzTitle: 'Password Reset Successful',
               nzContent: `Password for ${user.username} has been reset. The new temporary password is: ${response.resetToken}. Please save this securely.`,
               nzOkText: 'Close'
             });
             this.snackbar.success(`Password reset for ${user.username}`);
           } else {
             this.snackbar.error('Password reset response was empty');
           }
         }).catch((err) => {
           this.snackbar.error('Failed to reset password: ' + (err.error?.message || err.message));
         });
       }
    });
  }

  onDeleteUser(user: User): void {
    this.modal.confirm({
      nzTitle: 'Delete User',
      nzContent: `Are you sure you want to delete user ${user.username}? This action cannot be undone.`,
      nzOkText: 'Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        return this.userService.delete(user.id).toPromise().then(() => {
          this.snackbar.success(`User ${user.username} deleted successfully`);
          
          // Reload users or adjust page if current page becomes empty
          const currentUsers = this.users();
          if (currentUsers.length === 1 && this.currentPage() > 0) {
            const newPage = this.currentPage() - 1;
            this.currentPage.set(newPage);
            this.loadUsers(newPage, this.pageSize(), this.sortActive(), this.sortDirection());
          } else {
            this.loadUsers(this.currentPage(), this.pageSize(), this.sortActive(), this.sortDirection());
          }
        }).catch((err) => {
          this.snackbar.error('Failed to delete user: ' + (err.error?.message || err.message));
        });
      }
    });
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'SYS_ADMIN':
        return 'red';
      case 'ADMIN':
        return 'orange';
      case 'USER':
        return 'blue';
      default:
        return 'default';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SYS_ADMIN':
        return 'crown';
      case 'ADMIN':
        return 'safety-certificate';
      case 'USER':
        return 'user';
      default:
        return 'user';
    }
  }

  getUserIcon(roles: string[]): string {
    if (roles.includes('SYS_ADMIN')) {
      return 'text-red-500';
    } else if (roles.includes('ADMIN')) {
      return 'text-orange-500';
    }
    return 'text-blue-500';
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
