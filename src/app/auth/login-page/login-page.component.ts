import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

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
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  template: `
    <div class="login-page min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <nz-card class="max-w-md w-full shadow-xl" nzTitle="Login" [nzBordered]="false">
        <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <nz-form-item>
            <nz-form-label [nzRequired]="true">Username</nz-form-label>
            <nz-form-control [nzErrorTip]="usernameErrorTpl">
              <nz-input-group nzPrefixIcon="user">
                <input 
                  nz-input 
                  formControlName="username" 
                  type="text" 
                  autocomplete="username"
                  placeholder="Enter your username">
              </nz-input-group>
              <ng-template #usernameErrorTpl let-control>
                @if (control.hasError('required')) {
                  <span>Username is required</span>
                }
              </ng-template>
            </nz-form-control>
          </nz-form-item>
          
          <nz-form-item>
            <nz-form-label [nzRequired]="true">Password</nz-form-label>
            <nz-form-control [nzErrorTip]="passwordErrorTpl">
              <nz-input-group nzPrefixIcon="lock" [nzSuffix]="suffixTemplate">
                <input 
                  nz-input 
                  formControlName="password" 
                  [type]="showPassword ? 'text' : 'password'" 
                  autocomplete="current-password"
                  placeholder="Enter your password">
              </nz-input-group>
              <ng-template #suffixTemplate>
                <nz-icon 
                  class="cursor-pointer text-gray-400 hover:text-gray-600" 
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
          
          <nz-form-item class="!mb-0">
            <nz-form-control>
              <button 
                nz-button 
                nzType="primary" 
                nzSize="large"
                type="submit" 
                [nzLoading]="isLoading"
                [disabled]="loginForm.invalid"
                class="w-full">
                <nz-icon nzType="login" nzTheme="outline"></nz-icon>
                Login
              </button>
            </nz-form-control>
          </nz-form-item>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    .login-page {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    nz-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }
  `]
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  
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
        this.snackbar.error(error.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
