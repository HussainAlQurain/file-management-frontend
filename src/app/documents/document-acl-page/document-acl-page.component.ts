import { Component, OnInit, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { AclService, AclEntryResponse } from '../../core/services/acl.service'; // Import AclEntryResponse
import { DocumentService } from '../../core/services/document.service';
import { UserService } from '../../core/services/user.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AclRecordDto, Permission, PrincipalType } from '../../core/models/acl.model';
import { Document } from '../../core/models/document.model';
import { User } from '../../core/models/auth.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-document-acl-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoadingDocument()) {
        <div class="flex justify-center items-center min-h-[200px]">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else if (document()) {
        <header class="mb-6">
          <h1 class="text-2xl font-bold">Manage Access for: {{ document()?.title }}</h1>
          <button mat-stroked-button [routerLink]="['/documents', document()?.id]">
            <mat-icon>arrow_back</mat-icon>
            Back to Document
          </button>
        </header>

        <!-- Add/Edit ACL Form -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Grant New Permission</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="aclForm" (ngSubmit)="grantPermission()" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <mat-form-field appearance="outline" class="md:col-span-1">
                <mat-label>Principal Type</mat-label>
                <mat-select formControlName="principalType" required>
                  @for (type of principalTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
                @if (aclForm.get('principalType')?.hasError('required')) {
                  <mat-error>Principal type is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="md:col-span-1">
                <mat-label>User</mat-label>
                <input matInput placeholder="Search user..." [(ngModel)]="userFilter" (ngModelChange)="filterUsers()" name="userFilter" autocomplete="off" />
                <mat-select formControlName="principalId" required>
                  @if(isLoadingUsers()) { <mat-option disabled>Loading users...</mat-option> }
                  @for (user of filteredUsers(); track user.id) {
                    <mat-option [value]="user.id">
                      <div class="flex flex-col">
                        <span>{{ user.fullName || user.username }}</span>
                        <span class="text-xs text-gray-500">{{ user.email }}</span>
                      </div>
                    </mat-option>
                  }
                </mat-select>
                 @if (aclForm.get('principalId')?.hasError('required')) {
                  <mat-error>User is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="md:col-span-1">
                <mat-label>Permission</mat-label>
                <mat-select formControlName="permission" required>
                   @for (perm of permissions; track perm.value) {
                    <mat-option [value]="perm.value">{{ perm.label }}</mat-option>
                  }
                </mat-select>
                @if (aclForm.get('permission')?.hasError('required')) {
                  <mat-error>Permission is required.</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="aclForm.invalid || isGrantingPermission()" class="md:col-span-1 h-[56px]">
                @if(isGrantingPermission()){ <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner> } 
                Grant Permission
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Current ACLs Table -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Current Permissions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (isLoadingAcls()) {
              <div class="flex justify-center items-center py-6">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (currentAcls().length > 0) {
              <table mat-table [dataSource]="currentAcls()" class="w-full">
                <!-- Principal Column -->
                <ng-container matColumnDef="principal">
                  <th mat-header-cell *matHeaderCellDef> Principal </th>
                  <td mat-cell *matCellDef="let acl"> {{ acl.principalName || acl.principalId }} ({{ acl.principalType }}) </td>
                </ng-container>

                <!-- Permission Column -->
                <ng-container matColumnDef="permission">
                  <th mat-header-cell *matHeaderCellDef> Permission </th>
                  <td mat-cell *matCellDef="let acl"> {{ acl.permission }} </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="text-right"> Actions </th>
                  <td mat-cell *matCellDef="let acl" class="text-right">
                    <button mat-icon-button color="warn" (click)="revokePermissionConfirmation(acl)" matTooltip="Revoke Permission">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            } @else {
              <p class="text-center text-gray-500 py-6">No permissions granted yet for this document.</p>
            }
          </mat-card-content>
        </mat-card>

      } @else {
        <mat-card class="text-center p-8">
          <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
          <h2 class="text-2xl font-semibold mt-4 mb-2">Document Not Found</h2>
          <p class="text-gray-600 mb-6">The document details could not be loaded.</p>
          <button mat-stroked-button routerLink="/documents">
            <mat-icon>arrow_back</mat-icon> Back to Documents List
          </button>
        </mat-card>
      }
    </div>
  `,
  styles: [``]
})
export class DocumentAclPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private aclService = inject(AclService);
  private documentService = inject(DocumentService);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  documentId = signal<number | null>(null);
  document: WritableSignal<Document | null> = signal(null);
  currentAcls: WritableSignal<AclEntryResponse[]> = signal([]); // Use AclEntryResponse from service
  users: WritableSignal<User[]> = signal([]);
  userFilter: string = '';
  filteredUsers: WritableSignal<User[]> = signal([]);

  isLoadingDocument = signal(true);
  isLoadingAcls = signal(false);
  isLoadingUsers = signal(false);
  isGrantingPermission = signal(false);

  aclForm!: FormGroup;
  displayedColumns: string[] = ['principal', 'permission', 'actions'];

  principalTypes = [
    { value: PrincipalType.USER, label: 'User' },
  ];

  permissions = [
    { value: 'EDIT', label: 'Edit' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'VIEW', label: 'View' }
  ];

  constructor() {
    this.aclForm = this.fb.group({
      principalType: [PrincipalType.USER, Validators.required],
      principalId: [null as number | null, Validators.required],
      permission: [null as Permission | null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocumentDetails(+id);
        this.loadCurrentAcls(+id);
        this.loadUsers();
      } else {
        this.isLoadingDocument.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  loadDocumentDetails(id: number): void {
    this.isLoadingDocument.set(true);
    this.documentService.get(id).subscribe({
      next: (doc: Document) => {
        this.document.set(doc);
        this.isLoadingDocument.set(false);
      },
      error: (err: any) => {
        this.isLoadingDocument.set(false);
        this.snackbar.error('Failed to load document details: ' + (err.error?.message || err.message));
        this.router.navigate(['/documents']);
      }
    });
  }

  loadCurrentAcls(docId: number): void {
    this.isLoadingAcls.set(true);
    this.aclService.getAcls(docId).subscribe({
      next: (acls: AclEntryResponse[]) => {
        this.currentAcls.set(acls);
        this.isLoadingAcls.set(false);
      },
      error: (err: any) => {
        this.isLoadingAcls.set(false);
        this.snackbar.error('Failed to load ACLs: ' + (err.error?.message || err.message));
      }
    });
  }

  loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.userService.list({ page: 0, size: 1000, sort: 'username,asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (userPage) => {
          this.users.set(userPage.content);
          this.filteredUsers.set(userPage.content);
          this.isLoadingUsers.set(false);
        },
        error: (err: any) => {
          this.isLoadingUsers.set(false);
          this.snackbar.error('Failed to load users: ' + (err.error?.message || err.message));
        }
      });
  }

  filterUsers(): void {
    const filter = this.userFilter.toLowerCase();
    this.filteredUsers.set(
      this.users().filter(u =>
        (u.fullName && u.fullName.toLowerCase().includes(filter)) ||
        (u.username && u.username.toLowerCase().includes(filter)) ||
        (u.email && u.email.toLowerCase().includes(filter))
      )
    );
  }

  grantPermission(): void {
    if (this.aclForm.invalid || !this.documentId()) return;

    this.isGrantingPermission.set(true);
    const aclData = this.aclForm.value as { principalId: number, permission: Permission, principalType: PrincipalType };
    const docId = this.documentId()!;

    // Assuming principalType is USER for now, so principalId is userId
    this.aclService.grant(docId, aclData.principalId, aclData.permission).subscribe({
      next: () => {
        this.snackbar.success('Permission granted successfully.');
        this.loadCurrentAcls(docId); 
        this.aclForm.reset({ principalType: PrincipalType.USER, principalId: null, permission: null });
        this.isGrantingPermission.set(false);
      },
      error: (err: any) => {
        this.isGrantingPermission.set(false);
        this.snackbar.error('Failed to grant permission: ' + (err.error?.message || err.message));
      }
    });
  }

  revokePermissionConfirmation(acl: AclEntryResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Revoke',
        message: `Are you sure you want to revoke ${acl.permission} permission for ${acl.principalName || acl.principalId} (${acl.principalType})?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { 
        this.revokePermission(acl);
      }
    });
  }

  revokePermission(aclToRevoke: AclEntryResponse): void {
    const docId = this.documentId();
    if (!docId) {
      this.snackbar.error('Document ID is missing.');
      return;
    }
    
    // Assuming principalType is USER, so principalId is userId
    this.aclService.revoke(docId, aclToRevoke.principalId, aclToRevoke.permission).subscribe({ 
      next: () => {
        this.snackbar.success('Permission revoked successfully.');
        this.loadCurrentAcls(docId);
      },
      error: (err: any) => {
        this.snackbar.error('Failed to revoke permission: ' + (err.error?.message || err.message));
      }
    });
  }
}
