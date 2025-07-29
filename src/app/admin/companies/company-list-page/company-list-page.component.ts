import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BidiModule } from '@angular/cdk/bidi';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { CompanyService } from '../../../core/services/company.service';
import { Company } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-company-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    BidiModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzModalModule,
    NzDropDownModule,
    NzEmptyModule,
    TranslateModule
  ],
  template: `
    <div [dir]="translationService.isRTL() ? 'rtl' : 'ltr'" class="company-admin-container">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'admin.companies.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'admin.companies.subtitle' | translate }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="primary" routerLink="new" class="action-button">
                <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                <span>{{ 'admin.companies.create' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Companies Table -->
      <nz-card class="content-card">
        <nz-table 
          #basicTable 
          [nzData]="companies()" 
          [nzLoading]="isLoading()"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzSize]="'middle'">
          <thead>
            <tr>
              <th nzWidth="80px">{{ 'admin.companies.table.id' | translate }}</th>
              <th nzWidth="30%">{{ 'admin.companies.table.name' | translate }}</th>
              <th nzWidth="35%">{{ 'admin.companies.table.description' | translate }}</th>
              <th nzWidth="15%">{{ 'admin.companies.table.created_at' | translate }}</th>
              <th nzWidth="120px" nzAlign="center">{{ 'admin.companies.table.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let company of basicTable.data">
              <td>
                <span class="company-id">{{ company.id }}</span>
              </td>
              <td>
                <div class="company-name-cell">
                  <nz-icon 
                    nzType="bank" 
                    nzTheme="outline" 
                    class="company-icon">
                  </nz-icon>
                  <span class="company-name">{{ company.name }}</span>
                </div>
              </td>
              <td>
                <span class="company-description">{{ company.description || ('common.not_available' | translate) }}</span>
              </td>
              <td>
                <span class="company-date">{{ company.createdAt | date:'MMM dd, yyyy' }}</span>
              </td>
              <td nzAlign="center">
                <div class="actions-cell">
                  <button 
                    nz-button 
                    nzType="text" 
                    nzSize="small"
                    nz-dropdown 
                    [nzDropdownMenu]="menu"
                    nzPlacement="bottomRight">
                    <nz-icon nzType="more" nzTheme="outline"></nz-icon>
                  </button>
                  <nz-dropdown-menu #menu="nzDropdownMenu">
                    <ul nz-menu>
                      <li nz-menu-item [routerLink]="[company.id]">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        {{ 'admin.companies.actions.edit' | translate }}
                      </li>
                      <li nz-menu-item [routerLink]="[company.id, 'acl']">
                        <nz-icon nzType="safety-certificate" nzTheme="outline"></nz-icon>
                        {{ 'admin.companies.actions.access' | translate }}
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="deleteCompany(company)" class="delete-action">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        {{ 'admin.companies.actions.delete' | translate }}
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <!-- Empty State -->
        @if (companies().length === 0 && !isLoading()) {
          <div class="empty-state-container">
            <nz-icon nzType="bank" class="empty-state-icon"></nz-icon>
            <h3 class="empty-state-title">{{ 'admin.companies.empty.message' | translate }}</h3>
            <button nz-button nzType="primary" routerLink="new" class="empty-state-button">
              <nz-icon nzType="plus"></nz-icon>
              <span>{{ 'admin.companies.empty.create_first' | translate }}</span>
            </button>
          </div>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    .company-admin-container {
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
    .company-id {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .company-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .company-icon {
      color: #1890ff;
      font-size: 16px;
      flex-shrink: 0;
    }

    .company-name {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .company-description {
      color: rgba(0, 0, 0, 0.65);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .company-date {
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
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }
    }
  `]
})
export class CompanyListPageComponent implements OnInit {
  private companyService = inject(CompanyService);
  private modal = inject(NzModalService);
  private snackbar = inject(SnackbarService);
  private translateService = inject(TranslateService);
  translationService = inject(TranslationService);

  isLoading = signal(false);
  companies = signal<Company[]>([]);

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.isLoading.set(true);
    this.companyService.listAll().subscribe({
      next: (companies) => {
        this.companies.set(companies);
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
    this.modal.confirm({
      nzTitle: this.translateService.instant('admin.companies.delete.title'),
      nzContent: this.translateService.instant('admin.companies.delete.content').replace('{name}', company.name),
      nzOkText: this.translateService.instant('admin.companies.delete.ok'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: this.translateService.instant('admin.companies.delete.cancel'),
      nzOnOk: () => {
        return this.companyService.delete(company.id).toPromise().then(() => {
          this.snackbar.success('Company deleted successfully');
          this.loadCompanies();
        }).catch((error) => {
          console.error('Error deleting company:', error);
          this.snackbar.error('Failed to delete company');
        });
      }
    });
  }
}
