import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';

import { CompanyService } from '../../core/services/company.service';
import { CompanyFolderDto } from '../../core/models/company.model';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-company-hierarchy-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold">Company Structure</h2>
        <button mat-raised-button color="primary" (click)="navigateToDocuments()">
          <mat-icon>description</mat-icon>
          Browse Documents
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-8">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else {
        @if (companyFolders().length === 0) {
          <mat-card>
            <mat-card-content class="text-center py-8">
              <mat-icon class="text-6xl mb-4 text-gray-400">business</mat-icon>
              <p class="text-lg text-gray-600">No companies found</p>
              <p class="text-gray-500">Contact your administrator to set up companies and document types</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="grid gap-4">
            @for (company of companyFolders(); track company.id) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title class="flex items-center">
                    <mat-icon class="mr-2">business</mat-icon>
                    {{ company.name }}
                  </mat-card-title>
                  @if (company.description) {
                    <mat-card-subtitle>{{ company.description }}</mat-card-subtitle>
                  }
                </mat-card-header>
                <mat-card-content>
                  @if (company.resourceTypes.length === 0) {
                    <p class="text-gray-500 italic">No document types available</p>
                  } @else {
                    <div class="space-y-2">
                      <h4 class="font-medium text-sm text-gray-700 mb-3">Available Document Types:</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        @for (resourceType of company.resourceTypes; track resourceType.id) {
                          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                               (click)="navigateToDocumentsByType(company.id, resourceType.id)">
                            <mat-icon class="mr-2 text-blue-600">category</mat-icon>
                            <div>
                              <div class="font-medium">{{ resourceType.name }}</div>
                              <div class="text-sm text-gray-600">{{ resourceType.code }}</div>
                              @if (resourceType.description) {
                                <div class="text-xs text-gray-500">{{ resourceType.description }}</div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button (click)="navigateToCompanyDocuments(company.id)">
                    <mat-icon>folder</mat-icon>
                    View All Documents
                  </button>
                  <button mat-button color="primary" (click)="navigateToCreateDocument(company.id)">
                    <mat-icon>add</mat-icon>
                    Create Document
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .mat-mdc-card {
      margin-bottom: 1rem;
    }
    
    .resource-type-item:hover {
      background-color: #f5f5f5;
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
