import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { Document } from '../../../core/models/document.model';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  changedBy: string;
  changeDate: string;
  changeDescription?: string;
}

@Component({
  selector: 'app-version-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="version-timeline">
      @if (isLoading()) {
        <div class="flex justify-center my-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (versions().length) {
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-4 top-5 bottom-0 w-0.5 bg-gray-300"></div>
          
          <!-- Versions -->
          @for (version of versions(); track version.versionNumber) {
            <div class="flex mb-6 relative">
              <!-- Dot -->
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center z-10" 
                [ngClass]="version.versionNumber === currentVersion ? 'bg-primary text-white' : 'bg-gray-200'">
                {{ version.versionNumber }}
              </div>
              
              <!-- Version content -->
              <div class="ml-4 flex-grow">
                <div class="flex items-center">
                  <h3 class="font-medium">
                    {{ version.versionNumber === currentVersion ? 'Current Version' : 'Version ' + version.versionNumber }}
                  </h3>
                  
                  <!-- View document at this version button -->
                  <button 
                    *ngIf="version.versionNumber !== currentVersion"
                    mat-icon-button 
                    color="primary"
                    matTooltip="View this version"
                    (click)="viewVersion(version)">
                    <mat-icon>restore</mat-icon>
                  </button>
                </div>
                
                <p class="text-sm text-gray-500">
                  Changed by {{ version.changedBy }} on {{ version.changeDate | date:'medium' }}
                </p>
                
                @if (version.changeDescription) {
                  <p class="mt-1">{{ version.changeDescription }}</p>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-4 text-gray-500">
          <p>No version history available</p>
        </div>
      }
    </div>
  `
})
export class VersionTimelineComponent implements OnInit {
  @Input() documentId = 0;
  @Input() currentVersion = 1;
  
  private http = inject(HttpClient);
  
  versions = signal<DocumentVersion[]>([]);
  isLoading = signal(false);
  
  ngOnInit(): void {
    if (this.documentId) {
      this.loadVersions();
    }
  }
  
  loadVersions(): void {
    this.isLoading.set(true);
    
    this.http.get<DocumentVersion[]>(`${environment.apiBase}/documents/${this.documentId}/versions`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.versions.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          // For demo purposes, create some mock version data
          this.mockVersionData();
          this.isLoading.set(false);
        }
      });
  }
  
  viewVersion(version: DocumentVersion): void {
    // In a real app, this would navigate to a view of the document at this version
    console.log('View document at version', version.versionNumber);
  }
  
  private mockVersionData(): void {
    // Create mock version history for demo purposes
    const mockData: DocumentVersion[] = [];
    
    for (let i = this.currentVersion; i > 0; i--) {
      mockData.push({
        id: i,
        documentId: this.documentId,
        versionNumber: i,
        changedBy: 'John Doe',
        changeDate: new Date(new Date().setDate(new Date().getDate() - (this.currentVersion - i))).toISOString(),
        changeDescription: i === this.currentVersion ? 'Updated metadata' : 
                          i === 1 ? 'Initial document creation' : 
                          `Updated document content and attachments (v${i})`
      });
    }
    
    this.versions.set(mockData);
  }
}
