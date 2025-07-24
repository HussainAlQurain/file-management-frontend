import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

import { CompanyService } from '../../core/services/company.service';
import { CompanyFolderDto } from '../../core/models/company.model';
import { SnackbarService } from '../../core/services/snackbar.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-company-hierarchy-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzGridModule,
    NzTypographyModule,
    NzTagModule,
    NzToolTipModule,
    NzBadgeModule,
    NzDividerModule,
    NzSpaceModule,
    NzAvatarModule,
    NzDescriptionsModule
  ],
  template: `
    <div class="company-hierarchy-container" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">
                <nz-icon nzType="apartment" nzTheme="outline" class="title-icon"></nz-icon>
                {{ 'company_structure.title' | translate }}
              </h1>
              <p class="page-subtitle">{{ 'company_structure.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <button nz-button nzType="primary" (click)="navigateToDocuments()" class="action-button">
                <nz-icon nzType="file-text" nzTheme="outline"></nz-icon>
                <span>{{ 'company_structure.browse_all' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Card -->
      <nz-card class="content-card">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-container">
            <nz-spin nzSize="large" [nzTip]="'company_structure.loading' | translate"></nz-spin>
          </div>
        } @else if (companyFolders().length === 0) {
          <!-- Empty State -->
          <div class="empty-state-container" [class.rtl-empty-state]="translationService.isRTL()">
            <nz-icon nzType="bank" class="empty-state-icon"></nz-icon>
            <h3 class="empty-state-title">{{ 'company_structure.no_companies' | translate }}</h3>
            <p class="empty-state-description">{{ 'company_structure.contact_admin' | translate }}</p>
          </div>
        } @else {
          <!-- Company Cards -->
          <div nz-row [nzGutter]="[24, 24]" class="companies-grid">
            <div *ngFor="let company of companyFolders()" nz-col [nzXs]="24" [nzSm]="24" [nzMd]="12" [nzLg]="8">
              <nz-card class="company-card" [nzHoverable]="true">
                <!-- Company Header -->
                <div class="company-header">
                  <div class="company-info">
                    <nz-avatar 
                      [nzSize]="48" 
                      nzIcon="bank" 
                      class="company-avatar">
                    </nz-avatar>
                    <div class="company-details" [class.rtl-details]="translationService.isRTL()">
                      <h3 class="company-name">{{ company.name }}</h3>
                      <p *ngIf="company.description" class="company-description">
                        {{ company.description }}
                      </p>
                    </div>
                  </div>
                </div>

                <nz-divider></nz-divider>

                <!-- Resource Types Section -->
                <div class="resource-types-section">
                  <div class="types-header" [class.rtl-types-header]="translationService.isRTL()">
                    <span class="types-title">
                      <nz-icon nzType="folder" nzTheme="outline" class="types-icon"></nz-icon>
                      {{ 'company_structure.document_types' | translate }}
                    </span>
                    <nz-badge 
                      [nzCount]="company.resourceTypes.length" 
                      [nzStyle]="{ 'background-color': '#52c41a' }">
                    </nz-badge>
                  </div>

                  <div *ngIf="company.resourceTypes.length === 0" class="no-types-message">
                    <span>{{ 'company_structure.no_types' | translate }}</span>
                  </div>

                  <div *ngIf="company.resourceTypes.length > 0" class="resource-types-grid">
                    <div 
                      *ngFor="let resourceType of company.resourceTypes" 
                      class="resource-type-item"
                      (click)="navigateToDocumentsByType(company.id, resourceType.id)"
                      nz-tooltip
                      [nzTooltipTitle]="resourceType.description || ('company_structure.view_documents' | translate)"
                      nzTooltipPlacement="top">
                      <div class="resource-type-card">
                        <div class="type-content" [class.rtl-type-content]="translationService.isRTL()">
                          <nz-icon nzType="file-done" nzTheme="outline" class="type-icon"></nz-icon>
                          <div class="type-info">
                            <div class="type-name">{{ resourceType.name }}</div>
                            <div class="type-code">{{ resourceType.code }}</div>
                          </div>
                          <nz-icon nzType="right" nzTheme="outline" class="arrow-icon"></nz-icon>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <nz-divider></nz-divider>
                
                <div class="actions-section" [class.rtl-actions]="translationService.isRTL()">
                  <button nz-button nzType="default" (click)="navigateToCompanyDocuments(company.id)" class="action-btn">
                    <nz-icon nzType="folder-open" nzTheme="outline"></nz-icon>
                    <span>{{ 'company_structure.view_all' | translate }}</span>
                  </button>
                  <button nz-button nzType="primary" (click)="navigateToCreateDocument(company.id)" class="action-btn">
                    <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                    <span>{{ 'company_structure.create_document' | translate }}</span>
                  </button>
                </div>
              </nz-card>
            </div>
          </div>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    .company-hierarchy-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .company-hierarchy-container.rtl {
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
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      font-size: 24px;
      color: #1890ff;
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
      padding: 24px;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 64px 0;
      flex-direction: column;
      gap: 16px;
    }

    /* Empty State */
    .empty-state-container {
      text-align: center;
      padding: 64px 24px;
      direction: ltr;
    }

    .empty-state-container.rtl-empty-state {
      text-align: center;
      direction: ltr;
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

    /* Companies Grid */
    .companies-grid {
      width: 100%;
    }

    /* Company Cards */
    .company-card {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 8px;
    }

    .company-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    /* Company Header */
    .company-header {
      margin-bottom: 16px;
    }

    .company-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .company-avatar {
      background-color: #1890ff !important;
      flex-shrink: 0;
    }

    .company-details {
      flex: 1;
      min-width: 0;
    }

    .company-details.rtl-details {
      text-align: right;
      direction: rtl;
    }

    .company-name {
      font-size: 16px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .company-description {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
      line-height: 1.4;
    }

    /* Resource Types Section */
    .resource-types-section {
      margin-bottom: 16px;
    }

    .types-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .types-header.rtl-types-header {
      direction: rtl;
    }

    .types-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .types-icon {
      font-size: 14px;
      color: #1890ff;
    }

    .no-types-message {
      text-align: center;
      padding: 24px 0;
      color: rgba(0, 0, 0, 0.25);
      font-size: 14px;
    }

    /* Resource Types Grid */
    .resource-types-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .resource-type-item {
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .resource-type-item:hover .resource-type-card {
      background: #e6f7ff;
      border-color: #1890ff;
      transform: translateX(2px);
    }

    .resource-type-card {
      padding: 12px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .type-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .type-content.rtl-type-content {
      direction: rtl;
    }

    .type-icon {
      font-size: 16px;
      color: #1890ff;
      flex-shrink: 0;
    }

    .type-info {
      flex: 1;
      min-width: 0;
    }

    .type-name {
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .type-code {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.45);
      line-height: 1.2;
    }

    .arrow-icon {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.25);
      flex-shrink: 0;
    }

    /* Actions Section */
    .actions-section {
      display: flex;
      gap: 8px;
    }

    .actions-section.rtl-actions {
      direction: ltr;
      justify-content: flex-end;
    }

    .action-btn {
      flex: 1;
      height: 32px;
      font-size: 12px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    /* RTL Support */
    .company-hierarchy-container.rtl .page-title,
    .company-hierarchy-container.rtl .page-subtitle {
      text-align: right;
      direction: rtl;
    }

    .company-hierarchy-container.rtl .page-title {
      flex-direction: row-reverse;
    }

    .company-hierarchy-container.rtl .action-button {
      direction: ltr;
    }

    .company-hierarchy-container.rtl ::ng-deep .ant-btn .anticon + span {
      margin-left: 8px;
      margin-right: 0;
    }

    /* Custom scrollbar */
    .resource-types-grid::-webkit-scrollbar {
      width: 4px;
    }

    .resource-types-grid::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 2px;
    }

    .resource-types-grid::-webkit-scrollbar-thumb {
      background: #bfbfbf;
      border-radius: 2px;
    }

    .resource-types-grid::-webkit-scrollbar-thumb:hover {
      background: #999;
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

      ::ng-deep .content-card .ant-card-body {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }

      .actions-section {
        flex-direction: column;
      }

      .action-btn {
        flex: none;
      }
    }
  `]
})
export class CompanyHierarchyPageComponent implements OnInit {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  translationService = inject(TranslationService);

  isLoading = signal(false);
  companyFolders = signal<CompanyFolderDto[]>([]);

  ngOnInit() {
    this.loadCompanyStructure();
  }

  loadCompanyStructure() {
    this.isLoading.set(true);
    this.companyService.getCompanyFolders().subscribe({
      next: (folders) => {
        this.companyFolders.set(folders);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading company structure:', error);
        this.snackbar.error('Failed to load company structure');
        this.isLoading.set(false);
      }
    });
  }

  navigateToDocuments() {
    this.router.navigate(['/documents']);
  }

  navigateToCompanyDocuments(companyId: number) {
    this.router.navigate(['/documents'], { 
      queryParams: { companyId } 
    });
  }

  navigateToDocumentsByType(companyId: number, resourceTypeId: number) {
    this.router.navigate(['/documents'], { 
      queryParams: { companyId, resourceTypeId } 
    });
  }

  navigateToCreateDocument(companyId?: number) {
    if (companyId) {
      this.router.navigate(['/documents/new'], { 
        queryParams: { companyId } 
      });
    } else {
      this.router.navigate(['/documents/new']);
    }
  }
}
