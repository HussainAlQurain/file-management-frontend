import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';

import { UserService, PasswordResetConfirmDTO } from '../../core/services/user.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl) {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-password-reset-confirm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzAlertModule,
    NzIconModule,
    TranslateModule
  ],
  template: `
    <div class="reset-confirm-container">
      <nz-card nzTitle="Set New Password" class="reset-card">
        
        <!-- Token Validation Loading -->
        <div *ngIf="validatingToken" class="validation-loading">
          <nz-alert 
            nzType="info" 
            nzMessage="Validating reset token..."
            nzShowIcon>
          </nz-alert>
        </div>

        <!-- Invalid Token -->
        <div *ngIf="!validatingToken && !tokenValid" class="invalid-token">
          <nz-alert 
            nzType="error" 
            nzMessage="Invalid or Expired Reset Link"
            nzDescription="This password reset link is invalid or has expired. Please request a new one."
            nzShowIcon>
          </nz-alert>
          
          <div class="actions">
            <a nz-button nzType="primary" routerLink="/auth/password-reset">
              Request New Reset Link
            </a>
            <a nz-button nzType="default" routerLink="/login">
              Back to Login
            </a>
          </div>
        </div>

        <!-- Valid Token - Password Reset Form -->
        <div *ngIf="!validatingToken && tokenValid && !resetSuccess">
          <p class="description">
            Please enter your new password below.
          </p>
          
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <nz-form-item>
              <nz-form-label nzRequired>New Password</nz-form-label>
              <nz-form-control nzErrorTip="Password must be at least 8 characters long">
                <nz-input-group [nzSuffix]="passwordSuffix">
                  <input nz-input 
                         [type]="passwordVisible ? 'text' : 'password'"
                         formControlName="newPassword" 
                         placeholder="Enter new password"
                         [disabled]="loading" />
                </nz-input-group>
                <ng-template #passwordSuffix>
                  <span 
                    nz-icon 
                    [nzType]="passwordVisible ? 'eye-invisible' : 'eye'"
                    (click)="passwordVisible = !passwordVisible"
                    class="password-toggle">
                  </span>
                </ng-template>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Confirm Password</nz-form-label>
              <nz-form-control [nzErrorTip]="getConfirmPasswordError()">
                <nz-input-group [nzSuffix]="confirmPasswordSuffix">
                  <input nz-input 
                         [type]="confirmPasswordVisible ? 'text' : 'password'"
                         formControlName="confirmPassword" 
                         placeholder="Confirm new password"
                         [disabled]="loading" />
                </nz-input-group>
                <ng-template #confirmPasswordSuffix>
                  <span 
                    nz-icon 
                    [nzType]="confirmPasswordVisible ? 'eye-invisible' : 'eye'"
                    (click)="confirmPasswordVisible = !confirmPasswordVisible"
                    class="password-toggle">
                  </span>
                </ng-template>
              </nz-form-control>
            </nz-form-item>

            <div class="password-requirements">
              <p>Password Requirements:</p>
              <ul>
                <li [class.met]="passwordLength >= 8">At least 8 characters long</li>
                <li [class.met]="hasUppercase">Contains uppercase letter</li>
                <li [class.met]="hasLowercase">Contains lowercase letter</li>
                <li [class.met]="hasNumber">Contains number</li>
              </ul>
            </div>

            <nz-form-item>
              <nz-form-control>
                <button nz-button 
                        nzType="primary" 
                        nzBlock 
                        [nzLoading]="loading"
                        [disabled]="form.invalid || loading">
                  Reset Password
                </button>
              </nz-form-control>
            </nz-form-item>
          </form>
        </div>

        <!-- Success Message -->
        <div *ngIf="resetSuccess" class="success-message">
          <nz-alert 
            nzType="success" 
            nzMessage="Password Reset Successfully"
            nzDescription="Your password has been reset successfully. You can now log in with your new password."
            nzShowIcon>
          </nz-alert>
          
          <div class="actions">
            <a nz-button nzType="primary" routerLink="/login">
              Go to Login
            </a>
          </div>
        </div>

      </nz-card>
    </div>
  `,
  styles: [`
    .reset-confirm-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .reset-card {
      width: 100%;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .description {
      color: #666;
      margin-bottom: 24px;
      text-align: center;
    }

    .validation-loading {
      text-align: center;
    }

    .invalid-token, .success-message {
      text-align: center;
    }

    .password-toggle {
      color: #bfbfbf;
      cursor: pointer;
      transition: color 0.3s;
    }

    .password-toggle:hover {
      color: #1890ff;
    }

    .password-requirements {
      margin: 16px 0;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 13px;
    }

    .password-requirements p {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: #666;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 20px;
      list-style: none;
    }

    .password-requirements li {
      margin: 4px 0;
      color: #999;
      position: relative;
    }

    .password-requirements li::before {
      content: "✗";
      position: absolute;
      left: -16px;
      color: #ff4d4f;
      font-weight: bold;
    }

    .password-requirements li.met {
      color: #52c41a;
    }

    .password-requirements li.met::before {
      content: "✓";
      color: #52c41a;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }
  `]
})
export class PasswordResetConfirmComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  loading = false;
  validatingToken = true;
  tokenValid = false;
  resetSuccess = false;
  token = '';

  passwordVisible = false;
  confirmPasswordVisible = false;

  // Password strength indicators
  passwordLength = 0;
  hasUppercase = false;
  hasLowercase = false;
  hasNumber = false;

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.validatingToken = false;
        this.tokenValid = false;
      }
    });

    // Watch password changes for strength indicator
    this.form.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password || '');
    });
  }

  validateToken(): void {
    this.userService.validateResetToken(this.token).subscribe({
      next: (isValid) => {
        this.tokenValid = isValid;
        this.validatingToken = false;
        
        if (isValid) {
          // Focus new password input
          setTimeout(() => {
            const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
            if (passwordInput) {
              passwordInput.focus();
            }
          }, 100);
        }
      },
      error: (error) => {
        console.error('Token validation failed:', error);
        this.tokenValid = false;
        this.validatingToken = false;
      }
    });
  }

  updatePasswordStrength(password: string): void {
    this.passwordLength = password.length;
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasLowercase = /[a-z]/.test(password);
    this.hasNumber = /\d/.test(password);
  }

  getConfirmPasswordError(): string {
    const confirmControl = this.form.get('confirmPassword');
    if (confirmControl?.hasError('required') && confirmControl?.dirty) {
      return 'Please confirm your password';
    }
    if (this.form.hasError('passwordMismatch') && confirmControl?.dirty) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    const request: PasswordResetConfirmDTO = {
      token: this.token,
      newPassword: this.form.value.newPassword!,
      confirmPassword: this.form.value.confirmPassword!
    };

    this.userService.confirmPasswordReset(request).subscribe({
      next: () => {
        this.resetSuccess = true;
        this.loading = false;
        this.message.success('Password reset successfully!');
      },
      error: (error) => {
        console.error('Password reset failed:', error);
        const errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
        this.message.error(errorMessage);
        this.loading = false;
      }
    });
  }
}
