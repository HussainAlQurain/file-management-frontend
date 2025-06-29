import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { DocumentTableComponent } from '../../documents/components/document-table/document-table.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzIconModule,
    NzButtonModule,
    NzStatisticModule,
    NzGridModule,
    NzSpinModule,
    DocumentTableComponent
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
      <div nz-row [nzGutter]="[16, 16]" class="mb-8">
        <div nz-col [nzSpan]="6">
          <nz-card class="text-center">
            <nz-statistic 
              nzTitle="Total Documents" 
              [nzValue]="documents().totalElements"
              [nzValueStyle]="{ color: '#1890ff' }">
              <ng-template #nzPrefix>
                <nz-icon nzType="file-text" nzTheme="outline"></nz-icon>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card class="text-center">
            <nz-statistic 
              nzTitle="Recent Documents" 
              [nzValue]="recentDocumentsCount()"
              [nzValueStyle]="{ color: '#52c41a' }">
              <ng-template #nzPrefix>
                <nz-icon nzType="clock-circle" nzTheme="outline"></nz-icon>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card class="text-center">
            <nz-statistic 
              nzTitle="This Month" 
              [nzValue]="monthlyDocumentsCount()"
              [nzValueStyle]="{ color: '#faad14' }">
              <ng-template #nzPrefix>
                <nz-icon nzType="calendar" nzTheme="outline"></nz-icon>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card class="text-center">
            <nz-statistic 
              nzTitle="Active Users" 
              [nzValue]="42"
              [nzValueStyle]="{ color: '#722ed1' }">
              <ng-template #nzPrefix>
                <nz-icon nzType="team" nzTheme="outline"></nz-icon>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Recent Documents -->
      <nz-card nzTitle="Recent Documents" class="mb-6">
        <ng-template #extra>
          <button nz-button nzType="link" routerLink="/documents">
            View All
            <nz-icon nzType="arrow-right"></nz-icon>
          </button>
        </ng-template>
        
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
              <h3 class="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p class="text-gray-500 mb-4">Create your first document to get started</p>
              <button nz-button nzType="primary" routerLink="/documents/new">
                <nz-icon nzType="plus"></nz-icon>
                Create Document
              </button>
            </div>
          }
        }
      </nz-card>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private destroyRef = inject(DestroyRef);
  
  documents = signal<{ content: Document[]; totalElements: number }>({ content: [], totalElements: 0 });
  isLoading = signal(false);
  pageSize = 5; // Show fewer items on dashboard
  pageIndex = 0;
  
  ngOnInit(): void {
    this.loadDocuments();
  }
  
  loadDocuments(): void {
    this.isLoading.set(true);
    this.documentService.list({
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'createdAt,desc'
    })
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
  
  recentDocumentsCount(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return this.documents().content.filter(doc => 
      new Date(doc.createdAt) > oneWeekAgo
    ).length;
  }
  
  monthlyDocumentsCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.documents().content.filter(doc => 
      new Date(doc.createdAt) > oneMonthAgo
    ).length;
  }
}
