import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
import { TranslationService } from '../../../core/services/translation.service';

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
    NzBreadCrumbModule,
    TranslateModule
  ],
  template: `
    <div class="company-edit-container" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      @if (isLoading()) {
        <!-- Loading State -->
        <div class="loading-container">
          <nz-spin nzSize="large" [nzTip]="'admin.companies.edit.loading' | translate"></nz-spin>
        </div>
      } @else {
        <!-- Page Header -->
        <div class="page-header-wrapper">
          <div class="page-header-content">
            <!-- Title and Actions Row -->
            <div class="header-top">
              <div class="header-title-section">
                <h1 class="page-title">{{ 'admin.companies.edit.title' | translate }}</h1>
                <p class="page-subtitle">{{ company()?.name || ('admin.companies.edit.subtitle' | translate) }}</p>
              </div>
              <div class="header-actions">
                <button nz-button nzType="default" (click)="goBack()" class="action-button">
                  <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                  <span>{{ 'admin.companies.edit.back' | translate }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Company Form -->
        <div class="form-container">
          <nz-card [nzTitle]="'admin.companies.edit.form.title' | translate" class="form-card">
            <form nz-form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="company-form">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'admin.companies.edit.form.name' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="nameErrorTpl">
                  <input 
                    nz-input 
                    formControlName="name" 
                    [placeholder]="'admin.companies.edit.form.name_placeholder' | translate"
                    class="rtl-input">
                  <ng-template #nameErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>{{ 'admin.companies.edit.form.name_required' | translate }}</span>
                    } @else if (control.hasError('maxlength')) {
                      <span>{{ 'admin.companies.edit.form.name_maxlength' | translate }}</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>{{ 'admin.companies.edit.form.description' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'admin.companies.edit.form.description_maxlength' | translate">
                  <textarea 
                    nz-input 
                    formControlName="description" 
                    [placeholder]="'admin.companies.edit.form.description_placeholder' | translate"
                    [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                    class="rtl-input">
                  </textarea>
                </nz-form-control>
              </nz-form-item>

              <!-- Form Actions -->
              <div class="form-actions">
                <button nz-button nzType="default" type="button" (click)="goBack()" [disabled]="isSubmitting()" class="cancel-button">
                  <nz-icon nzType="close" nzTheme="outline"></nz-icon>
                  <span>{{ 'admin.companies.edit.form.cancel' | translate }}</span>
                </button>
                <button 
                  nz-button 
                  nzType="primary" 
                  type="submit" 
                  [nzLoading]="isSubmitting()"
                  [disabled]="companyForm.invalid"
                  class="submit-button">
                  <nz-icon nzType="save" nzTheme="outline"></nz-icon>
                  <span>{{ 'admin.companies.edit.form.update' | translate }}</span>
                </button>
              </div>
            </form>
          </nz-card>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Company Edit Container */
    .company-edit-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }

    /* Custom Header Pattern */
    .page-header-wrapper {
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 24px;
    }
    
    .page-header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    
    .header-title-section {
      flex: 1;
      min-width: 0;
    }
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
      line-height: 1.4;
    }

    .header-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .action-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    /* Form Container */
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .form-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Company Form */
    .company-form {
      width: 100%;
    }

    /* RTL Input Component */
    .rtl-input {
      width: 100%;
    }

    [dir="rtl"] .rtl-input {
      text-align: right;
      direction: rtl;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
      margin-top: 32px;
    }

    .cancel-button,
    .submit-button {
      min-width: 120px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* RTL Form Actions */
    [dir="rtl"] .form-actions {
      justify-content: flex-start;
    }

    /* Global RTL for Ant Design Form Components */
    [dir="rtl"] .ant-input,
    [dir="rtl"] .ant-input-affix-wrapper {
      text-align: right !important;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .page-header-content {
        padding: 16px;
      }
      
      .form-container {
        padding: 0 16px;
      }
    }

    @media (max-width: 768px) {
      .header-top {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .action-button {
        justify-content: center;
        min-width: 160px;
      }
      
      .page-header-content {
        padding: 12px;
      }

      .form-container {
        padding: 0 12px;
      }

      .form-actions {
        flex-direction: column;
        gap: 8px;
      }

      .cancel-button,
      .submit-button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
    }
  `]
})
export class CompanyEditPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  private translateService = inject(TranslateService);
  translationService = inject(TranslationService);

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
          const errorMessage = this.translateService.instant('admin.companies.edit.not_found');
          this.snackbar.error(errorMessage);
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
          // Manual string interpolation for success message
          const successMessage = this.translateService.instant('admin.companies.edit.success')
            .replace('{name}', company.name);
          this.snackbar.success(successMessage);
          this.router.navigate(['/companies']);
        },
        error: (error) => {
          console.error('Error updating company:', error);
          const errorMessage = this.translateService.instant('admin.companies.edit.error');
          this.snackbar.error(errorMessage);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/companies']);
  }
}
