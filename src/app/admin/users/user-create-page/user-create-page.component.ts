import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../../core/services/user.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User, UserRole } from '../../../core/models/auth.model';
import { AsyncBtnComponent } from '../../../shared/components/async-btn/async-btn.component';

@Component({
  selector: 'app-user-create-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    AsyncBtnComponent
  ],
  template: `
    <div class="p-4">
      <div class="flex items-center mb-6">
        <button mat-icon-button routerLink="../" matTooltip="Back to User List">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-3xl font-bold ml-2">Create New User</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" required>
                <mat-error *ngIf="userForm.get('username')?.hasError('required')">Username is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                <mat-error *ngIf="userForm.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="userForm.get('email')?.hasError('email')">Please enter a valid email address</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Full Name (Optional)</mat-label>
                <input matInput formControlName="fullName">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" required>
                <mat-error *ngIf="userForm.get('password')?.hasError('required')">Password is required</mat-error>
                <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">Password must be at least 6 characters long</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="md:col-span-2">
                <mat-label>Roles</mat-label>
                <mat-select formControlName="roles" multiple required>
                  <mat-option *ngFor="let role of userRoles" [value]="role">{{role}}</mat-option>
                </mat-select>
                <mat-error *ngIf="userForm.get('roles')?.hasError('required')">At least one role is required</mat-error>
              </mat-form-field>
            </div>

            <div class="mt-8 flex justify-end space-x-3">
              <button mat-stroked-button routerLink="../">Cancel</button>
              <app-async-btn 
                type="submit"
                [isLoading]="isSubmitting()"
                [disabled]="userForm.invalid">
                Create User
              </app-async-btn>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class UserCreatePageComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  isSubmitting = signal(false);
  userRoles = Object.values(UserRole);

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
    const userData: Partial<User> = this.userForm.value;

    this.userService.create(userData).subscribe({
      next: (newUser) => {
        this.isSubmitting.set(false);
        this.snackbar.success(`User ${newUser.username} created successfully!`);
        this.router.navigate(['/users']); // Navigate to user list, or to newUser.id for edit page
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create user: ' + (err.error?.message || err.message));
      }
    });
  }
}
