import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

import { UserService, CreateUserDTO } from '../../../core/services/user.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User, UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-user-create-page',
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
            <a routerLink="../">Users</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Create User</nz-breadcrumb-item>
        </nz-breadcrumb>
        
        <nz-page-header-title>Create New User</nz-page-header-title>
        <nz-page-header-subtitle>Add a new user to the system</nz-page-header-subtitle>
        
        <nz-page-header-extra>
          <button nz-button nzType="default" routerLink="../">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Users
          </button>
        </nz-page-header-extra>
      </nz-page-header>

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
            
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Full Name</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="fullName" placeholder="Enter full name (optional)">
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Password</nz-form-label>
                <nz-form-control [nzErrorTip]="passwordErrorTpl">
                  <input nz-input type="password" formControlName="password" placeholder="Enter password">
                  <ng-template #passwordErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>Password is required</span>
                    } @else if (control.hasError('minlength')) {
                      <span>Password must be at least 6 characters long</span>
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
            <button nz-button nzType="default" routerLink="../">
              <nz-icon nzType="close"></nz-icon>
              Cancel
            </button>
            <button 
              nz-button 
              nzType="primary" 
              [nzLoading]="isSubmitting()"
              [disabled]="userForm.invalid"
              type="submit">
              <nz-icon nzType="user-add"></nz-icon>
              Create User
            </button>
          </div>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    nz-page-header {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
  `]
})
export class UserCreatePageComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  isSubmitting = signal(false);
  userRoles = ['USER', 'SYS_ADMIN'];

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
    const formValue = this.userForm.value;
    const userData: CreateUserDTO = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      roleCodes: formValue.roles,
      fullName: formValue.fullName
    };

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
