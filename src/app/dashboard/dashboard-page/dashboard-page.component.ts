import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { DocumentTableComponent } from '../../documents/components/document-table/document-table.component';
import { StatsCardsComponent } from '../components/stats-cards/stats-cards.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzIconModule,
    NzButtonModule,
    NzGridModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    NzSpaceModule,
    DocumentTableComponent,
    StatsCardsComponent
  ],
  template: `
    <div class="dashboard p-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-1">Welcome back! Here's what's happening with your documents.</p>
        </div>
        <button nz-button nzType="primary" routerLink="/documents/new">
          <nz-icon nzType="plus"></nz-icon>
          New Document
        </button>
      </div>

      <!-- Statistics Cards -->
      <app-stats-cards></app-stats-cards>

      <!-- Recent Documents with Search and Filters -->
      <nz-card nzTitle="Recent Documents" class="mb-6">
        <ng-template #extra>
          <button nz-button nzType="link" routerLink="/documents">
            View All
            <nz-icon nzType="arrow-right"></nz-icon>
          </button>
        </ng-template>
        
        <!-- Search and Filter Controls -->
        <div class="mb-4">
          <div nz-row [nzGutter]="[16, 16]">
            <!-- Search Input -->
            <div nz-col [nzSpan]="12">
              <nz-input-group nzSearch [nzSuffix]="suffixIconSearch">
                <input 
                  type="text" 
                  nz-input 
                  placeholder="Search documents..." 
                  [formControl]="searchControl">
              </nz-input-group>
              <ng-template #suffixIconSearch>
                <nz-icon nzType="search"></nz-icon>
              </ng-template>
            </div>
            
            <!-- Status Filter -->
            <div nz-col [nzSpan]="6">
              <nz-select 
                nzPlaceHolder="Filter by Status" 
                nzAllowClear
                [formControl]="statusControl"
                style="width: 100%;">
                <nz-option nzLabel="Active" nzValue="ACTIVE"></nz-option>
                <nz-option nzLabel="Inactive" nzValue="INACTIVE"></nz-option>
                <nz-option nzLabel="Archived" nzValue="ARCHIVED"></nz-option>
                <nz-option nzLabel="Draft" nzValue="DRAFT"></nz-option>
              </nz-select>
            </div>
            
            <!-- Sort Options -->
            <div nz-col [nzSpan]="6">
              <nz-select 
                nzPlaceHolder="Sort by" 
                [formControl]="sortControl"
                style="width: 100%;">
                <nz-option nzLabel="Newest First" nzValue="createdAt,desc"></nz-option>
                <nz-option nzLabel="Oldest First" nzValue="createdAt,asc"></nz-option>
                <nz-option nzLabel="Title A-Z" nzValue="title,asc"></nz-option>
                <nz-option nzLabel="Title Z-A" nzValue="title,desc"></nz-option>
                <nz-option nzLabel="Recently Updated" nzValue="updatedAt,desc"></nz-option>
              </nz-select>
            </div>
          </div>
        </div>
        
        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
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
            <div class="text-center py-12">
              <nz-icon nzType="file-text" class="text-6xl text-gray-300 mb-4"></nz-icon>
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                {{ hasFilters() ? 'No documents match your search' : 'No documents yet' }}
              </h3>
              <p class="text-gray-500 mb-4">
                {{ hasFilters() ? 'Try adjusting your search filters' : 'Create your first document to get started' }}
              </p>
              @if (!hasFilters()) {
                <button nz-button nzType="primary" routerLink="/documents/new">
                  <nz-icon nzType="plus"></nz-icon>
                  Create Document
                </button>
              } @else {
                <button nz-button nzType="default" (click)="clearFilters()">
                  <nz-icon nzType="clear"></nz-icon>
                  Clear Filters
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
      min-height: 100vh;
      background-color: #f5f5f5;
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

    .search-filters {
      background: #fafafa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private destroyRef = inject(DestroyRef);
  
  documents = signal<{ content: Document[]; totalElements: number }>({ content: [], totalElements: 0 });
  isLoading = signal(false);
  pageSize = 10; // Show more items on dashboard with search
  pageIndex = 0;
  
  // Form controls for search and filtering
  searchControl = new FormControl('');
  statusControl = new FormControl<string | null>(null);
  sortControl = new FormControl<string>('createdAt,desc');
  
  ngOnInit(): void {
    this.loadDocuments();
    this.setupSearchAndFilters();
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

    // Status filter
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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
      params.search = searchTerm;
    }

    // Add status filter if selected
    const status = this.statusControl.value;
    if (status) {
      params.status = status;
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
  
  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDocuments();
  }
  
  hasFilters(): boolean {
    return !!(this.searchControl.value?.trim() || this.statusControl.value);
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue(null);
    this.sortControl.setValue('createdAt,desc');
    this.pageIndex = 0;
    this.loadDocuments();
  }
}
