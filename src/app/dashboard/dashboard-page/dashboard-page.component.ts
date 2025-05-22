import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { DocumentTableComponent } from '../../documents/components/document-table/document-table.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    DocumentTableComponent
  ],
  template: `
    <div class="dashboard">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Documents</h1>
      </header>
      <app-document-table
        [documents]="documents().content"
        [loading]="isLoading()"
        [totalItems]="documents().totalElements"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        (page)="onPageChange($event)">
      </app-document-table>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private destroyRef = inject(DestroyRef);
  
  documents = signal<{ content: Document[]; totalElements: number }>({ content: [], totalElements: 0 });
  isLoading = signal(false);
  pageSize = 10;
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
}
