import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CompanyService } from '../../../core/services/company.service';
import { CreateCompanyDto } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-company-create-page',
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
        <h2 class="text-3xl font-bold">Create Company</h2>
      </div>

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
                Create Company
              </button>
              <button mat-button type="button" (click)="goBack()">Cancel</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class CompanyCreatePageComponent {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  isSubmitting = signal(false);

  companyForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]]
  });

  onSubmit() {
    if (this.companyForm.valid) {
      this.isSubmitting.set(true);
      
      const companyData: CreateCompanyDto = {
        name: this.companyForm.value.name,
        description: this.companyForm.value.description || undefined
      };

      this.companyService.create(companyData).subscribe({
        next: (company) => {
          this.snackbar.success('Company created successfully');
          this.router.navigate(['/companies']);
        },
        error: (error) => {
          console.error('Error creating company:', error);
          this.snackbar.error('Failed to create company');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/companies']);
  }
}
