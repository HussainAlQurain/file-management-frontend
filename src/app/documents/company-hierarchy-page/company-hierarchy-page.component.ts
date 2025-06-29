import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-company-hierarchy-page',
  standalone: true,
  imports: [
    CommonModule,
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
    <div class="company-hierarchy-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="page-header-title">
              <span nz-icon nzType="apartment" nzTheme="outline" class="mr-2"></span>
              Company Structure
            </h1>
            <p class="text-gray-500 mt-1">Browse and manage documents by company and resource type</p>
          </div>
          <button nz-button nzType="primary" nzSize="large" (click)="navigateToDocuments()">
            <span nz-icon nzType="file-text" nzTheme="outline"></span>
            Browse All Documents
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex justify-center items-center py-16">
        <nz-spin nzSimple [nzSize]="'large'" nzTip="Loading companies..."></nz-spin>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && companyFolders().length === 0" class="empty-state-container">
        <nz-empty
          nzNotFoundImage="simple"
          [nzNotFoundContent]="notFoundContent">
          <ng-template #notFoundContent>
            <p class="text-lg mb-4">No companies found</p>
            <p class="text-gray-500">Contact your administrator to set up companies and document types</p>
          </ng-template>
        </nz-empty>
      </div>

      <!-- Company Cards -->
      <div *ngIf="!isLoading() && companyFolders().length > 0" nz-row [nzGutter]="[16, 16]">
        <div *ngFor="let company of companyFolders()" nz-col [nzXs]="24" [nzSm]="24" [nzMd]="12" [nzLg]="8">
          <nz-card class="company-card nav-card" [nzHoverable]="true">
            <!-- Company Header -->
            <div class="company-header mb-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <nz-avatar 
                    [nzSize]="48" 
                    nzIcon="bank" 
                    style="background-color: #1890ff;">
                  </nz-avatar>
                  <div class="ml-3">
                    <h3 class="text-lg font-semibold mb-0">{{ company.name }}</h3>
                    <p *ngIf="company.description" class="text-gray-500 text-sm mb-0">
                      {{ company.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <nz-divider style="margin: 12px 0;"></nz-divider>

            <!-- Resource Types Section -->
            <div class="resource-types-section">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-600">
                  <span nz-icon nzType="folder" nzTheme="outline" class="mr-1"></span>
                  Available Document Types
                </span>
                <nz-badge 
                  [nzCount]="company.resourceTypes.length" 
                  [nzStyle]="{ 'background-color': '#52c41a' }">
                </nz-badge>
              </div>

              <div *ngIf="company.resourceTypes.length === 0" class="text-center py-4">
                <span class="text-gray-400">No document types available</span>
              </div>

              <div *ngIf="company.resourceTypes.length > 0" class="resource-types-grid">
                <div 
                  *ngFor="let resourceType of company.resourceTypes" 
                  class="resource-type-item"
                  (click)="navigateToDocumentsByType(company.id, resourceType.id)"
                  nz-tooltip
                  [nzTooltipTitle]="resourceType.description || 'Click to view documents'"
                  nzTooltipPlacement="top">
                  <div class="resource-type-card">
                    <div class="flex items-center">
                      <span nz-icon nzType="file-done" nzTheme="outline" 
                            class="text-blue-500 mr-2" style="font-size: 18px;"></span>
                      <div class="flex-1">
                        <div class="font-medium text-sm">{{ resourceType.name }}</div>
                        <div class="text-xs text-gray-500">{{ resourceType.code }}</div>
                      </div>
                      <span nz-icon nzType="right" nzTheme="outline" class="text-gray-400"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <nz-divider style="margin: 12px 0;"></nz-divider>
            
            <nz-space>
              <button *nzSpaceItem nz-button nzType="default" (click)="navigateToCompanyDocuments(company.id)">
                <span nz-icon nzType="folder-open" nzTheme="outline"></span>
                View All Documents
              </button>
              <button *nzSpaceItem nz-button nzType="primary" (click)="navigateToCreateDocument(company.id)">
                <span nz-icon nzType="plus" nzTheme="outline"></span>
                Create Document
              </button>
            </nz-space>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-hierarchy-container {
      padding: 0;
    }

    .company-card {
      height: 100%;
      transition: all 0.3s ease;
    }

    .company-header {
      min-height: 80px;
    }

    .resource-types-section {
      min-height: 200px;
    }

    .resource-types-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 240px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .resource-type-item {
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .resource-type-item:hover .resource-type-card {
      background: #e6f7ff;
      border-color: #1890ff;
      transform: translateX(4px);
    }

    .resource-type-card {
      padding: 12px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .empty-state-container {
      background: #fff;
      border-radius: 8px;
      padding: 64px 24px;
      text-align: center;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
    }

    /* Custom scrollbar for resource types */
    .resource-types-grid::-webkit-scrollbar {
      width: 6px;
    }

    .resource-types-grid::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 3px;
    }

    .resource-types-grid::-webkit-scrollbar-thumb {
      background: #bfbfbf;
      border-radius: 3px;
    }

    .resource-types-grid::-webkit-scrollbar-thumb:hover {
      background: #999;
    }
  `]
})
export class CompanyHierarchyPageComponent implements OnInit {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

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
