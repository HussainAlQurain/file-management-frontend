import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TranslationService } from '../../../core/services/translation.service';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { UserService, CreateUserDTO } from '../../../core/services/user.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User, UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-user-create-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzGridModule
  ],
  template: `
    <div class="user-create-container" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'admin.users.create.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'admin.users.create.subtitle' | translate }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="default" routerLink="../" class="action-button secondary">
                <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                <span>{{ 'admin.users.create.back' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User Form -->
      <nz-card class="form-card" [nzTitle]="'admin.users.create.form.title' | translate">
        <form nz-form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'admin.users.create.form.username' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="usernameErrorTpl">
                  <input nz-input formControlName="username" [placeholder]="'admin.users.create.form.username_placeholder' | translate">
                  <ng-template #usernameErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>{{ 'admin.users.create.form.username_required' | translate }}</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'admin.users.create.form.email' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="emailErrorTpl">
                  <input nz-input type="email" formControlName="email" [placeholder]="'admin.users.create.form.email_placeholder' | translate">
                  <ng-template #emailErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>{{ 'admin.users.create.form.email_required' | translate }}</span>
                    } @else if (control.hasError('email')) {
                      <span>{{ 'admin.users.create.form.email_invalid' | translate }}</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>{{ 'admin.users.create.form.full_name' | translate }}</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="fullName" [placeholder]="'admin.users.create.form.full_name_placeholder' | translate">
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'admin.users.create.form.password' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="passwordErrorTpl">
                  <input nz-input type="password" formControlName="password" [placeholder]="'admin.users.create.form.password_placeholder' | translate">
                  <ng-template #passwordErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>{{ 'admin.users.create.form.password_required' | translate }}</span>
                    } @else if (control.hasError('minlength')) {
                      <span>{{ 'admin.users.create.form.password_min' | translate }}</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="24">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'admin.users.create.form.roles' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'admin.users.create.form.roles_required' | translate">
                  <nz-select 
                    formControlName="roles" 
                    nzMode="multiple" 
                    [nzPlaceHolder]="'admin.users.create.form.roles_placeholder' | translate">
                    @for (role of userRoles; track role) {
                      <nz-option [nzValue]="role" [nzLabel]="'admin.users.roles.' + role | translate">
                        <nz-icon [nzType]="getRoleIcon(role)" class="role-icon"></nz-icon>
                        <span>{{ 'admin.users.roles.' + role | translate }}</span>
                      </nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button nz-button nzType="default" routerLink="../" class="cancel-button">
              <nz-icon nzType="close"></nz-icon>
              <span>{{ 'admin.users.create.form.cancel' | translate }}</span>
            </button>
            <button 
              nz-button 
              nzType="primary" 
              [nzLoading]="isSubmitting()"
              [disabled]="userForm.invalid"
              type="submit"
              class="submit-button">
              <nz-icon nzType="user-add"></nz-icon>
              <span>{{ 'admin.users.create.form.create' | translate }}</span>
            </button>
          </div>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    .user-create-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    /* Page Header Redesign */
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

    /* Header Top Row */
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

    .action-button.secondary {
      background: #fff;
      border: 1px solid #d9d9d9;
      color: rgba(0, 0, 0, 0.65);
    }

    .action-button.secondary:hover {
      border-color: #40a9ff;
      color: #40a9ff;
    }

    /* Form Card */
    .form-card {
      max-width: 800px;
      margin: 0 auto 24px auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    ::ng-deep .form-card .ant-card-head {
      background: #fafafa;
      border-bottom: 1px solid #e8e8e8;
    }

    ::ng-deep .form-card .ant-card-head-title {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    ::ng-deep .form-card .ant-card-body {
      padding: 24px;
    }

    /* Form Styling */
    ::ng-deep .ant-form-item-label > label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }

    ::ng-deep .ant-input,
    ::ng-deep .ant-select-selector {
      border-radius: 6px;
    }

    ::ng-deep .ant-input:focus,
    ::ng-deep .ant-select-focused .ant-select-selector {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    .role-icon {
      margin-right: 8px;
      font-size: 14px;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #e8e8e8;
      margin-top: 24px;
    }

    .cancel-button {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
    }

    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .page-header-content {
        padding: 16px;
      }
      
      .form-card {
        margin: 0 16px 24px 16px;
        max-width: none;
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

      .form-card {
        margin: 0 12px 24px 12px;
      }

      ::ng-deep .form-card .ant-card-body {
        padding: 16px;
      }

      ::ng-deep .ant-col {
        margin-bottom: 16px;
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
      
      .action-button {
        width: 100%;
      }
    }
  `]
})
export class UserCreatePageComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  protected translationService = inject(TranslationService);

  isSubmitting = signal(false);
  userRoles = ['USER', 'SYS_ADMIN'];

  userForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    fullName: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roles: [['USER'], Validators.required] // Default to USER role
  });

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.snackbar.error('Please correct the errors in the form.');
      // Mark all fields as touched to display errors
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.userForm.value;
    const userData: CreateUserDTO = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      roleCodes: formValue.roles,
      fullName: formValue.fullName
    };

    this.userService.create(userData).subscribe({
      next: (newUser) => {
        this.isSubmitting.set(false);
        const successMessage = this.translateService.instant('admin.users.create.messages.success').replace('{username}', newUser.username);
        this.snackbar.success(successMessage);
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMessage = this.translateService.instant('admin.users.create.messages.error') + ': ' + (err.error?.message || err.message);
        this.snackbar.error(errorMessage);
      }
    });
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SYS_ADMIN':
        return 'crown';
      case 'USER':
        return 'user';
      default:
        return 'user';
    }
  }
}
