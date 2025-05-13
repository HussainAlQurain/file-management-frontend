import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { Document, DocQuery, Page } from '../../core/models/document.model';
import { ResourceType } from '../../core/models/resource-type.model';
import { DocumentFiltersComponent } from '../components/document-filters/document-filters.component';
import { DocumentTableComponent } from '../components/document-table/document-table.component';

@Component({
  selector: 'app-document-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule,
    DocumentFiltersComponent,
    DocumentTableComponent
  ],
  template: `
    <div class="documents-list-page">
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Documents</h1>
        <button mat-raised-button color="primary" routerLink="/documents/new">
          <mat-icon>add</mat-icon>
          New Document
        </button>
      </header>
      
      <!-- Filters -->
      <mat-card class="mb-6">
        <mat-card-content>
          <app-document-filters
            [resourceTypes]="resourceTypes()"
            (filtersChanged)="onFiltersChanged($event)">
          </app-document-filters>
        </mat-card-content>
      </mat-card>
      
      <!-- Results Table -->
      <app-document-table
        [documents]="documents().content"
        [loading]="isLoading()"
        [totalItems]="documents().totalElements"
        [pageSize]="query.size"
        [pageIndex]="query.page"
        (page)="onPageChange($event)">
      </app-document-table>
    </div>
  `
})
export class DocumentListPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private fb = inject(FormBuilder);
  
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
  isLoading = signal(false);
  
  query: DocQuery = {
    page: 0,
    size: 10,
    sort: 'createdAt,desc'
  };
  
  ngOnInit(): void {
    this.loadResourceTypes();
    this.loadDocuments();
  }
  
  loadDocuments(): void {
    this.isLoading.set(true);
    
    this.documentService.list(this.query)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (result) => {
          this.documents.set(result);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
  
  loadResourceTypes(): void {
    this.resourceTypeService.getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (result) => {
          this.resourceTypes.set(result);
        }
      });
  }
  
  onFiltersChanged(filters: Partial<DocQuery>): void {
    this.query = { ...this.query, ...filters, page: 0 }; // Reset to first page
    this.loadDocuments();
  }
  
  onPageChange(event: PageEvent): void {
    this.query.page = event.pageIndex;
    this.query.size = event.pageSize;
    this.loadDocuments();
  }
}
