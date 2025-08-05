import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageService } from 'ng-zorro-antd/message';

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { TranslationService } from '../../core/services/translation.service';
import { Document, DocQuery, Page } from '../../core/models/document.model';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';

@Component({
  selector: 'app-document-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
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
    NzAvatarModule,
    NzTypographyModule
  ],
  template: `
    <div class="document-list-container" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">{{ 'documents.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'documents.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <nz-space nzSize="middle">
                <button *nzSpaceItem nz-button nzType="default" (click)="showFilters = true" class="action-button">
                  <nz-icon nzType="filter" nzTheme="outline"></nz-icon>
                  <span>{{ 'documents.filters.title' | translate }}</span>
                                     <nz-badge *ngIf="activeFiltersCount > 0" [nzCount]="activeFiltersCount" [nzOffset]="[10, 0]"></nz-badge>
                </button>
                <button *nzSpaceItem nz-button nzType="default" routerLink="/documents/bulk-import" class="action-button">
                  <nz-icon nzType="cloud-upload" nzTheme="outline"></nz-icon>
                  <span>{{ 'documents.bulk_import' | translate }}</span>
                </button>
                <button *nzSpaceItem nz-button nzType="primary" routerLink="/documents/new" class="action-button">
                  <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                  <span>{{ 'documents.new_document' | translate }}</span>
                </button>
              </nz-space>
            </div>
          </div>
          
          <!-- Statistics and Search Row -->
          <div class="header-bottom">
            <div class="stats-section" [class.rtl-stats]="translationService.isRTL()">
              <div class="stat-item">
                <div class="stat-value">{{ documents().totalElements }}</div>
                <div class="stat-label">{{ 'documents.stats.total_documents' | translate }}</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">{{ (documents().number + 1) + ' / ' + documents().totalPages }}</div>
                <div class="stat-label">{{ 'documents.stats.current_page' | translate }}</div>
              </div>
            </div>
            <div class="search-section" [class.rtl-search]="translationService.isRTL()">
              <nz-input-group [nzSuffix]="suffixIconSearch" nzSize="large" class="search-input">
                <input 
                  type="text" 
                  nz-input 
                  [placeholder]="'documents.search.global_placeholder' | translate"
                  [(ngModel)]="searchQuery"
                  (keyup.enter)="onSearch()"
                  (ngModelChange)="onSearchChange($event)" />
              </nz-input-group>
              <ng-template #suffixIconSearch>
                <nz-icon nzType="search" class="search-icon" (click)="onSearch()"></nz-icon>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Drawer -->
      <nz-drawer
        [nzClosable]="true"
        [nzVisible]="showFilters"
        [nzPlacement]="translationService.isRTL() ? 'right' : 'left'"
        [nzTitle]="'documents.filters.title' | translate"
        [nzWidth]="320"
        (nzOnClose)="showFilters = false">
        <ng-container *nzDrawerContent>
          <form nz-form [formGroup]="filterForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label>{{ 'documents.filters.company' | translate }}</nz-form-label>
              <nz-form-control>
                <nz-select 
                  formControlName="companyId" 
                  nzShowSearch 
                  nzAllowClear
                  [nzPlaceHolder]="'documents.filters.all_companies' | translate">
                  <nz-option *ngFor="let company of companies" [nzValue]="company.id" [nzLabel]="company.name"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>{{ 'documents.filters.document_type' | translate }}</nz-form-label>
              <nz-form-control>
                <nz-select 
                  formControlName="resourceTypeId" 
                  nzShowSearch 
                  nzAllowClear
                  [nzPlaceHolder]="'documents.filters.all_types' | translate">
                  <nz-option *ngFor="let type of resourceTypes()" [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>{{ 'documents.filters.status' | translate }}</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="status" nzAllowClear [nzPlaceHolder]="'documents.filters.all_statuses' | translate">
                  <nz-option nzValue="ACTIVE" [nzLabel]="'status.active' | translate"></nz-option>
                  <nz-option nzValue="INACTIVE" [nzLabel]="'status.inactive' | translate"></nz-option>
                  <nz-option nzValue="ARCHIVED" [nzLabel]="'status.archived' | translate"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>{{ 'documents.filters.date_range' | translate }}</nz-form-label>
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
                {{ 'documents.filters.apply' | translate }}
              </button>
              <button *nzSpaceItem nz-button nzType="default" nzBlock (click)="resetFilters()">
                <span nz-icon nzType="reload" nzTheme="outline"></span>
                {{ 'documents.filters.reset' | translate }}
              </button>
              <nz-divider></nz-divider>
              <button 
                *nzSpaceItem 
                nz-button 
                nzType="dashed" 
                nzBlock 
                [routerLink]="['/documents/bulk-import']"
                [queryParams]="getBulkImportParams()">
                <span nz-icon nzType="cloud-upload" nzTheme="outline"></span>
                {{ 'documents.filters.bulk_import' | translate }}
              </button>
            </nz-space>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Documents Table -->
      <nz-card class="documents-card">
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
          (nzPageIndexChange)="onPageIndexChange($event)">
          
          <thead>
            <tr>
              <!-- Custom Field Columns (displayed first when resource type is selected) -->
              <th *ngFor="let field of customFieldColumns()" nzWidth="12%" [nzSortFn]="false">
                {{ field.label || field.name }}
              </th>
              
              <!-- Standard Columns -->
              <th nzColumnKey="title" [nzSortFn]="true" [nzWidth]="customFieldColumns().length > 0 ? '20%' : '30%'">{{ 'documents.table.title' | translate }}</th>
              <th nzColumnKey="resourceCode" [nzSortFn]="true" nzWidth="15%">{{ 'documents.table.resource_code' | translate }}</th>
              <th *ngIf="!currentResourceType()" nzWidth="12%">{{ 'documents.table.type' | translate }}</th>
              <th nzWidth="12%">{{ 'documents.table.company' | translate }}</th>
              <th nzColumnKey="status" [nzSortFn]="true" nzWidth="10%">{{ 'documents.table.status' | translate }}</th>
              <th nzColumnKey="createdAt" [nzSortFn]="true" nzWidth="13%">{{ 'documents.table.created' | translate }}</th>
              <th nzWidth="8%">{{ 'documents.table.owner' | translate }}</th>
              <th nzWidth="100px" nzAlign="center">{{ 'documents.table.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of documentTable.data">
              <!-- Custom Field Values -->
              <td *ngFor="let field of customFieldColumns()">
                <span *ngIf="doc.fieldValues && doc.fieldValues[field.name]; else noValue" 
                      class="field-value"
                      [nz-tooltip]="doc.fieldValues[field.name]">
                  {{ formatFieldValue(doc.fieldValues[field.name], field.kind) }}
                </span>
                <ng-template #noValue>
                  <span class="text-gray-400">—</span>
                </ng-template>
              </td>
              
              <!-- Title -->
              <td>
                <div class="title-cell">
                  <nz-avatar 
                    nzIcon="file-text" 
                    [nzSize]="24"
                    [style.background-color]="getDocumentTypeColor(doc.resourceType?.code)"
                    class="doc-avatar">
                  </nz-avatar>
                  <a [routerLink]="['/documents', doc.id]" class="document-link">
                    <span nz-typography nzEllipsis nz-tooltip [nzTooltipTitle]="doc.title">{{ doc.title }}</span>
                  </a>
                </div>
              </td>
              
              <!-- Resource Code -->
              <td>
                <nz-tag>{{ doc.resourceCode }}</nz-tag>
              </td>
              
              <!-- Resource Type (only show if no specific type is filtered) -->
              <td *ngIf="!currentResourceType()">
                <span *ngIf="doc.resourceType">{{ doc.resourceType.name }}</span>
                <span *ngIf="!doc.resourceType" class="text-gray-400">{{ 'common.not_available' | translate }}</span>
              </td>
              
              <!-- Company -->
              <td>
                <span *ngIf="doc.company">{{ doc.company.name }}</span>
                <span *ngIf="!doc.company" class="text-gray-400">{{ 'common.not_available' | translate }}</span>
              </td>
              
              <!-- Status -->
              <td>
                <nz-tag [nzColor]="getStatusColor(doc.status)">{{ ('status.' + (doc.status?.toLowerCase() || 'unknown')) | translate }}</nz-tag>
              </td>
              
              <!-- Created Date -->
              <td>{{ doc.createdAt | date:'short' }}</td>
              
              <!-- Owner -->
              <td>
                <span *ngIf="doc.owner">{{ doc.owner.username }}</span>
                <span *ngIf="!doc.owner" class="text-gray-400">{{ 'common.not_available' | translate }}</span>
              </td>
              
              <!-- Actions -->
              <td>
                <nz-space>
                  <a *nzSpaceItem nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id]" nz-tooltip [nzTooltipTitle]="'documents.actions.view' | translate">
                    <span nz-icon nzType="eye" nzTheme="outline"></span>
                  </a>
                  <a *nzSpaceItem nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id, 'edit']" nz-tooltip [nzTooltipTitle]="'documents.actions.edit' | translate">
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
                        {{ 'documents.actions.manage_acl' | translate }}
                      </li>
                      <li nz-menu-item *ngIf="doc.storageKey" (click)="downloadDocument(doc)">
                        <span nz-icon nzType="download" nzTheme="outline"></span>
                        {{ 'documents.actions.download' | translate }}
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item nzDanger (click)="archiveDocument(doc)">
                        <span nz-icon nzType="delete" nzTheme="outline"></span>
                        {{ 'documents.actions.archive' | translate }}
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
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .document-list-container.rtl {
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

    /* Header Bottom Row */
    .header-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .stats-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .stats-section.rtl-stats {
      direction: ltr; /* Keep numbers LTR for consistency */
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #1890ff;
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      line-height: 1.2;
      white-space: nowrap;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background-color: #e8e8e8;
    }

    .search-section {
      flex: 1;
      max-width: 400px;
      margin-left: auto;
    }

    .search-section.rtl-search {
      margin-left: 0;
      margin-right: auto;
    }

    .search-input {
      width: 100%;
    }

    .search-icon {
      cursor: pointer;
      color: rgba(0, 0, 0, 0.45);
      transition: color 0.3s;
    }

    .search-icon:hover {
      color: #1890ff;
    }

    /* Documents Table Card */
    .documents-card {
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

    .document-link {
      color: #1890ff;
      text-decoration: none;
    }

    .document-link:hover {
      text-decoration: underline;
    }

    /* Table Styling */
    ::ng-deep .ant-card {
      border-radius: 0;
      overflow: hidden;
    }

    ::ng-deep .ant-card-body {
      padding: 0;
    }

    /* Title Cell Layout */
    .title-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .doc-avatar {
      flex-shrink: 0;
    }

    ::ng-deep .ant-table-wrapper {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .ant-table {
      width: 100%;
      max-width: 100%;
      margin: 0;
      table-layout: fixed;
    }

    ::ng-deep .ant-table-container {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .ant-table-content {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .ant-table-body {
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    ::ng-deep .ant-table-wrapper .ant-table-cell {
      vertical-align: middle;
      padding: 16px 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px solid #f5f5f5;
    }

    /* Specific cell content styling */
    ::ng-deep .ant-table-cell .document-link,
    ::ng-deep .ant-table-cell .title-cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .title-cell .document-link {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Prevent any horizontal overflow */
    ::ng-deep .ant-table th,
    ::ng-deep .ant-table td {
      overflow: hidden;
      box-sizing: border-box;
    }

    ::ng-deep .ant-table-thead th {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Force table to respect container bounds */
    ::ng-deep .documents-card .ant-table-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      overflow: hidden !important;
    }

    /* Prevent tag and content overflow */
    ::ng-deep .ant-tag {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
    }

    /* Custom field value styling */
    .field-value {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: rgba(0, 0, 0, 0.85);
      font-size: 13px;
    }

    ::ng-deep .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      border-bottom: 1px solid #e8e8e8;
      padding: 16px;
    }

    ::ng-deep .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }

    /* RTL Table Support */
    .document-list-container.rtl ::ng-deep .ant-table-thead > tr > th {
      text-align: right;
      direction: rtl;
    }

    .document-list-container.rtl ::ng-deep .ant-table-tbody > tr > td {
      text-align: right;
      direction: rtl;
    }

    .document-list-container.rtl ::ng-deep .ant-table-cell {
      text-align: right;
      direction: rtl;
    }

    .document-list-container.rtl ::ng-deep .ant-space {
      direction: ltr;
    }

    .document-list-container.rtl ::ng-deep .ant-btn {
      direction: ltr;
    }

    /* RTL Button Icon Spacing */
    .document-list-container.rtl .action-button {
      direction: ltr; /* Keep button layout LTR for consistent icon/text positioning */
    }

    .document-list-container.rtl ::ng-deep .ant-btn .anticon + span {
      margin-left: 8px;
      margin-right: 0;
    }

    .document-list-container.rtl ::ng-deep .ant-btn span + .anticon {
      margin-left: 0;
      margin-right: 8px;
    }

    /* RTL Text Alignment */
    .document-list-container.rtl .page-title,
    .document-list-container.rtl .page-subtitle {
      text-align: right;
      direction: rtl;
    }

    .document-list-container.rtl .stat-label {
      direction: rtl;
      text-align: center;
    }

    /* RTL Badge positioning */
    .document-list-container.rtl ::ng-deep .ant-badge {
      direction: ltr;
    }

    /* Drawer RTL Support */
    .document-list-container.rtl ::ng-deep .ant-drawer-content {
      direction: rtl;
    }

    .document-list-container.rtl ::ng-deep .ant-drawer-header-title {
      direction: rtl;
      text-align: right;
    }

    .document-list-container.rtl ::ng-deep .ant-drawer-body {
      direction: rtl;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .page-header-content {
        padding: 16px;
      }
      
      .header-bottom {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
             .search-section {
         margin: 0;
         max-width: none;
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
      
      .stats-section {
        justify-content: center;
      }
      
      .action-button {
        flex: 1;
        justify-content: center;
        min-width: 120px;
      }
      
             ::ng-deep .ant-table-wrapper .ant-table-cell {
         padding: 12px 8px;
         font-size: 12px;
       }
       
       .page-header-content {
         padding: 12px;
       }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .stat-value {
        font-size: 16px;
      }
      
      .stat-label {
        font-size: 11px;
      }
      
      ::ng-deep .ant-space-item {
        margin-bottom: 8px !important;
      }
      
      .header-actions ::ng-deep .ant-space {
        flex-direction: column;
        width: 100%;
      }
      
      .action-button {
        width: 100%;
      }
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
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);
  
  translationService = inject(TranslationService);
  
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
  currentResourceType = signal<ResourceType | null>(null);
  customFieldColumns = signal<FieldDefinitionDto[]>([]);
  
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
    // Subscribe to language changes for proper translations
    this.translationService.languageChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cdr.detectChanges();
      });
      
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
          this.loadResourceTypeDetails(+params['resourceTypeId']);
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
  
  loadResourceTypeDetails(resourceTypeId: number): void {
    this.resourceTypeService.get(resourceTypeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resourceType) => {
          this.currentResourceType.set(resourceType);
          // Sort fields by name for consistent display
          const sortedFields = [...(resourceType.fields || [])].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          this.customFieldColumns.set(sortedFields);
        },
        error: () => {
          this.currentResourceType.set(null);
          this.customFieldColumns.set([]);
        }
      });
  }
  
  onSearch(): void {
    if (this.searchQuery) {
      this.query.globalSearch = this.searchQuery;
      // Remove specific title search when using global search
      delete this.query.titleContains;
    } else {
      delete this.query.globalSearch;
      delete this.query.titleContains;
    }
    this.query.page = 0;
    this.loadDocuments();
  }
  
  onSearchChange(value: string): void {
    if (!value) {
      delete this.query.globalSearch;
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
      this.loadResourceTypeDetails(filters.resourceTypeId);
    } else {
      delete this.query.resourceTypeIdEquals;
      this.currentResourceType.set(null);
      this.customFieldColumns.set([]);
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
    this.currentResourceType.set(null);
    this.customFieldColumns.set([]);
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
    
    const loading = this.message.loading(this.translateService.instant('documents.actions.downloading'), { nzDuration: 0 });
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

  getBulkImportParams(): any {
    const filters = this.filterForm.value;
    const params: any = {};
    
    if (filters.companyId) {
      params.companyId = filters.companyId;
    }
    
    if (filters.resourceTypeId) {
      params.resourceTypeId = filters.resourceTypeId;
    }
    
    return params;
  }
  
  formatFieldValue(value: any, fieldType: FieldType): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    
    switch (fieldType) {
      case FieldType.DATE:
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case FieldType.BOOLEAN:
        return value ? '✓' : '✗';
      case FieldType.NUMBER:
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      default:
        return String(value);
    }
  }
}
