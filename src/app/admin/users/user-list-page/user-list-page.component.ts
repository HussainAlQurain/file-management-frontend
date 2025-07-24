import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    DatePipe,
    TranslateModule,
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
    <div class="users-admin-container">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'admin.users.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'admin.users.subtitle' | translate }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="primary" routerLink="new" class="action-button">
                <nz-icon nzType="user-add" nzTheme="outline"></nz-icon>
                <span>{{ 'admin.users.create_user' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <nz-card class="content-card">
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
              <th nzWidth="80px" nzSortKey="id">{{ 'admin.users.table.id' | translate }}</th>
              <th nzWidth="20%" nzSortKey="username">{{ 'admin.users.table.username' | translate }}</th>
              <th nzWidth="25%" nzSortKey="email">{{ 'admin.users.table.email' | translate }}</th>
              <th nzWidth="20%">{{ 'admin.users.table.roles' | translate }}</th>
              <th nzWidth="15%" nzSortKey="createdAt">{{ 'admin.users.table.created_at' | translate }}</th>
              <th nzWidth="120px" nzAlign="center">{{ 'admin.users.table.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users(); trackBy: trackByUserId">
              <td>
                <span class="user-id">{{ user.id }}</span>
              </td>
              <td>
                <div class="username-cell">
                  <nz-icon 
                    nzType="user" 
                    [class]="getUserIconClass(user.roles)">
                  </nz-icon>
                  <span class="username">{{ user.username }}</span>
                </div>
              </td>
              <td>
                <span class="user-email">{{ user.email }}</span>
              </td>
              <td>
                <div class="roles-container">
                  @for (role of user.roles; track role) {
                    <nz-tag [nzColor]="getRoleColor(role)" class="role-tag">
                      <nz-icon [nzType]="getRoleIcon(role)"></nz-icon>
                      <span>{{ 'admin.users.roles.' + role | translate }}</span>
                    </nz-tag>
                  }
                </div>
              </td>
              <td>
                <span class="user-date">{{ user.createdAt | date:'MMM dd, yyyy' }}</span>
              </td>
              <td nzAlign="center">
                <div class="actions-cell">
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
                        {{ 'admin.users.actions.edit' | translate }}
                      </li>
                      <li nz-menu-item (click)="onResetPassword(user)">
                        <nz-icon nzType="key" nzTheme="outline"></nz-icon>
                        {{ 'admin.users.actions.reset_password' | translate }}
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="onDeleteUser(user)" class="delete-action">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        {{ 'admin.users.actions.delete' | translate }}
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
          <div class="empty-state-container">
            <nz-icon nzType="user" class="empty-state-icon"></nz-icon>
            <h3 class="empty-state-title">{{ 'admin.users.empty.message' | translate }}</h3>
            <button nz-button nzType="primary" routerLink="new" class="empty-state-button">
              <nz-icon nzType="user-add"></nz-icon>
              <span>{{ 'admin.users.empty.create_first' | translate }}</span>
            </button>
          </div>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    .users-admin-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    /* Page Header Redesign */
    .page-header-wrapper {
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 24px;
    }

    .page-header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Header Top Row */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .header-title-section {
      flex: 1;
      min-width: 0;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
      line-height: 1.4;
    }

    .header-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .action-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    /* Content Card */
    .content-card {
      margin: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
      box-shadow: none;
      border-top: 1px solid #e8e8e8;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    ::ng-deep .content-card .ant-card-body {
      padding: 0;
    }

    /* Table Styling */
    ::ng-deep .ant-table-wrapper {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .ant-table {
      width: 100%;
      max-width: 100%;
      table-layout: fixed;
    }

    ::ng-deep .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      border-bottom: 1px solid #e8e8e8;
      padding: 16px;
    }

    ::ng-deep .ant-table-tbody > tr > td {
      padding: 16px;
      border-bottom: 1px solid #f5f5f5;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    ::ng-deep .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }

    /* Table Cell Content */
    .user-id {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .username-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .user-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .user-icon.sys-admin {
      color: #ff4d4f;
    }

    .user-icon.admin {
      color: #fa8c16;
    }

    .user-icon.user {
      color: #1890ff;
    }

    .username {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-email {
      color: rgba(0, 0, 0, 0.65);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .roles-container {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .role-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      border-radius: 12px;
      padding: 2px 8px;
    }

    .role-tag .anticon {
      font-size: 12px;
    }

    .user-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }

    .actions-cell {
      display: flex;
      justify-content: center;
    }

    /* Dropdown Menu Styling */
    ::ng-deep .ant-dropdown-menu-item .anticon {
      margin-right: 8px;
    }

    .delete-action {
      color: #ff4d4f !important;
    }

    .delete-action:hover {
      background-color: #fff2f0 !important;
    }

    /* Empty State */
    .empty-state-container {
      text-align: center;
      padding: 64px 24px;
      direction: ltr;
    }

    .empty-state-icon {
      font-size: 4rem;
      color: #d9d9d9;
      margin-bottom: 16px;
      display: block;
    }

    .empty-state-title {
      font-size: 1.125rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 16px;
      margin-top: 0;
    }

    .empty-state-button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .page-header-content {
        padding: 16px;
      }
    }

    @media (max-width: 768px) {
      .header-top {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .action-button {
        justify-content: center;
        min-width: 160px;
      }
      
      .page-header-content {
        padding: 12px;
      }

      ::ng-deep .ant-table-wrapper .ant-table-cell {
        padding: 12px 8px;
        font-size: 12px;
      }

      .username-cell {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .roles-container {
        flex-direction: column;
        gap: 2px;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }

      .role-tag {
        font-size: 10px;
        padding: 1px 6px;
      }
    }
  `]
})
export class UserListPageComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private modal = inject(NzModalService);
  private translateService = inject(TranslateService);

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

  getUserIconClass(roles: string[]): string {
    if (roles.includes('SYS_ADMIN')) {
      return 'user-icon sys-admin';
    } else if (roles.includes('ADMIN')) {
      return 'user-icon admin';
    }
    return 'user-icon user';
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
