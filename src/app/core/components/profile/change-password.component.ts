import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { UserService, ChangePasswordDTO } from '../../services/user.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <div class="p-6">
      <div class="max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-6 text-center">Change Password</h2>
        
        <nz-card nzTitle="Update Your Password">
          <form nz-form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <nz-form-item>
              <nz-form-label [nzRequired]="true">Current Password</nz-form-label>
              <nz-form-control [nzErrorTip]="oldPasswordErrorTpl">
                <nz-input-group [nzSuffix]="oldPasswordSuffix">
                  <input 
                    nz-input 
                    formControlName="oldPassword" 
                    [type]="showOldPassword ? 'text' : 'password'" 
                    placeholder="Enter your current password">
                </nz-input-group>
                <ng-template #oldPasswordSuffix>
                  <nz-icon 
                    class="cursor-pointer text-gray-400 hover:text-gray-600" 
                    [nzType]="showOldPassword ? 'eye-invisible' : 'eye'" 
                    (click)="showOldPassword = !showOldPassword">
                  </nz-icon>
                </ng-template>
                <ng-template #oldPasswordErrorTpl let-control>
                  @if (control.hasError('required')) {
                    <span>Current password is required</span>
                  }
                </ng-template>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzRequired]="true">New Password</nz-form-label>
              <nz-form-control [nzErrorTip]="newPasswordErrorTpl">
                <nz-input-group [nzSuffix]="newPasswordSuffix">
                  <input 
                    nz-input 
                    formControlName="newPassword" 
                    [type]="showNewPassword ? 'text' : 'password'" 
                    placeholder="Enter your new password">
                </nz-input-group>
                <ng-template #newPasswordSuffix>
                  <nz-icon 
                    class="cursor-pointer text-gray-400 hover:text-gray-600" 
                    [nzType]="showNewPassword ? 'eye-invisible' : 'eye'" 
                    (click)="showNewPassword = !showNewPassword">
                  </nz-icon>
                </ng-template>
                <ng-template #newPasswordErrorTpl let-control>
                  @if (control.hasError('required')) {
                    <span>New password is required</span>
                  } @else if (control.hasError('minlength')) {
                    <span>Password must be at least 6 characters</span>
                  }
                </ng-template>
              </nz-form-control>
            </nz-form-item>

            <div class="flex justify-end pt-4">
              <button 
                nz-button 
                nzType="primary" 
                [nzLoading]="isLoading()" 
                [disabled]="passwordForm.invalid"
                type="submit">
                <nz-icon nzType="lock"></nz-icon>
                Change Password
              </button>
            </div>
          </form>
        </nz-card>
      </div>
    </div>
  `
})
export class ChangeMyPasswordComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  isLoading = signal(false);
  showOldPassword = false;
  showNewPassword = false;

  passwordForm: FormGroup = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.isLoading.set(true);
    const { oldPassword, newPassword } = this.passwordForm.value;
    
    const dto: ChangePasswordDTO = {
      oldPassword,
      newPassword,
      confirmPassword: newPassword
    };
    
    this.userService.changePassword(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackbar.success('Password changed successfully.');
        this.router.navigate(['/profile/me']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to change password. ' + (err.error?.message || ''));
      }
    });
  }
}
