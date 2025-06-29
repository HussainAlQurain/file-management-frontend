import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

import { CompanyService } from '../../../core/services/company.service';
import { Company, UpdateCompanyDto } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-company-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzSpinModule,
    NzPageHeaderModule,
    NzBreadCrumbModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <nz-page-header class="mb-6" [nzGhost]="false">
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a (click)="goBack()">Companies</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Edit Company</nz-breadcrumb-item>
        </nz-breadcrumb>
        
        <nz-page-header-title>Edit Company</nz-page-header-title>
        <nz-page-header-subtitle>{{ company()?.name || 'Loading...' }}</nz-page-header-subtitle>
        
        <nz-page-header-extra>
          <button nz-button nzType="default" (click)="goBack()">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Companies
          </button>
        </nz-page-header-extra>
      </nz-page-header>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <nz-spin nzSize="large" nzTip="Loading company..."></nz-spin>
        </div>
      } @else {
        <!-- Company Form -->
        <div class="max-w-2xl">
          <nz-card nzTitle="Company Information">
            <form nz-form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Company Name</nz-form-label>
                <nz-form-control [nzErrorTip]="nameErrorTpl">
                  <input nz-input formControlName="name" placeholder="Enter company name">
                  <ng-template #nameErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>Company name is required</span>
                    } @else if (control.hasError('maxlength')) {
                      <span>Company name cannot exceed 255 characters</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Description</nz-form-label>
                <nz-form-control [nzErrorTip]="'Description cannot exceed 1000 characters'">
                  <textarea 
                    nz-input 
                    formControlName="description" 
                    placeholder="Enter company description (optional)"
                    [nzAutosize]="{ minRows: 3, maxRows: 6 }">
                  </textarea>
                </nz-form-control>
              </nz-form-item>

              <!-- Form Actions -->
              <div class="flex justify-end gap-3 pt-6 border-t">
                <button nz-button nzType="default" type="button" (click)="goBack()">
                  <nz-icon nzType="close"></nz-icon>
                  Cancel
                </button>
                <button 
                  nz-button 
                  nzType="primary" 
                  type="submit" 
                  [nzLoading]="isSubmitting()"
                  [disabled]="companyForm.invalid">
                  <nz-icon nzType="save"></nz-icon>
                  Update Company
                </button>
              </div>
            </form>
          </nz-card>
        </div>
      }
    </div>
  `,
  styles: [`
    nz-page-header {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
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
