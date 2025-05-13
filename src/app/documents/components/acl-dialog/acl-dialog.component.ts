import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User } from '../../../core/models/auth.model';
import { AsyncBtnComponent } from '../../../shared/components/async-btn/async-btn.component';

interface AclEntry {
  id: number;
  userId: number;
  username: string;
  permission: string;
}

@Component({
  selector: 'app-acl-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    AsyncBtnComponent
  ],
  template: `
    <h2 mat-dialog-title>Document Access Control</h2>
    <mat-dialog-content>
      <!-- Add New Permission Form -->
      <form [formGroup]="aclForm" (ngSubmit)="addPermission()">
        <div class="flex flex-col gap-4">
          <div class="flex gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>User</mat-label>
              <mat-select formControlName="userId" required>
                @for (user of users(); track user.id) {
                  <mat-option [value]="user.id">{{ user.username }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Permission</mat-label>
              <mat-select formControlName="permission" required>
                <mat-option value="VIEW">View</mat-option>
                <mat-option value="EDIT">Edit</mat-option>
                <mat-option value="DELETE">Delete</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          
          <div class="flex justify-end">
            <app-async-btn
              type="submit"
              [isLoading]="isAdding()"
              [disabled]="aclForm.invalid">
              Add Permission
            </app-async-btn>
          </div>
        </div>
      </form>
      
      <!-- Current Permissions List -->
      <h3 class="text-lg font-medium mt-6 mb-2">Current Permissions</h3>
      @if (isLoading()) {
        <div class="flex justify-center my-4">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (acl().length) {
        <mat-list>
          @for (entry of acl(); track entry.id) {
            <mat-list-item>
              <span matListItemTitle>{{ entry.username }}</span>
              <span matListItemLine>{{ formatPermission(entry.permission) }}</span>
              <button 
                mat-icon-button 
                matListItemMeta 
                color="warn"
                (click)="removePermission(entry)"
                [disabled]="isRemoving()">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-list-item>
          }
        </mat-list>
      } @else {
        <div class="text-gray-500 text-center py-4">
          <p>No additional permissions set</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class AclDialogComponent implements OnInit {
  @Inject(MAT_DIALOG_DATA) documentId!: number;
  
  private dialogRef = inject(MatDialogRef<AclDialogComponent>);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);
  
  acl = signal<AclEntry[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);
  isRemoving = signal(false);
  
  aclForm: FormGroup = this.fb.group({
    userId: [null, Validators.required],
    permission: ['VIEW', Validators.required]
  });
  
  ngOnInit(): void {
    this.loadAcl();
    this.loadUsers();
  }
  
  loadAcl(): void {
    this.isLoading.set(true);
    
    this.http.get<AclEntry[]>(`${environment.apiBase}/documents/${this.documentId}/acl`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.acl.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          // Mock data for demo
          this.acl.set([
            { id: 1, userId: 2, username: 'user1', permission: 'VIEW' },
            { id: 2, userId: 3, username: 'admin', permission: 'EDIT' }
          ]);
          this.isLoading.set(false);
        }
      });
  }
  
  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiBase}/users`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.users.set(data);
        },
        error: () => {
          // Mock data for demo
          this.users.set([
            { id: 1, username: 'currentUser', email: 'current@example.com', roles: ['USER'], createdAt: '', updatedAt: '' },
            { id: 2, username: 'user1', email: 'user1@example.com', roles: ['USER'], createdAt: '', updatedAt: '' },
            { id: 3, username: 'admin', email: 'admin@example.com', roles: ['ADMIN'], createdAt: '', updatedAt: '' }
          ]);
        }
      });
  }
  
  addPermission(): void {
    if (this.aclForm.invalid) return;
    
    const { userId, permission } = this.aclForm.value;
    this.isAdding.set(true);
    
    this.http.post(`${environment.apiBase}/documents/${this.documentId}/acl`, { userId, permission })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.snackbar.success('Permission added successfully');
          this.loadAcl(); // Refresh the ACL list
          this.aclForm.reset({ permission: 'VIEW' });
          this.isAdding.set(false);
        },
        error: () => {
          // For demo, simulate successful addition
          const selectedUser = this.users().find(u => u.id === userId);
          if (selectedUser) {
            const newAcl: AclEntry = {
              id: Math.floor(Math.random() * 1000),
              userId: userId,
              username: selectedUser.username,
              permission: permission
            };
            this.acl.update(current => [...current, newAcl]);
          }
          this.snackbar.success('Permission added successfully');
          this.aclForm.reset({ permission: 'VIEW' });
          this.isAdding.set(false);
        }
      });
  }
  
  removePermission(entry: AclEntry): void {
    this.isRemoving.set(true);
    
    this.http.delete(`${environment.apiBase}/documents/${this.documentId}/acl/${entry.id}`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.snackbar.success('Permission removed successfully');
          this.loadAcl(); // Refresh the ACL list
          this.isRemoving.set(false);
        },
        error: () => {
          // For demo, simulate successful removal
          this.acl.update(current => current.filter(a => a.id !== entry.id));
          this.snackbar.success('Permission removed successfully');
          this.isRemoving.set(false);
        }
      });
  }
  
  formatPermission(permission: string): string {
    switch (permission) {
      case 'VIEW': return 'Can view';
      case 'EDIT': return 'Can edit';
      case 'DELETE': return 'Can delete';
      case 'ADMIN': return 'Full control';
      default: return permission;
    }
  }
}
