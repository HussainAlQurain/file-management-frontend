import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';

interface Stats {
  totalDocuments: number;
  documentsToday: number;
  myDocuments: number;
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [
    CommonModule, 
    NzCardModule, 
    NzIconModule, 
    NzStatisticModule,
    NzGridModule
  ],
  template: `
    <div nz-row [nzGutter]="[16, 16]" class="mb-8">
      <!-- Total Documents -->
      <div nz-col [nzSpan]="8">
        <nz-card class="text-center stats-card">
          <nz-statistic 
            nzTitle="Total Documents" 
            [nzValue]="stats().totalDocuments"
            [nzValueStyle]="{ color: '#1890ff' }">
            <ng-template #nzPrefix>
              <nz-icon nzType="file-text" nzTheme="outline"></nz-icon>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>
      
      <!-- Documents Today -->
      <div nz-col [nzSpan]="8">
        <nz-card class="text-center stats-card">
          <nz-statistic 
            nzTitle="Added Today" 
            [nzValue]="stats().documentsToday"
            [nzValueStyle]="{ color: '#52c41a' }">
            <ng-template #nzPrefix>
              <nz-icon nzType="calendar" nzTheme="outline"></nz-icon>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>
      
      <!-- My Documents -->
      <div nz-col [nzSpan]="8">
        <nz-card class="text-center stats-card">
          <nz-statistic 
            nzTitle="My Documents" 
            [nzValue]="stats().myDocuments"
            [nzValueStyle]="{ color: '#722ed1' }">
            <ng-template #nzPrefix>
              <nz-icon nzType="user" nzTheme="outline"></nz-icon>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      transition: all 0.3s ease;
      border: 1px solid #f0f0f0;
    }

    .stats-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    ::ng-deep .ant-statistic-title {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin-bottom: 8px;
    }

    ::ng-deep .ant-statistic-content {
      font-size: 24px;
      font-weight: 600;
    }

    ::ng-deep .ant-statistic-content-prefix {
      margin-right: 8px;
      font-size: 20px;
    }
  `]
})
export class StatsCardsComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private statsSubscription: Subscription | undefined;

  stats = signal<Stats>({
    totalDocuments: 0,
    documentsToday: 0,
    myDocuments: 0
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    const currentUser = this.authService.currentUserSignal();
    const userId = currentUser?.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIsoString = today.toISOString();

    const totalDocuments$ = this.documentService.list({ page: 0, size: 1 }).pipe(
      map(page => page.totalElements),
      catchError(err => {
        console.error('Error loading total documents stats', err);
        return of(0);
      })
    );

    const documentsToday$ = this.documentService.list({ fromDate: todayIsoString, page: 0, size: 1 }).pipe(
      map(page => page.totalElements),
      catchError(err => {
        console.error('Error loading documents today stats', err);
        return of(0);
      })
    );

    // Get user's own documents count
    const myDocuments$ = userId
      ? this.documentService.list({ page: 0, size: 1000 }).pipe(
          map(page => page.content.filter(doc => doc.owner?.id === userId).length),
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
          myDocuments
        });
      },
      error: (error) => {
        console.error('Error loading dashboard statistics', error);
        this.stats.set({
          totalDocuments: 0,
          documentsToday: 0,
          myDocuments: 0
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.statsSubscription?.unsubscribe();
  }
}
