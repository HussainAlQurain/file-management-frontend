import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { ResourceType } from '../../../core/models/resource-type.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-resource-type-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslateModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzTagModule,
    NzEmptyModule,
    NzDropDownModule
  ],
  template: `
    <div class="resource-types-admin-container">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'admin.resource_types.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'admin.resource_types.subtitle' | translate }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="primary" routerLink="new" class="action-button">
                <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                <span>{{ 'admin.resource_types.create_button' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Types Table -->
      <nz-card class="content-card">
        <nz-table 
          #basicTable 
          [nzData]="resourceTypes()" 
          [nzLoading]="isLoading()"
          [nzPageSize]="10"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzSize]="'middle'">
          <thead>
            <tr>
              <th nzWidth="80px" nzSortKey="id">{{ 'admin.resource_types.table.id' | translate }}</th>
              <th nzWidth="15%" nzSortKey="code">{{ 'admin.resource_types.table.code' | translate }}</th>
              <th nzWidth="20%" nzSortKey="name">{{ 'admin.resource_types.table.name' | translate }}</th>
              <th nzWidth="15%" nzSortKey="company">{{ 'admin.resource_types.table.company' | translate }}</th>
              <th nzWidth="25%">{{ 'admin.resource_types.table.description' | translate }}</th>
              <th nzWidth="10%" nzAlign="center">{{ 'admin.resource_types.table.fields' | translate }}</th>
              <th nzWidth="120px" nzSortKey="createdAt">{{ 'admin.resource_types.table.created_at' | translate }}</th>
              <th nzWidth="120px" nzAlign="center">{{ 'admin.resource_types.table.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rt of basicTable.data">
              <td>
                <span class="resource-type-id">{{ rt.id }}</span>
              </td>
              <td>
                <div class="resource-type-code-cell">
                  <nz-icon nzType="file-text" class="resource-type-icon"></nz-icon>
                  <span class="resource-type-code">{{ rt.code }}</span>
                </div>
              </td>
              <td>
                <span class="resource-type-name">{{ rt.name }}</span>
              </td>
              <td>
                @if (rt.companyName) {
                  <div class="company-cell">
                    <nz-icon nzType="apartment" class="company-icon"></nz-icon>
                    <span class="company-name">{{ rt.companyName }}</span>
                  </div>
                } @else {
                  <span class="no-data">{{ 'common.not_available' | translate }}</span>
                }
              </td>
              <td>
                <span class="resource-type-description">{{ rt.description || ('common.not_available' | translate) }}</span>
              </td>
              <td nzAlign="center">
                <nz-tag [nzColor]="getFieldCountColor(rt.fields.length || 0)" class="fields-tag">
                  @if ((rt.fields.length || 0) === 0) {
                    {{ 'admin.resource_types.fields.none' | translate }}
                  } @else if ((rt.fields.length || 0) === 1) {
                    {{ ('admin.resource_types.fields.count' | translate).replace('{count}', (rt.fields.length || 0).toString()) }}
                  } @else {
                    {{ ('admin.resource_types.fields.count_plural' | translate).replace('{count}', (rt.fields.length || 0).toString()) }}
                  }
                </nz-tag>
              </td>
              <td>
                <span class="resource-type-date">{{ rt.createdAt | date:'MMM dd, yyyy' }}</span>
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
                      <li nz-menu-item [routerLink]="['edit', rt.id]">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        {{ 'admin.resource_types.actions.edit' | translate }}
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="onDeleteResourceType(rt)" class="delete-action">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        {{ 'admin.resource_types.actions.delete' | translate }}
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <!-- Empty State -->
        @if (resourceTypes().length === 0 && !isLoading()) {
          <div class="empty-state-container">
            <nz-icon nzType="file-text" class="empty-state-icon"></nz-icon>
            <h3 class="empty-state-title">{{ 'admin.resource_types.empty.message' | translate }}</h3>
            <button nz-button nzType="primary" routerLink="new" class="empty-state-button">
              <nz-icon nzType="plus"></nz-icon>
              <span>{{ 'admin.resource_types.empty.create_first' | translate }}</span>
            </button>
          </div>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    .resource-types-admin-container {
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
    .resource-type-id {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .resource-type-code-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .resource-type-icon {
      color: #1890ff;
      font-size: 16px;
      flex-shrink: 0;
    }

    .resource-type-code {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .resource-type-name {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .company-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .company-icon {
      color: #fa8c16;
      font-size: 16px;
      flex-shrink: 0;
    }

    .company-name {
      color: rgba(0, 0, 0, 0.65);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .resource-type-description {
      color: rgba(0, 0, 0, 0.65);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-data {
      color: rgba(0, 0, 0, 0.25);
      font-style: italic;
    }

    .fields-tag {
      font-size: 12px;
      border-radius: 12px;
      padding: 2px 8px;
    }

    .resource-type-date {
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

      .company-cell,
      .resource-type-code-cell {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }

      .fields-tag {
        font-size: 10px;
        padding: 1px 6px;
      }
    }
  `]
})
export class ResourceTypeListPageComponent implements OnInit {
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private modal = inject(NzModalService);
  private translateService = inject(TranslateService);

  isLoading = signal(true);
  resourceTypes = signal<ResourceType[]>([]);

  ngOnInit(): void {
    this.fetchAllResourceTypes();
  }

  fetchAllResourceTypes(): void {
    this.isLoading.set(true);
    this.resourceTypeService.listAllNonPaged().subscribe({
      next: (data) => {
        this.resourceTypes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load resource types: ' + (err.error?.message || err.message));
        this.resourceTypes.set([]);
      }
    });
  }

  onDeleteResourceType(resourceType: ResourceType): void {
    this.modal.confirm({
      nzTitle: this.translateService.instant('admin.resource_types.delete.title'),
      nzContent: this.translateService.instant('admin.resource_types.delete.content').replace('{code}', resourceType.code),
      nzOkText: this.translateService.instant('admin.resource_types.delete.ok'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: this.translateService.instant('admin.resource_types.delete.cancel'),
      nzOnOk: () => {
        return this.resourceTypeService.delete(resourceType.id).toPromise().then(() => {
          this.snackbar.success(`Resource type "${resourceType.code}" deleted successfully`);
          this.fetchAllResourceTypes();
        }).catch((err) => {
          this.snackbar.error('Failed to delete resource type: ' + (err.error?.message || err.message));
        });
      }
    });
  }

  getFieldCountColor(count: number): string {
    if (count === 0) return 'default';
    if (count <= 3) return 'blue';
    if (count <= 6) return 'green';
    return 'orange';
  }
}
