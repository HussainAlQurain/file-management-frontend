import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageService } from 'ng-zorro-antd/message';

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { Document, DocQuery, Page } from '../../core/models/document.model';
import { ResourceType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';

@Component({
  selector: 'app-document-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzTagModule,
    NzSpaceModule,
    NzDropDownModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzFormModule,
    NzDividerModule,
    NzEmptyModule,
    NzToolTipModule,
    NzBadgeModule,
    NzDrawerModule,
    NzPageHeaderModule,
    NzStatisticModule,
    NzAvatarModule,
    NzTypographyModule
  ],
  template: `
    <div class="document-list-container">
      <!-- Page Header -->
      <nz-page-header
        class="site-page-header"
        nzTitle="Documents"
        nzSubtitle="Manage and browse all documents">
        <nz-page-header-extra>
          <nz-space>
            <button *nzSpaceItem nz-button nzType="default" (click)="showFilters = true">
              <span nz-icon nzType="filter" nzTheme="outline"></span>
              Filters
              <nz-badge *ngIf="activeFiltersCount > 0" [nzCount]="activeFiltersCount"></nz-badge>
            </button>
            <button *nzSpaceItem nz-button nzType="primary" routerLink="/documents/new">
              <span nz-icon nzType="plus" nzTheme="outline"></span>
              New Document
            </button>
          </nz-space>
        </nz-page-header-extra>
        <nz-page-header-content>
          <div nz-row [nzGutter]="24">
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Total Documents" [nzValue]="documents().totalElements"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Current Page" [nzValue]="(documents().number + 1) + ' / ' + documents().totalPages"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="12">
              <div class="search-box">
                <nz-input-group [nzSuffix]="suffixIconSearch" nzSize="large">
                  <input 
                    type="text" 
                    nz-input 
                    placeholder="Search by title or resource code..." 
                    [(ngModel)]="searchQuery"
                    (keyup.enter)="onSearch()"
                    (ngModelChange)="onSearchChange($event)" />
                </nz-input-group>
                <ng-template #suffixIconSearch>
                  <span nz-icon nzType="search" (click)="onSearch()"></span>
                </ng-template>
              </div>
            </div>
          </div>
        </nz-page-header-content>
      </nz-page-header>

      <!-- Filter Drawer -->
      <nz-drawer
        [nzClosable]="true"
        [nzVisible]="showFilters"
        nzPlacement="left"
        nzTitle="Filter Documents"
        [nzWidth]="320"
        (nzOnClose)="showFilters = false">
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="filterForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label>Company</nz-form-label>
              <nz-form-control>
                <nz-select 
                  formControlName="companyId" 
                  nzShowSearch 
                  nzAllowClear
                  nzPlaceHolder="All companies">
                  <nz-option *ngFor="let company of companies" [nzValue]="company.id" [nzLabel]="company.name"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Document Type</nz-form-label>
              <nz-form-control>
                <nz-select 
                  formControlName="resourceTypeId" 
                  nzShowSearch 
                  nzAllowClear
                  nzPlaceHolder="All types">
                  <nz-option *ngFor="let type of resourceTypes()" [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Status</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="status" nzAllowClear nzPlaceHolder="All statuses">
                  <nz-option nzValue="ACTIVE" nzLabel="Active"></nz-option>
                  <nz-option nzValue="INACTIVE" nzLabel="Inactive"></nz-option>
                  <nz-option nzValue="ARCHIVED" nzLabel="Archived"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Date Range</nz-form-label>
              <nz-form-control>
                <nz-range-picker 
                  formControlName="dateRange"
                  [nzFormat]="'yyyy-MM-dd'"
                  style="width: 100%;">
                </nz-range-picker>
              </nz-form-control>
            </nz-form-item>

            <nz-divider></nz-divider>

            <nz-space nzDirection="vertical" style="width: 100%;">
              <button *nzSpaceItem nz-button nzType="primary" nzBlock (click)="applyFilters()">
                <span nz-icon nzType="search" nzTheme="outline"></span>
                Apply Filters
              </button>
              <button *nzSpaceItem nz-button nzType="default" nzBlock (click)="resetFilters()">
                <span nz-icon nzType="reload" nzTheme="outline"></span>
                Reset Filters
              </button>
            </nz-space>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Documents Table -->
      <nz-card>
        <nz-table
          #documentTable
          [nzData]="documents().content"
          [nzFrontPagination]="false"
          [nzLoading]="isLoading()"
          [nzTotal]="documents().totalElements"
          [nzPageSize]="pageSize"
          [nzPageIndex]="pageIndex + 1"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50, 100]"
          (nzPageSizeChange)="onPageSizeChange($event)"
          (nzPageIndexChange)="onPageIndexChange($event)"
          [nzScroll]="{ x: '1200px' }">
          
          <thead>
            <tr>
              <th nzWidth="50px"></th>
              <th nzColumnKey="title" [nzSortFn]="true" nzWidth="250px">Title</th>
              <th nzColumnKey="resourceCode" [nzSortFn]="true" nzWidth="150px">Resource Code</th>
              <th nzWidth="150px">Type</th>
              <th nzWidth="150px">Company</th>
              <th nzColumnKey="status" [nzSortFn]="true" nzWidth="100px">Status</th>
              <th nzColumnKey="createdAt" [nzSortFn]="true" nzWidth="150px">Created</th>
              <th nzWidth="150px">Owner</th>
              <th nzWidth="120px" nzRight>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of documentTable.data">
              <td>
                <nz-avatar 
                  nzIcon="file-text" 
                  [nzSize]="32"
                  [style.background-color]="getDocumentTypeColor(doc.resourceType?.code)">
                </nz-avatar>
              </td>
              <td>
                <a [routerLink]="['/documents', doc.id]" class="document-link">
                  <span nz-typography nzEllipsis nz-tooltip [nzTooltipTitle]="doc.title">{{ doc.title }}</span>
                </a>
              </td>
              <td>
                <nz-tag>{{ doc.resourceCode }}</nz-tag>
              </td>
              <td>
                <span *ngIf="doc.resourceType">{{ doc.resourceType.name }}</span>
              </td>
              <td>
                <span *ngIf="doc.company">{{ doc.company.name }}</span>
              </td>
              <td>
                <nz-tag [nzColor]="getStatusColor(doc.status)">{{ doc.status }}</nz-tag>
              </td>
              <td>{{ doc.createdAt | date:'short' }}</td>
              <td>
                <span *ngIf="doc.owner">{{ doc.owner.username }}</span>
              </td>
              <td>
                <nz-space>
                  <a *nzSpaceItem nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id]" nz-tooltip nzTooltipTitle="View">
                    <span nz-icon nzType="eye" nzTheme="outline"></span>
                  </a>
                  <a *nzSpaceItem nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id, 'edit']" nz-tooltip nzTooltipTitle="Edit">
                    <span nz-icon nzType="edit" nzTheme="outline"></span>
                  </a>
                  <a *nzSpaceItem 
                     nz-dropdown 
                     [nzDropdownMenu]="menu" 
                     nzPlacement="bottomRight">
                    <span nz-icon nzType="more" nzTheme="outline"></span>
                  </a>
                  <nz-dropdown-menu #menu="nzDropdownMenu">
                    <ul nz-menu>
                      <li nz-menu-item [routerLink]="['/documents', doc.id, 'acl']">
                        <span nz-icon nzType="safety" nzTheme="outline"></span>
                        Manage ACL
                      </li>
                      <li nz-menu-item *ngIf="doc.storageKey" (click)="downloadDocument(doc)">
                        <span nz-icon nzType="download" nzTheme="outline"></span>
                        Download
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item nzDanger (click)="archiveDocument(doc)">
                        <span nz-icon nzType="delete" nzTheme="outline"></span>
                        Archive
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </nz-space>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .document-list-container {
      padding: 0;
    }

    .site-page-header {
      background: #fff;
      margin: -24px -24px 24px;
      padding: 16px 24px;
    }

    .search-box {
      max-width: 400px;
      margin-left: auto;
    }

    .document-link {
      color: #1890ff;
      text-decoration: none;
    }

    .document-link:hover {
      text-decoration: underline;
    }

    ::ng-deep .ant-table-wrapper {
      .ant-table-cell {
        vertical-align: middle;
      }
    }

    ::ng-deep .ant-page-header-heading-extra {
      display: flex;
      align-items: center;
    }

    ::ng-deep .ant-statistic-content {
      font-size: 20px;
    }
  `],
  providers: [NzMessageService]
})
export class DocumentListPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);
  
  documents = signal<Page<Document>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    pageable: { pageNumber: 0, pageSize: 10, sort: { sorted: false, unsorted: true } },
    first: true,
    last: true,
    sort: { sorted: false, unsorted: true },
    numberOfElements: 0,
    empty: true
  });
  
  resourceTypes = signal<ResourceType[]>([]);
  companies: Company[] = [];
  isLoading = signal(false);
  showFilters = false;
  searchQuery = '';
  activeFiltersCount = 0;
  
  query: DocQuery = {
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
    perm: 'VIEW'
  };
  
  filterForm: FormGroup = this.fb.group({
    companyId: [null],
    resourceTypeId: [null],
    status: [null],
    dateRange: [null]
  });
  
  get pageSize(): number {
    return this.query.size ?? 10;
  }

  get pageIndex(): number {
    return this.query.page ?? 0;
  }
  
  ngOnInit(): void {
    this.loadResourceTypes();
    this.loadCompanies();
    this.initializeFromQueryParams();
  }
  
  initializeFromQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['companyId']) {
          this.query.companyIdEquals = +params['companyId'];
          this.filterForm.patchValue({ companyId: +params['companyId'] });
        }
        
        if (params['resourceTypeId']) {
          this.query.resourceTypeIdEquals = +params['resourceTypeId'];
          this.filterForm.patchValue({ resourceTypeId: +params['resourceTypeId'] });
        }
        
        if (params['resourceCode']) {
          this.query.resourceCodeEquals = params['resourceCode'];
        }
        
        this.updateActiveFiltersCount();
        this.loadDocuments();
      });
  }
  
  loadDocuments(): void {
    this.isLoading.set(true);
    
    this.documentService.list(this.query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.documents.set(result);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.message.error('Failed to load documents');
        }
      });
  }
  
  loadResourceTypes(): void {
    this.resourceTypeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.resourceTypes.set(result);
        }
      });
  }
  
  loadCompanies(): void {
    this.companyService.getAccessibleCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
        }
      });
  }
  
  onSearch(): void {
    if (this.searchQuery) {
      this.query.titleContains = this.searchQuery;
    } else {
      delete this.query.titleContains;
    }
    this.query.page = 0;
    this.loadDocuments();
  }
  
  onSearchChange(value: string): void {
    if (!value) {
      delete this.query.titleContains;
      this.query.page = 0;
      this.loadDocuments();
    }
  }
  
  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Apply company filter
    if (filters.companyId) {
      this.query.companyIdEquals = filters.companyId;
    } else {
      delete this.query.companyIdEquals;
    }
    
    // Apply resource type filter
    if (filters.resourceTypeId) {
      this.query.resourceTypeIdEquals = filters.resourceTypeId;
    } else {
      delete this.query.resourceTypeIdEquals;
    }
    
    // Apply status filter
    if (filters.status) {
      this.query.statusEquals = filters.status;
    } else {
      delete this.query.statusEquals;
    }
    
    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      this.query.createdAfter = filters.dateRange[0];
      this.query.createdBefore = filters.dateRange[1];
    } else {
      delete this.query.createdAfter;
      delete this.query.createdBefore;
    }
    
    this.query.page = 0;
    this.updateActiveFiltersCount();
    this.loadDocuments();
    this.showFilters = false;
  }
  
  resetFilters(): void {
    this.filterForm.reset();
    this.query = {
      page: 0,
      size: this.query.size,
      sort: 'createdAt,desc',
      perm: 'VIEW'
    };
    this.updateActiveFiltersCount();
    this.loadDocuments();
  }
  
  updateActiveFiltersCount(): void {
    let count = 0;
    if (this.query.companyIdEquals) count++;
    if (this.query.resourceTypeIdEquals) count++;
    if (this.query.statusEquals) count++;
    if (this.query.createdAfter || this.query.createdBefore) count++;
    this.activeFiltersCount = count;
  }
  
  onPageSizeChange(size: number): void {
    this.query.size = size;
    this.query.page = 0;
    this.loadDocuments();
  }
  
  onPageIndexChange(index: number): void {
    this.query.page = index - 1; // NZ-Table uses 1-based index
    this.loadDocuments();
  }
  
  downloadDocument(doc: Document): void {
    if (!doc.storageKey) return;
    
    const loading = this.message.loading('Downloading document...', { nzDuration: 0 });
    this.documentService.downloadLatestPrimaryFile(doc.id, doc.storageKey).subscribe({
      next: (blob) => {
        this.message.remove(loading.messageId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.message.remove(loading.messageId);
        this.message.error('Failed to download document');
      }
    });
  }
  
  archiveDocument(doc: Document): void {
    // Implement archive functionality
    this.message.info('Archive functionality not implemented yet');
  }
  
  getStatusColor(status: string | undefined): string {
    if (!status) return 'default';
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'ARCHIVED': 'warning',
      'DELETED': 'error'
    };
    return statusColors[status] || 'default';
  }
  
  getDocumentTypeColor(typeCode?: string): string {
    if (!typeCode) return '#1890ff';
    
    // Generate a consistent color based on the type code
    const colors = ['#1890ff', '#52c41a', '#13c2c2', '#722ed1', '#fa8c16', '#eb2f96'];
    let hash = 0;
    for (let i = 0; i < typeCode.length; i++) {
      hash = typeCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
