import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Stats {
  totalDocuments: number;
  documentsToday: number;
  myDocuments: number;
  pendingReviews?: number;
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Documents -->
      <mat-card class="w-full">
        <mat-card-content class="flex items-center">
          <div class="mr-4 bg-blue-100 rounded-full p-3">
            <mat-icon class="text-blue-700">description</mat-icon>
          </div>
          <div>
            <div class="text-sm text-gray-500 font-medium">Total Documents</div>
            <div class="text-xl font-bold">{{ stats().totalDocuments }}</div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Documents Today -->
      <mat-card class="w-full">
        <mat-card-content class="flex items-center">
          <div class="mr-4 bg-green-100 rounded-full p-3">
            <mat-icon class="text-green-700">today</mat-icon>
          </div>
          <div>
            <div class="text-sm text-gray-500 font-medium">Added Today</div>
            <div class="text-xl font-bold">{{ stats().documentsToday }}</div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- My Documents -->
      <mat-card class="w-full">
        <mat-card-content class="flex items-center">
          <div class="mr-4 bg-purple-100 rounded-full p-3">
            <mat-icon class="text-purple-700">folder_special</mat-icon>
          </div>
          <div>
            <div class="text-sm text-gray-500 font-medium">My Documents</div>
            <div class="text-xl font-bold">{{ stats().myDocuments }}</div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Pending Reviews -->
      <mat-card class="w-full">
        <mat-card-content class="flex items-center">
          <div class="mr-4 bg-amber-100 rounded-full p-3">
            <mat-icon class="text-amber-700">pending_actions</mat-icon>
          </div>
          <div>
            <div class="text-sm text-gray-500 font-medium">Pending Reviews</div>
            <div class="text-xl font-bold">{{ stats().pendingReviews || 0 }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class StatsCardsComponent implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<Stats>({
    totalDocuments: 0,
    documentsToday: 0,
    myDocuments: 0,
    pendingReviews: 0
  });
  
  ngOnInit(): void {
    this.loadStats();
  }
  
  loadStats(): void {
    this.http.get<Stats>(`${environment.apiBase}/statistics/dashboard`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.stats.set(data);
        },
        error: (error) => {
          console.error('Error loading dashboard statistics', error);
          // Set some mock data for demo purposes
          this.stats.set({
            totalDocuments: 127,
            documentsToday: 8,
            myDocuments: 42,
            pendingReviews: 5
          });
        }
      });
  }
}
