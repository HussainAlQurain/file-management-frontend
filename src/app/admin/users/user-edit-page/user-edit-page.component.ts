import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

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
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSpinModule,
    NzResultModule,
    NzGridModule,
    NzPageHeaderModule,
    NzBreadCrumbModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <nz-page-header class="mb-6" [nzGhost]="false">
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a routerLink="../../">Users</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Edit User</nz-breadcrumb-item>
        </nz-breadcrumb>
        
        <nz-page-header-title>Edit User</nz-page-header-title>
        <nz-page-header-subtitle>{{ userForm.get('username')?.value || 'Loading...' }}</nz-page-header-subtitle>
        
        <nz-page-header-extra>
          <button nz-button nzType="default" routerLink="../../">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Users
          </button>
        </nz-page-header-extra>
      </nz-page-header>

      @if (isLoadingUser()) {
        <div class="flex justify-center items-center py-20">
          <nz-spin nzSize="large" nzTip="Loading user..."></nz-spin>
        </div>
      } @else if (!userForm.value.id && !isLoadingUser()) {
        <nz-result 
          nzStatus="404" 
          nzTitle="User Not Found" 
          nzSubTitle="The user you are trying to edit does not exist or could not be loaded.">
          <div nz-result-extra>
            <button nz-button nzType="primary" routerLink="../../">
              <nz-icon nzType="arrow-left"></nz-icon>
              Back to Users
            </button>
          </div>
        </nz-result>
      } @else {
        <!-- User Form -->
        <nz-card nzTitle="User Information">
          <form nz-form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Username</nz-form-label>
                  <nz-form-control [nzErrorTip]="usernameErrorTpl">
                    <input nz-input formControlName="username" placeholder="Enter username">
                    <ng-template #usernameErrorTpl let-control>
                      @if (control.hasError('required')) {
                        <span>Username is required</span>
                      } @else if (control.hasError('minlength')) {
                        <span>Username must be at least 3 characters long</span>
                      }
                    </ng-template>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Email</nz-form-label>
                  <nz-form-control [nzErrorTip]="emailErrorTpl">
                    <input nz-input type="email" formControlName="email" placeholder="Enter email address">
                    <ng-template #emailErrorTpl let-control>
                      @if (control.hasError('required')) {
                        <span>Email is required</span>
                      } @else if (control.hasError('email')) {
                        <span>Please enter a valid email address</span>
                      }
                    </ng-template>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="24">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Roles</nz-form-label>
                  <nz-form-control [nzErrorTip]="'At least one role is required'">
                    <nz-select 
                      formControlName="roles" 
                      nzMode="multiple" 
                      nzPlaceHolder="Select user roles">
                      @for (role of userRoles; track role) {
                        <nz-option [nzValue]="role" [nzLabel]="role">
                          <nz-icon [nzType]="getRoleIcon(role)" class="mr-2"></nz-icon>
                          {{ role }}
                        </nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-6 border-t">
              <button nz-button nzType="default" routerLink="../../">
                <nz-icon nzType="close"></nz-icon>
                Cancel
              </button>
              <button 
                nz-button 
                nzType="primary" 
                [nzLoading]="isSubmitting()"
                [disabled]="userForm.invalid || !userForm.dirty"
                type="submit">
                <nz-icon nzType="save"></nz-icon>
                Save Changes
              </button>
            </div>
          </form>
        </nz-card>
      }
    </div>
  `,
  styles: [`
    nz-page-header {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
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
