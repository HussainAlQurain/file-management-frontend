import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  template: `
    <div class="login-container">
      <div class="login-background">
        <div class="background-overlay"></div>
      </div>
      
      <div class="login-content">
        <div class="login-card">
          <!-- Header Section -->
          <div class="login-header">
            <div class="logo-section">
              <div class="logo-icon">
                <nz-icon nzType="file-text" nzTheme="outline"></nz-icon>
              </div>
              <h1 class="app-title">AHAB Document Management</h1>
            </div>
            <p class="welcome-text">Welcome back! Please sign in to your account.</p>
          </div>

          <!-- Form Section -->
          <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <nz-form-item class="form-item">
              <nz-form-control [nzErrorTip]="usernameErrorTpl">
                <nz-input-group nzPrefixIcon="user" nzSize="large">
                  <input 
                    nz-input 
                    formControlName="username" 
                    type="text" 
                    autocomplete="username"
                    placeholder="Enter your username"
                    class="form-input">
                </nz-input-group>
                <ng-template #usernameErrorTpl let-control>
                  @if (control.hasError('required')) {
                    <span>Username is required</span>
                  }
                </ng-template>
              </nz-form-control>
            </nz-form-item>
            
            <nz-form-item class="form-item">
              <nz-form-control [nzErrorTip]="passwordErrorTpl">
                <nz-input-group nzPrefixIcon="lock" [nzSuffix]="suffixTemplate" nzSize="large">
                  <input 
                    nz-input 
                    formControlName="password" 
                    [type]="showPassword ? 'text' : 'password'" 
                    autocomplete="current-password"
                    placeholder="Enter your password"
                    class="form-input">
                </nz-input-group>
                <ng-template #suffixTemplate>
                  <nz-icon 
                    class="password-toggle" 
                    [nzType]="showPassword ? 'eye-invisible' : 'eye'" 
                    (click)="togglePasswordVisibility()">
                  </nz-icon>
                </ng-template>
                <ng-template #passwordErrorTpl let-control>
                  @if (control.hasError('required')) {
                    <span>Password is required</span>
                  }
                </ng-template>
              </nz-form-control>
            </nz-form-item>
            
            <nz-form-item class="form-item login-button-item">
              <nz-form-control>
                <button 
                  nz-button 
                  nzType="primary" 
                  nzSize="large"
                  type="submit" 
                  [nzLoading]="isLoading"
                  [disabled]="loginForm.invalid"
                  class="login-button">
                  <span *ngIf="!isLoading">
                    <nz-icon nzType="login" nzTheme="outline"></nz-icon>
                    Sign In
                  </span>
                </button>
              </nz-form-control>
            </nz-form-item>
          </form>
          
          <!-- Footer Section -->
          <div class="login-footer">
            <a routerLink="/password-reset" class="forgot-password">
              <nz-icon nzType="question-circle" nzTheme="outline"></nz-icon>
              Forgot your password?
            </a>
          </div>
        </div>
        
        <!-- Side Info Panel -->
        <div class="info-panel">
          <div class="info-content">
            <h2>Secure Document Management</h2>
            <ul class="feature-list">
              <li>
                <nz-icon nzType="safety-certificate" nzTheme="outline"></nz-icon>
                <span>Enterprise-grade security</span>
              </li>
              <li>
                <nz-icon nzType="cloud-upload" nzTheme="outline"></nz-icon>
                <span>Easy file upload & management</span>
              </li>
              <li>
                <nz-icon nzType="team" nzTheme="outline"></nz-icon>
                <span>Collaborative workflows</span>
              </li>
              <li>
                <nz-icon nzType="audit" nzTheme="outline"></nz-icon>
                <span>Complete audit trails</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      position: relative;
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 1;
    }

    .background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>');
      opacity: 0.3;
    }

    .login-content {
      position: relative;
      z-index: 2;
      display: flex;
      width: 100%;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 20px;
      gap: 40px;
    }

    .login-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 48px 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 420px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-section {
      margin-bottom: 16px;
    }

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    }

    .logo-icon nz-icon {
      font-size: 28px;
      color: white;
    }

    .app-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .welcome-text {
      color: #666;
      font-size: 15px;
      margin: 0;
      line-height: 1.5;
    }

    .login-form {
      margin-bottom: 32px;
    }

    .form-item {
      margin-bottom: 24px;
    }

    .login-button-item {
      margin-bottom: 0;
      margin-top: 32px;
    }

    .form-input {
      border-radius: 12px;
      border: 2px solid #e8e8e8;
      padding: 12px 16px;
      transition: all 0.3s ease;
      font-size: 15px;
    }

    .form-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .password-toggle {
      color: #999;
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 4px;
    }

    .password-toggle:hover {
      color: #667eea;
    }

    .login-button {
      width: 100%;
      height: 50px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .login-button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
    }

    .login-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .login-button nz-icon {
      margin-right: 8px;
    }

    .login-footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
    }

    .forgot-password {
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .forgot-password:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #5a67d8;
    }

    .info-panel {
      flex: 1;
      max-width: 500px;
      color: white;
      padding: 40px;
      display: flex;
      align-items: center;
    }

    .info-content h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 32px;
      color: white;
      line-height: 1.2;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feature-list li {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    .feature-list li nz-icon {
      font-size: 20px;
      margin-right: 16px;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.1);
      padding: 8px;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .info-panel {
        display: none;
      }
      
      .login-content {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .login-content {
        padding: 16px;
      }
      
      .login-card {
        padding: 32px 24px;
        border-radius: 16px;
      }
      
      .app-title {
        font-size: 20px;
      }
      
      .info-content h2 {
        font-size: 24px;
      }
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 24px 20px;
        margin: 8px;
      }
      
      .app-title {
        font-size: 18px;
      }
      
      .logo-icon {
        width: 50px;
        height: 50px;
      }
      
      .logo-icon nz-icon {
        font-size: 24px;
      }
    }

    /* Form validation styles */
    ::ng-deep .ant-form-item-has-error .form-input {
      border-color: #ff4d4f;
    }

    ::ng-deep .ant-form-item-has-error .form-input:focus {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
    }

    /* Loading animation */
    ::ng-deep .ant-btn-loading-icon {
      margin-right: 8px;
    }

    /* Input group styling */
    ::ng-deep .ant-input-group-addon {
      background: rgba(102, 126, 234, 0.1);
      border-color: #e8e8e8;
      border-radius: 12px 0 0 12px;
    }

    ::ng-deep .ant-input-group > .ant-input:first-child {
      border-radius: 0 12px 12px 0;
    }

    ::ng-deep .ant-input-group .ant-input-prefix {
      color: #667eea;
    }
  `]
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  private translateService = inject(TranslateService);
  
  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });
  
  isLoading = false;
  showPassword = false;
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    const credentials = this.loginForm.value;
    
    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect to the return URL or to the dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = this.translateService.instant('auth.login.error');
        this.snackbar.error(error.error?.message || errorMsg);
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
