import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs/operators';

import { UserService } from '../../../core/services/user.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User, UserRole } from '../../../core/models/auth.model';
import { UpdateUserDTO } from '../../../core/services/user.service';
import { AsyncBtnComponent } from '../../../shared/components/async-btn/async-btn.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-edit-page',
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
        <button mat-icon-button routerLink="../../" matTooltip="Back to User List">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-3xl font-bold ml-2">Edit User: {{ userForm.get('username')?.value || '' }}</h2>
      </div>

      @if (isLoadingUser()) {
        <div class="flex justify-center items-center py-10">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else if (!userForm.value.id && !isLoadingUser()) {
        <mat-card class="text-center p-6">
          <mat-icon class="text-6xl text-gray-400 mb-4">error_outline</mat-icon>
          <h3 class="text-xl text-gray-600">User not found.</h3>
          <p class="mt-2">The user you are trying to edit does not exist or could not be loaded.</p>
          <button mat-stroked-button routerLink="../../" class="mt-4">Back to User List</button>
        </mat-card>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" required>
                  @if (userForm.get('username')?.hasError('required')) {
                    <mat-error>Username is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" required>
                  @if (userForm.get('email')?.hasError('required')) {
                    <mat-error>Email is required</mat-error>
                  }
                  @if (userForm.get('email')?.hasError('email')) {
                    <mat-error>Please enter a valid email address</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="md:col-span-2">
                  <mat-label>Roles</mat-label>
                  <mat-select formControlName="roles" multiple required>
                    @for (role of userRoles; track role) {
                      <mat-option [value]="role">{{role}}</mat-option>
                    }
                  </mat-select>
                  @if (userForm.get('roles')?.hasError('required')) {
                    <mat-error>At least one role is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="mt-8 flex justify-end space-x-3">
                <button mat-stroked-button routerLink="../../">Cancel</button>
                <app-async-btn 
                  type="submit"
                  [isLoading]="isSubmitting()"
                  [disabled]="userForm.invalid || !userForm.dirty">
                  Save Changes
                </app-async-btn>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `
})
export class UserEditPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

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
        this.snackbar.info('No changes detected.');
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
        this.snackbar.success(`User ${updatedUser.username} updated successfully!`);
        this.userForm.markAsPristine(); // Reset dirty state after successful save

        // If the updated user is the current user and the username changed, force logout
        const currentUser = this.authService.currentUserSignal();
        if (currentUser && currentUser.id === updatedUser.id && currentUser.username !== updatedUser.username) {
          this.snackbar.info('Your username has changed. Please log in again.');
          setTimeout(() => this.authService.logout(), 1500);
        }
        // Optionally navigate away or refresh data if needed
        // this.router.navigate(['/users']); 
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Handle duplicate username/email error from backend
        const msg = err?.error?.message || err?.message || '';
        if (msg.includes('Username already exists')) {
          this.snackbar.error('This username is already taken. Please choose another.');
        } else if (msg.includes('Email already exists')) {
          this.snackbar.error('This email is already in use. Please use a different email.');
        } else {
          this.snackbar.error('Failed to update user: ' + msg);
        }
      }
    });
  }
}
