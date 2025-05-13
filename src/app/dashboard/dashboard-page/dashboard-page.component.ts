import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { StatsCardsComponent } from '../components/stats-cards/stats-cards.component';
import { RecentDocsTableComponent } from '../components/recent-docs-table/recent-docs-table.component';

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
    StatsCardsComponent,
    RecentDocsTableComponent
  ],
  template: `
    <div class="dashboard">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Dashboard</h1>
      </header>
      
      <!-- Stats Cards -->
      <app-stats-cards class="mb-8 block"></app-stats-cards>
      
      <!-- Recent Documents -->
      <section class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Recent Documents</h2>
          <a mat-flat-button color="primary" routerLink="/documents">
            View All Documents
          </a>
        </div>
        
        <app-recent-docs-table 
          [documents]="recentDocuments()"
          [loading]="isLoading()"
          (documentSelected)="openDocument($event)">
        </app-recent-docs-table>
      </section>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private documentService = inject(DocumentService);
  
  recentDocuments = signal<Document[]>([]);
  isLoading = signal(false);
  
  ngOnInit(): void {
    this.loadRecentDocuments();
  }
  
  loadRecentDocuments(): void {
    this.isLoading.set(true);
    
    this.documentService.list({ 
      page: 0, 
      size: 5, 
      sort: 'createdAt,desc' 
    })
    .pipe(takeUntilDestroyed())
    .subscribe({
      next: (result) => {
        this.recentDocuments.set(result.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
  
  openDocument(documentId: number): void {
    // Navigation is handled by the table component's routerLink
  }
}
