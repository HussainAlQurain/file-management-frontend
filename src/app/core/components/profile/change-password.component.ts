import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserService, ChangePasswordDTO } from '../../services/user.service';
import { SnackbarService } from '../../services/snackbar.service';
import { AsyncBtnComponent } from '../../../shared/components/async-btn/async-btn.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AsyncBtnComponent
  ],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Change Password</h2>
      <mat-card class="max-w-md">
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <div class="flex flex-col gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Old Password</mat-label>
                <input matInput formControlName="oldPassword" [type]="showOldPassword ? 'text' : 'password'" required>
                <button mat-icon-button matSuffix type="button" (click)="showOldPassword = !showOldPassword">
                  <mat-icon>{{ showOldPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (passwordForm.get('oldPassword')?.hasError('required') && passwordForm.get('oldPassword')?.touched) {
                  <mat-error>Old password is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>New Password</mat-label>
                <input matInput formControlName="newPassword" [type]="showNewPassword ? 'text' : 'password'" required>
                <button mat-icon-button matSuffix type="button" (click)="showNewPassword = !showNewPassword">
                  <mat-icon>{{ showNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
                  <mat-error>New password is required</mat-error>
                }
                 @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>

              <div class="flex justify-end">
                <app-async-btn 
                  type="submit" 
                  color="primary" 
                  [isLoading]="isLoading()" 
                  [disabled]="passwordForm.invalid">
                  Change Password
                </app-async-btn>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
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
