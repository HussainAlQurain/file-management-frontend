import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

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
    <div class="p-6" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ 'admin.companies.title' | translate }}</h1>
          <p class="text-gray-600 mt-1">{{ 'admin.companies.subtitle' | translate }}</p>
        </div>
        <button nz-button nzType="primary" routerLink="new">
          <nz-icon nzType="plus"></nz-icon>
          {{ 'admin.companies.create' | translate }}
        </button>
      </div>

      <!-- Companies Table -->
      <nz-card>
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
              <th>{{ 'admin.companies.table.name' | translate }}</th>
              <th>{{ 'admin.companies.table.description' | translate }}</th>
              <th nzWidth="180px">{{ 'admin.companies.table.created_at' | translate }}</th>
              <th nzWidth="120px" nzAlign="center">{{ 'admin.companies.table.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let company of basicTable.data">
              <td>
                <span class="font-mono text-gray-600">{{ company.id }}</span>
              </td>
              <td>
                <div class="flex items-center">
                  <nz-icon 
                    nzType="bank" 
                    nzTheme="outline" 
                    class="text-blue-500 mr-2">
                  </nz-icon>
                  <span class="font-medium">{{ company.name }}</span>
                </div>
              </td>
              <td>
                <span class="text-gray-600">{{ company.description || ('common.not_available' | translate) }}</span>
              </td>
              <td>
                <span class="text-sm text-gray-500">{{ company.createdAt | date:'MMM dd, yyyy' }}</span>
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
                      <li nz-menu-item [routerLink]="[company.id]">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        Edit Company
                      </li>
                      <li nz-menu-item [routerLink]="[company.id, 'acl']">
                        <nz-icon nzType="safety-certificate" nzTheme="outline"></nz-icon>
                        Manage ACLs
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="deleteCompany(company)" class="text-red-500">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        Delete
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
          <nz-empty 
            nzNotFoundImage="simple" 
            nzNotFoundContent="No companies found">
            <div nz-empty-footer>
              <button nz-button nzType="primary" routerLink="new">
                <nz-icon nzType="plus"></nz-icon>
                Create First Company
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
export class CompanyListPageComponent implements OnInit {
  private companyService = inject(CompanyService);
  private modal = inject(NzModalService);
  private snackbar = inject(SnackbarService);
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
      nzTitle: 'Delete Company',
      nzContent: `Are you sure you want to delete "${company.name}"? This action cannot be undone and will affect all related resource types.`,
      nzOkText: 'Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
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
