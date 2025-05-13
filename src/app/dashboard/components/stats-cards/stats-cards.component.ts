import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { Page } from '../../../core/models/document.model';

interface Stats {
  totalDocuments: number;
  documentsToday: number;
  myDocuments: number;
  pendingReviews: number;
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
            <div class="text-xl font-bold">{{ stats().pendingReviews }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class StatsCardsComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private statsSubscription: Subscription | undefined;

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
    const currentUser = this.authService.currentUserSignal(); // Changed from currentUserSig
    const userId = currentUser?.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIsoString = today.toISOString();

    // Use 'list' method instead of 'searchDocuments'
    // Pass page and size as part of the DocQuery object
    const totalDocuments$ = this.documentService.list({ page: 0, size: 1 }).pipe(
      map(page => page.totalElements),
      catchError(err => {
        console.error('Error loading total documents stats', err);
        return of(0);
      })
    );

    const documentsToday$ = this.documentService.list({ fromDate: todayIsoString, page: 0, size: 1 }).pipe( // Use fromDate for createdDateAfter
      map(page => page.totalElements),
      catchError(err => {
        console.error('Error loading documents today stats', err);
        return of(0);
      })
    );

    // The backend API for documents does not seem to have an explicit ownerIdEquals query parameter.
    // We will assume for now that filtering by createdBy (if available in DocQuery) or fetching all and filtering client-side might be needed.
    // For now, to keep it simple and avoid breaking if ownerIdEquals is not supported by the 'list' method's query params,
    // we'll set myDocuments to 0. This can be refined once the backend capabilities for querying by owner are clarified.
    // If DocQuery can be extended or if there's another way to filter by owner, this should be updated.
    const myDocuments$ = userId
      ? this.documentService.list({ page: 0, size: 1 /* query for user-specific documents if API supports, e.g., createdBy: userId */ }).pipe(
          // This part needs to be adjusted based on actual API capabilities for filtering by owner.
          // If the API doesn't support direct filtering by owner ID in the 'list' query,
          // this might require fetching more documents and filtering client-side, or a dedicated endpoint.
          // For now, assuming a generic query and then potentially filtering or adjusting based on API response.
          // If the list method can take a `createdBy` or similar, that should be used.
          // Given the current DocQuery, there isn't a direct field for ownerIdEquals.
          // Setting to 0 for now as a placeholder.
          map(page => 0), // Placeholder: Adjust based on actual filtering capability
          catchError(err => {
            console.error('Error loading my documents stats', err);
            return of(0);
          })
        )
      : of(0);

    this.statsSubscription = forkJoin({
      totalDocuments: totalDocuments$,
      documentsToday: documentsToday$,
      myDocuments: myDocuments$
    }).subscribe({
      next: ({ totalDocuments, documentsToday, myDocuments }) => {
        this.stats.set({
          totalDocuments,
          documentsToday,
          myDocuments,
          pendingReviews: 0
        });
      },
      error: (error) => {
        console.error('Error loading dashboard statistics', error);
        this.stats.set({
          totalDocuments: 0,
          documentsToday: 0,
          myDocuments: 0,
          pendingReviews: 0
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.statsSubscription?.unsubscribe();
  }
}
