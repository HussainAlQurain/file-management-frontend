import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AsyncBtnComponent } from '../../shared/components/async-btn/async-btn.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AsyncBtnComponent
  ],
  template: `
    <div class="login-page min-h-screen flex items-center justify-center p-4">
      <mat-card class="max-w-md w-full">
        <mat-card-header class="flex justify-center mb-4">
          <mat-card-title class="text-2xl">Login</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="flex flex-col gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Username</mat-label>
                <input 
                  matInput 
                  formControlName="username" 
                  type="text" 
                  autocomplete="username"
                  required>
                <mat-icon matSuffix>person</mat-icon>
                @if (hasError('username', 'required')) {
                  <mat-error>Username is required</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  formControlName="password" 
                  [type]="showPassword ? 'text' : 'password'" 
                  autocomplete="current-password"
                  required>
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button" 
                  (click)="togglePasswordVisibility()">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (hasError('password', 'required')) {
                  <mat-error>Password is required</mat-error>
                }
              </mat-form-field>
              
              <div class="flex justify-center mt-4">
                <app-async-btn 
                  type="submit" 
                  color="primary" 
                  [isLoading]="isLoading" 
                  [disabled]="loginForm.invalid">
                  Login
                </app-async-btn>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      background-color: #f5f5f5;
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
  
  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.hasError(errorName) && control.touched);
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
