import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { DocumentTableComponent } from '../../documents/components/document-table/document-table.component';
import { StatsCardsComponent } from '../components/stats-cards/stats-cards.component';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { TranslationService } from '../../core/services/translation.service';
import { ResourceType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    NzCardModule,
    NzIconModule,
    NzButtonModule,
    NzGridModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    NzSpaceModule,
    NzTagModule,
    NzAutocompleteModule,
    DocumentTableComponent,
    StatsCardsComponent
  ],
  template: `
    <div class="dashboard" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">{{ 'dashboard.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'dashboard.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <button nz-button nzType="primary" routerLink="/documents/new" class="action-button">
                <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                <span>{{ 'dashboard.new_document' | translate }}</span>
              </button>
            </div>
          </div>
          
          <!-- Statistics Row -->
          <div class="stats-section">
            <app-stats-cards></app-stats-cards>
          </div>
        </div>
      </div>

      <!-- Recent Documents with Search and Filters -->
      <nz-card [nzTitle]="'dashboard.recent_documents' | translate" class="recent-documents-card">
        <ng-template #extra>
          <button nz-button nzType="link" routerLink="/documents">
            <span>{{ 'dashboard.view_all' | translate }}</span>
            <nz-icon nzType="arrow-right"></nz-icon>
          </button>
        </ng-template>
        
        <!-- Search and Filter Controls -->
        <div class="search-filters-section">
          <!-- First Row - Main Search and Quick Filters -->
                      <div nz-row [nzGutter]="[16, 16]" class="filter-row">
            <!-- Search Input -->
            <div nz-col [nzSpan]="8">
              <nz-input-group nzSearch [nzSuffix]="suffixIconSearch">
                <input 
                  type="text" 
                  nz-input 
                  [placeholder]="'dashboard.search.placeholder' | translate"
                  [formControl]="searchControl">
              </nz-input-group>
              <ng-template #suffixIconSearch>
                <nz-icon nzType="search"></nz-icon>
              </ng-template>
            </div>
            
            <!-- Company Filter -->
            <div nz-col [nzSpan]="4">
              <nz-select 
                [nzPlaceHolder]="'dashboard.filter.company' | translate"
                nzAllowClear
                [formControl]="companyControl"
                style="width: 100%;">
                <nz-option 
                  *ngFor="let company of companies()" 
                  [nzLabel]="company.name" 
                  [nzValue]="company.id">
                </nz-option>
              </nz-select>
            </div>
            
            <!-- Resource Type Filter -->
            <div nz-col [nzSpan]="4">
              <nz-select 
                [nzPlaceHolder]="'dashboard.filter.document_type' | translate"
                nzAllowClear
                [formControl]="resourceTypeControl"
                style="width: 100%;">
                <nz-option 
                  *ngFor="let rt of resourceTypes()" 
                  [nzLabel]="rt.name" 
                  [nzValue]="rt.id">
                </nz-option>
              </nz-select>
            </div>
            
            <!-- Status Filter -->
            <div nz-col [nzSpan]="4">
              <nz-select 
                [nzPlaceHolder]="'dashboard.filter.status' | translate"
                nzAllowClear
                [formControl]="statusControl"
                style="width: 100%;">
                <nz-option [nzLabel]="'status.active' | translate" nzValue="ACTIVE"></nz-option>
                <nz-option [nzLabel]="'status.inactive' | translate" nzValue="INACTIVE"></nz-option>
                <nz-option [nzLabel]="'status.archived' | translate" nzValue="ARCHIVED"></nz-option>
                <nz-option [nzLabel]="'status.draft' | translate" nzValue="DRAFT"></nz-option>
              </nz-select>
            </div>
            
            <!-- Sort Options -->
            <div nz-col [nzSpan]="4">
              <nz-select 
                [nzPlaceHolder]="'dashboard.filter.sort' | translate"
                [formControl]="sortControl"
                style="width: 100%;">
                <nz-option [nzLabel]="'sort.newest' | translate" nzValue="createdAt,desc"></nz-option>
                <nz-option [nzLabel]="'sort.oldest' | translate" nzValue="createdAt,asc"></nz-option>
                <nz-option [nzLabel]="'sort.title_az' | translate" nzValue="title,asc"></nz-option>
                <nz-option [nzLabel]="'sort.title_za' | translate" nzValue="title,desc"></nz-option>
                <nz-option [nzLabel]="'sort.recently_updated' | translate" nzValue="updatedAt,desc"></nz-option>
              </nz-select>
            </div>
          </div>
          
          <!-- Second Row - Tag Search -->
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="16">
              <nz-input-group nzCompact>
                <input 
                  nz-input 
                  [placeholder]="'dashboard.search.tags.placeholder' | translate"
                  [formControl]="tagSearchControl"
                  style="width: 100%;">
              </nz-input-group>
              <div class="tag-help-text" [class.text-right]="translationService.isRTL()">
                <small class="text-gray-500">
                  {{ 'dashboard.search.tags.help' | translate }}
                </small>
              </div>
            </div>
            
            <!-- Selected Tags Display -->
            <div nz-col [nzSpan]="8" *ngIf="selectedTags().length > 0">
              <div class="selected-tags" [class.rtl-tags]="translationService.isRTL()">
                <nz-tag 
                  *ngFor="let tag of selectedTags()" 
                  nzColor="blue" 
                  nzClosable
                  (nzOnClose)="removeTag(tag)">
                  {{ tag }}
                </nz-tag>
              </div>
            </div>
          </div>
        </div>
        
        @if (isLoading()) {
          <div class="loading-container">
            <nz-spin nzSize="large"></nz-spin>
          </div>
        } @else {
          <app-document-table
            [documents]="documents().content"
            [loading]="isLoading()"
            [totalItems]="documents().totalElements"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            (page)="onPageChange($event)">
          </app-document-table>
          
          @if (documents().content.length === 0) {
            <div class="empty-state-container" [class.rtl-empty-state]="translationService.isRTL()">
              <nz-icon nzType="file-text" class="empty-state-icon"></nz-icon>
              <h3 class="empty-state-title">
                {{ hasFilters() ? ('dashboard.no_match' | translate) : ('dashboard.no_documents' | translate) }}
              </h3>
              <p class="empty-state-description">
                {{ hasFilters() ? ('dashboard.try_adjusting' | translate) : ('dashboard.create_first' | translate) }}
              </p>
              @if (!hasFilters()) {
                <button nz-button nzType="primary" routerLink="/documents/new" class="empty-state-button">
                  <nz-icon nzType="plus"></nz-icon>
                  <span>{{ 'dashboard.create_document' | translate }}</span>
                </button>
              } @else {
                <button nz-button nzType="default" (click)="clearFilters()" class="empty-state-button">
                  <nz-icon nzType="clear"></nz-icon>
                  <span>{{ 'dashboard.clear_filters' | translate }}</span>
                </button>
              }
            </div>
          }
        }
      </nz-card>
    </div>
  `,
  styles: [`
    .dashboard {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .dashboard.rtl {
      direction: rtl;
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
      margin-bottom: 24px;
      gap: 16px;
    }

    .header-title-section {
      flex: 1;
      min-width: 0;
    }

    .header-title-section.rtl-header {
      text-align: right;
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

    .header-actions.rtl-actions {
      direction: ltr; /* Keep button internal layout LTR */
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

    /* Statistics Section */
    .stats-section {
      width: 100%;
    }

    /* Recent Documents Card */
    .recent-documents-card {
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

    /* Card Title Styling */
    ::ng-deep .recent-documents-card .ant-card-head {
      background: #fafafa;
      border-bottom: 1px solid #e8e8e8;
      padding: 16px 24px;
    }

    ::ng-deep .recent-documents-card .ant-card-head-title {
      font-size: 16px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    ::ng-deep .recent-documents-card .ant-card-body {
      padding: 0;
    }

    /* RTL Support */
    .dashboard.rtl .page-title,
    .dashboard.rtl .page-subtitle {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl .action-button {
      direction: ltr; /* Keep button layout LTR for consistent icon/text positioning */
    }

    .dashboard.rtl ::ng-deep .ant-btn .anticon + span {
      margin-left: 8px;
      margin-right: 0;
    }

    .dashboard.rtl ::ng-deep .ant-card-head-title {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-card-extra {
      float: left;
    }

    /* Empty State Styling */
    .empty-state-container {
      text-align: center;
      padding: 48px 0;
      direction: ltr;
    }

    .empty-state-container.rtl-empty-state {
      text-align: center;
      direction: ltr; /* Keep LTL for centering layout */
    }

    .empty-state-container.rtl-empty-state .empty-state-title,
    .empty-state-container.rtl-empty-state .empty-state-description {
      direction: rtl;
      unicode-bidi: embed;
      text-align: center !important;
      display: block;
      width: 100%;
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
      margin-bottom: 8px;
      margin-top: 0;
    }

    .empty-state-description {
      color: rgba(0, 0, 0, 0.45);
      margin-bottom: 16px;
      margin-top: 0;
    }

    .empty-state-button {
      margin-top: 8px;
      display: inline-block;
    }

    .empty-state-container.rtl-empty-state .empty-state-button {
      direction: ltr; /* Buttons should remain LTR for proper icon/text layout */
    }

    ::ng-deep .ant-card-head-title {
      font-size: 18px;
      font-weight: 600;
    }

    ::ng-deep .ant-input-affix-wrapper {
      border-radius: 6px;
    }

    ::ng-deep .ant-select-selector {
      border-radius: 6px;
    }

    .tag-help-text {
      margin-top: 4px;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      justify-content: flex-start;
    }

    .selected-tags.rtl-tags {
      justify-content: flex-end;
      direction: rtl;
    }

    .selected-tags nz-tag {
      margin: 0;
    }

    /* RTL-specific styling */
    .dashboard.rtl ::ng-deep .ant-card-extra {
      float: left;
    }

    .dashboard.rtl ::ng-deep .ant-card-head-title {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-input {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-select-selection-item {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-select-selection-placeholder {
      text-align: right;
      direction: rtl;
    }

    /* RTL Button styling */
    .dashboard.rtl ::ng-deep .ant-btn {
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-btn .anticon + span {
      margin-left: 0;
      margin-right: 8px;
    }

    .dashboard.rtl ::ng-deep .ant-btn span + .anticon {
      margin-right: 0;
      margin-left: 8px;
    }

    /* RTL Tag help text */
    .dashboard.rtl .tag-help-text {
      text-align: right;
      direction: rtl;
    }

    /* RTL Table headers */
    .dashboard.rtl ::ng-deep .ant-table-thead > tr > th {
      text-align: right;
      direction: rtl;
    }

    .dashboard.rtl ::ng-deep .ant-table-tbody > tr > td {
      text-align: right;
      direction: rtl;
    }

    /* RTL Empty table state */
    .dashboard.rtl ::ng-deep .ant-empty {
      direction: ltr;
      text-align: center;
    }

    .dashboard.rtl ::ng-deep .ant-empty-description {
      direction: rtl;
      text-align: center !important;
      display: block;
      width: 100%;
    }

    /* Additional RTL centering for all empty states */
    .dashboard.rtl ::ng-deep .ant-empty-image,
    .dashboard.rtl ::ng-deep .ant-empty-image svg {
      margin: 0 auto;
      display: block;
    }

    /* Prevent horizontal overflow */
    ::ng-deep .ant-row {
      max-width: 100%;
      overflow-x: hidden;
    }

    ::ng-deep .ant-col {
      min-width: 0;
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
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }
    }

    /* Document Table Styling within Dashboard */
    ::ng-deep .dashboard .ant-table-wrapper {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .dashboard .ant-table {
      width: 100%;
      max-width: 100%;
      table-layout: fixed;
    }

    ::ng-deep .dashboard .ant-table th,
    ::ng-deep .dashboard .ant-table td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Search and Filters Section */
    .search-filters-section {
      padding: 24px;
      background: #fff;
    }

    .filter-row {
      margin-bottom: 16px;
    }

    .filter-row:last-child {
      margin-bottom: 0;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px 0;
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  translationService = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  
  documents = signal<{ content: Document[]; totalElements: number }>({ content: [], totalElements: 0 });
  isLoading = signal(false);
  companies = signal<Company[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  selectedTags = signal<string[]>([]);
  pageSize = 10; // Show more items on dashboard with search
  pageIndex = 0;
  
  // Form controls for search and filtering
  searchControl = new FormControl('');
  statusControl = new FormControl<string | null>(null);
  sortControl = new FormControl<string>('createdAt,desc');
  companyControl = new FormControl<number | null>(null);
  resourceTypeControl = new FormControl<number | null>(null);
  tagSearchControl = new FormControl('');
  
  ngOnInit(): void {
    this.loadCompanies();
    this.loadResourceTypes();
    this.loadDocuments();
    this.setupSearchAndFilters();
  }
  
  loadCompanies(): void {
    this.companyService.getAccessibleCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies) => this.companies.set(companies),
        error: (error) => console.error('Error loading companies:', error)
      });
  }
  
  loadResourceTypes(): void {
    this.resourceTypeService.listAllNonPaged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resourceTypes: ResourceType[]) => this.resourceTypes.set(resourceTypes),
        error: (error: any) => console.error('Error loading resource types:', error)
      });
  }
  
  setupSearchAndFilters(): void {
    // Search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Company filter
    this.companyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Resource type filter
    this.resourceTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Status filter
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Tag search with debounce
    this.tagSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value: string | null) => {
        this.processTags(value);
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Sort changes
    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });
  }
  
  loadDocuments(): void {
    this.isLoading.set(true);
    
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      sort: this.sortControl.value || 'createdAt,desc'
    };

    // Add search term if provided
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm) {
      params.titleContains = searchTerm;
    }

    // Add company filter if selected
    const companyId = this.companyControl.value;
    if (companyId) {
      params.companyIdEquals = companyId;
    }

    // Add resource type filter if selected
    const resourceTypeId = this.resourceTypeControl.value;
    if (resourceTypeId) {
      params.resourceTypeIdEquals = resourceTypeId;
    }

    // Add tag search if tags are selected
    const tags = this.selectedTags();
    if (tags.length > 0) {
      params.tagNames = tags;
    }
    
    this.documentService.list(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.documents.set({ content: result.content, totalElements: result.totalElements });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  processTags(value: string | null): void {
    if (!value?.trim()) {
      this.selectedTags.set([]);
      return;
    }
    
    const tags = value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.toLowerCase()); // Convert to lowercase for consistency
    
    this.selectedTags.set([...new Set(tags)]); // Remove duplicates
  }

  removeTag(tag: string): void {
    const currentTags = this.selectedTags();
    this.selectedTags.set(currentTags.filter(t => t !== tag));
    
    // Update the tag search control
    const remainingTags = this.selectedTags().join(', ');
    this.tagSearchControl.setValue(remainingTags, { emitEvent: false });
    
    this.pageIndex = 0;
    this.loadDocuments();
  }
  
  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDocuments();
  }
  
  hasFilters(): boolean {
    return !!(
      this.searchControl.value?.trim() ||
      this.companyControl.value ||
      this.resourceTypeControl.value ||
      this.selectedTags().length > 0
    );
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue(null);
    this.companyControl.setValue(null);
    this.resourceTypeControl.setValue(null);
    this.tagSearchControl.setValue('');
    this.selectedTags.set([]);
    this.sortControl.setValue('createdAt,desc');
    this.pageIndex = 0;
    this.loadDocuments();
  }
}
