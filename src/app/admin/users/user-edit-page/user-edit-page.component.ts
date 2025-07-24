import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { UserService } from '../../../core/services/user.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User, UserRole } from '../../../core/models/auth.model';
import { UpdateUserDTO } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-edit-page',
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
    NzSpinModule,
    NzResultModule,
    NzGridModule
  ],
  template: `
    <div class="user-edit-container">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'admin.users.edit.title' | translate }}</h1>
              <p class="page-subtitle">{{ userForm.get('username')?.value || ('admin.users.edit.loading' | translate) }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="default" routerLink="../../" class="action-button secondary">
                <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                <span>{{ 'admin.users.edit.back' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (isLoadingUser()) {
        <div class="loading-container">
          <nz-spin nzSize="large" [nzTip]="'admin.users.edit.loading' | translate"></nz-spin>
        </div>
      } @else if (!userForm.value.id && !isLoadingUser()) {
        <div class="not-found-container">
          <nz-result 
            nzStatus="404" 
            [nzTitle]="'admin.users.edit.not_found' | translate"
            [nzSubTitle]="'admin.users.edit.not_found_subtitle' | translate">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="../../" class="back-button">
                <nz-icon nzType="arrow-left"></nz-icon>
                <span>{{ 'admin.users.edit.back' | translate }}</span>
              </button>
            </div>
          </nz-result>
        </div>
      } @else {
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
                      } @else if (control.hasError('minlength')) {
                        <span>Username must be at least 3 characters long</span>
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
              <button nz-button nzType="default" routerLink="../../" class="cancel-button">
                <nz-icon nzType="close"></nz-icon>
                <span>{{ 'admin.users.create.form.cancel' | translate }}</span>
              </button>
              <button 
                nz-button 
                nzType="primary" 
                [nzLoading]="isSubmitting()"
                [disabled]="userForm.invalid || !userForm.dirty"
                type="submit"
                class="submit-button">
                <nz-icon nzType="save"></nz-icon>
                <span>{{ 'admin.users.create.form.save' | translate }}</span>
              </button>
            </div>
          </form>
        </nz-card>
      }
    </div>
  `,
  styles: [`
    .user-edit-container {
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

    /* Loading Container */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      background: #fff;
      border-radius: 8px;
      margin: 0 24px;
    }

    /* Not Found Container */
    .not-found-container {
      background: #fff;
      border-radius: 8px;
      margin: 0 24px;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
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

      .loading-container,
      .not-found-container {
        margin: 0 16px;
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

      .loading-container,
      .not-found-container {
        margin: 0 12px;
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
export class UserEditPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  userId = signal<number | null>(null);
  isSubmitting = signal(false);
  isLoadingUser = signal(true);
  userRoles = ['USER', 'SYS_ADMIN'];

  userForm: FormGroup = this.fb.group({
    id: [null], // To store the user ID, not for editing
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    roles: [[] as string[], Validators.required]
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.userId.set(+id);
          this.isLoadingUser.set(true);
          return this.userService.get(+id);
        }
        this.isLoadingUser.set(false);
        this.snackbar.error('User ID not found in route.');
        this.router.navigate(['/users']);
        return []; // Or throwError
      })
    ).subscribe({
      next: (user) => {
        if (user) {
          this.userForm.patchValue(user);
        }
        this.isLoadingUser.set(false);
      },
      error: (err) => {
        this.isLoadingUser.set(false);
        this.snackbar.error('Failed to load user data: ' + (err.error?.message || err.message));
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.snackbar.error('Please correct the errors in the form.');
      this.userForm.markAllAsTouched();
      return;
    }
    if (!this.userForm.dirty) {
      this.snackbar.info(this.translateService.instant('admin.users.edit.messages.no_changes'));
      return;
    }

    this.isSubmitting.set(true);
    const currentUserId = this.userId();
    if (!currentUserId) {
        this.snackbar.error('User ID is missing, cannot update.');
        this.isSubmitting.set(false);
        return;
    }

    const userData: UpdateUserDTO = {
      email: this.userForm.value.email,
      roleCodes: this.userForm.value.roles,
      username: this.userForm.value.username
    };

    this.userService.patch(currentUserId, userData).subscribe({
      next: (updatedUser) => {
        this.isSubmitting.set(false);
        const successMessage = this.translateService.instant('admin.users.edit.messages.success').replace('{username}', updatedUser.username);
        this.snackbar.success(successMessage);
        this.userForm.markAsPristine();

        // If the updated user is the current user and the username changed, force logout
        const currentUser = this.authService.currentUserSignal();
        if (currentUser && currentUser.id === updatedUser.id && currentUser.username !== updatedUser.username) {
          const changeMessage = this.translateService.instant('admin.users.edit.messages.username_changed');
          this.snackbar.info(changeMessage);
          setTimeout(() => this.authService.logout(), 1500);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.message || '';
        if (msg.includes('Username already exists')) {
          this.snackbar.error(this.translateService.instant('admin.users.edit.messages.username_taken'));
        } else if (msg.includes('Email already exists')) {
          this.snackbar.error(this.translateService.instant('admin.users.edit.messages.email_taken'));
        } else {
          const errorMessage = this.translateService.instant('admin.users.edit.messages.error') + ': ' + msg;
          this.snackbar.error(errorMessage);
        }
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
