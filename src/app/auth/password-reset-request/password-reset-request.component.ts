import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { TranslateModule } from '@ngx-translate/core';

import { UserService, PasswordResetRequestDTO, PasswordResetResponseDTO } from '../../core/services/user.service';

@Component({
  selector: 'app-password-reset-request',
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
    TranslateModule
  ],
  template: `
    <div class="reset-request-container">
      <nz-card nzTitle="Password Reset" class="reset-card">
        
        <div *ngIf="!submitted">
          <p class="description">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <nz-form-item>
              <nz-form-label nzRequired>Email Address</nz-form-label>
              <nz-form-control nzErrorTip="Please enter a valid email address">
                <input nz-input 
                       type="email" 
                       formControlName="email" 
                       placeholder="Enter your email address"
                       [disabled]="loading" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control>
                <button nz-button 
                        nzType="primary" 
                        nzBlock 
                        [nzLoading]="loading"
                        [disabled]="form.invalid || loading">
                  Send Reset Link
                </button>
              </nz-form-control>
            </nz-form-item>
          </form>

          <div class="back-to-login">
            <a routerLink="/login">← Back to Login</a>
          </div>
        </div>

        <!-- Success/Failure Response -->
        <div *ngIf="submitted && response">
          <div *ngIf="response.emailSent" class="success-message">
            <nz-alert 
              nzType="success" 
              nzMessage="Email Sent Successfully"
              [nzDescription]="response.message"
              nzShowIcon>
            </nz-alert>
            
            <p class="next-steps">
              Please check your email and follow the instructions to reset your password.
              The reset link will expire in 24 hours.
            </p>
          </div>

          <div *ngIf="!response.emailSent && response.success" class="manual-token">
            <nz-alert 
              nzType="warning" 
              nzMessage="Email Delivery Failed"
              [nzDescription]="response.message"
              nzShowIcon>
            </nz-alert>

            <div class="token-details" *ngIf="response.resetToken">
              <h4>Manual Reset Instructions</h4>
              <p>Since email delivery failed, please use this reset link:</p>
              
              <div class="reset-link-container">
                <input #resetLinkInput 
                       [value]="response.resetLink!" 
                       readonly 
                       class="reset-link-input" />
                <button nz-button 
                        nzType="default" 
                        (click)="copyToClipboard(resetLinkInput.value)"
                        nz-tooltip="Copy to clipboard">
                  Copy
                </button>
              </div>

              <div class="token-info">
                <p><strong>User:</strong> {{response.username}} ({{response.userEmail}})</p>
                <p><strong>Expires:</strong> {{response.expiresAt | date:'medium'}}</p>
              </div>

              <div class="error-details" *ngIf="response.errorDetails">
                <details>
                  <summary>Technical Details</summary>
                  <pre>{{response.errorDetails}}</pre>
                </details>
              </div>
            </div>
          </div>

          <div *ngIf="!response.success" class="error-message">
            <nz-alert 
              nzType="error" 
              nzMessage="Reset Failed"
              [nzDescription]="response.message"
              nzShowIcon>
            </nz-alert>
          </div>

          <div class="actions">
            <button nz-button nzType="default" (click)="resetForm()">
              Try Again
            </button>
            <a nz-button nzType="primary" routerLink="/login">
              Back to Login
            </a>
          </div>
        </div>

      </nz-card>
    </div>
  `,
  styles: [`
    .reset-request-container {
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

    .back-to-login {
      text-align: center;
      margin-top: 16px;
    }

    .back-to-login a {
      color: #1890ff;
      text-decoration: none;
    }

    .back-to-login a:hover {
      text-decoration: underline;
    }

    .success-message, .manual-token, .error-message {
      text-align: center;
    }

    .next-steps {
      margin-top: 16px;
      color: #666;
      font-size: 14px;
    }

    .token-details {
      margin-top: 16px;
      text-align: left;
    }

    .token-details h4 {
      color: #fa8c16;
      margin-bottom: 12px;
    }

    .reset-link-container {
      display: flex;
      gap: 8px;
      margin: 12px 0;
    }

    .reset-link-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      background: #f5f5f5;
    }

    .token-info {
      background: #f0f0f0;
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
      font-size: 13px;
    }

    .error-details {
      margin-top: 12px;
    }

    .error-details pre {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      font-size: 11px;
      max-height: 100px;
      overflow-y: auto;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }
  `]
})
export class PasswordResetRequestComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  submitted = false;
  response: PasswordResetResponseDTO | null = null;

  ngOnInit(): void {
    // Focus email input
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
    }, 100);
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
    const request: PasswordResetRequestDTO = {
      email: this.form.value.email!
    };

    this.userService.requestPasswordReset(request).subscribe({
      next: (response) => {
        this.response = response;
        this.submitted = true;
        this.loading = false;
      },
      error: (error) => {
        console.error('Password reset request failed:', error);
        this.message.error('Failed to process password reset request. Please try again.');
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.response = null;
    this.form.reset();
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.message.success('Reset link copied to clipboard');
      }).catch(() => {
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.message.success('Reset link copied to clipboard');
    } catch (err) {
      this.message.error('Failed to copy to clipboard');
    }
    document.body.removeChild(textArea);
  }
}
