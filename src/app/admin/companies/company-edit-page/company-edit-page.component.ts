import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CompanyService } from '../../../core/services/company.service';
import { Company, UpdateCompanyDto } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-company-edit-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-4 max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-3xl font-bold">Edit Company</h2>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-8">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Company Name</mat-label>
                <input matInput formControlName="name" placeholder="Enter company name" required>
                @if (companyForm.get('name')?.hasError('required') && companyForm.get('name')?.touched) {
                  <mat-error>Company name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" placeholder="Enter company description" rows="3"></textarea>
              </mat-form-field>

              <div class="flex gap-4 pt-4">
                <button mat-raised-button color="primary" type="submit" [disabled]="companyForm.invalid || isSubmitting()">
                  @if (isSubmitting()) {
                    <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                  }
                  Update Company
                </button>
                <button mat-button type="button" (click)="goBack()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class CompanyEditPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);

  isLoading = signal(false);
  isSubmitting = signal(false);
  company = signal<Company | null>(null);

  companyForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]]
  });

  ngOnInit() {
    this.loadCompany();
  }

  loadCompany() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isLoading.set(true);
      this.companyService.get(id).subscribe({
        next: (company) => {
          this.company.set(company);
          this.companyForm.patchValue({
            name: company.name,
            description: company.description || ''
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading company:', error);
          this.snackbar.error('Failed to load company');
          this.isLoading.set(false);
          this.goBack();
        }
      });
    }
  }

  onSubmit() {
    if (this.companyForm.valid && this.company()) {
      this.isSubmitting.set(true);
      
      const updateData: UpdateCompanyDto = {
        name: this.companyForm.value.name,
        description: this.companyForm.value.description || undefined
      };

      this.companyService.update(this.company()!.id, updateData).subscribe({
        next: (company) => {
          this.snackbar.success('Company updated successfully');
          this.router.navigate(['/companies']);
        },
        error: (error) => {
          console.error('Error updating company:', error);
          this.snackbar.error('Failed to update company');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/companies']);
  }
}
