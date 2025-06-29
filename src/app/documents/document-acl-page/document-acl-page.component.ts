import { Component, OnInit, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { AclService, AclEntryResponse } from '../../core/services/acl.service'; // Import AclEntryResponse
import { DocumentService } from '../../core/services/document.service';
import { UserService } from '../../core/services/user.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AclRecordDto, Permission, PrincipalType } from '../../core/models/acl.model';
import { Document } from '../../core/models/document.model';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-document-acl-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzEmptyModule,
    NzBreadCrumbModule,
    NzPageHeaderModule,
    NzGridModule
  ],
  template: `
    <div class="p-6">
      @if (isLoadingDocument()) {
        <div class="flex justify-center items-center min-h-[200px]">
          <nz-spin nzSize="large"></nz-spin>
        </div>
      } @else if (document()) {
        <!-- Page Header -->
        <nz-page-header class="mb-6" [nzGhost]="false">
          <nz-breadcrumb nz-page-header-breadcrumb>
            <nz-breadcrumb-item>
              <a routerLink="/documents">Documents</a>
            </nz-breadcrumb-item>
            <nz-breadcrumb-item>
              <a [routerLink]="['/documents', document()?.id]">{{ document()?.title }}</a>
            </nz-breadcrumb-item>
            <nz-breadcrumb-item>Access Control</nz-breadcrumb-item>
          </nz-breadcrumb>
          
          <nz-page-header-title>Manage Access Control</nz-page-header-title>
          <nz-page-header-subtitle>{{ document()?.title }}</nz-page-header-subtitle>
          
          <nz-page-header-extra>
            <button nz-button nzType="default" [routerLink]="['/documents', document()?.id]">
              <nz-icon nzType="arrow-left"></nz-icon>
              Back to Document
            </button>
          </nz-page-header-extra>
        </nz-page-header>

        <!-- Grant Permission Form -->
        <nz-card nzTitle="Grant New Permission" class="mb-6">
          <form nz-form [formGroup]="aclForm" (ngSubmit)="grantPermission()" class="space-y-4">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">User</nz-form-label>
                  <nz-form-control [nzErrorTip]="'User is required'">
                    <nz-select 
                      formControlName="userId" 
                      nzPlaceHolder="Select a user"
                      nzShowSearch
                      nzAllowClear
                      (nzOnSearch)="onUserSearch($event)">
                      @for (user of filteredUsers(); track user.id) {
                        <nz-option [nzValue]="user.id" [nzLabel]="user.fullName || user.username">
                          <div class="flex flex-col">
                            <span>{{ user.fullName || user.username }}</span>
                            <span class="text-xs text-gray-500">{{ user.email }}</span>
                          </div>
                        </nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Permission</nz-form-label>
                  <nz-form-control [nzErrorTip]="'Permission is required'">
                    <nz-select formControlName="permission" nzPlaceHolder="Select permission">
                      @for (perm of permissions; track perm.value) {
                        <nz-option [nzValue]="perm.value" [nzLabel]="perm.label">
                          <nz-icon [nzType]="getPermissionIcon(perm.value)" class="mr-2"></nz-icon>
                          {{ perm.label }}
                        </nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label>&nbsp;</nz-form-label>
                  <nz-form-control>
                    <button 
                      nz-button 
                      nzType="primary" 
                      type="submit" 
                      [nzLoading]="isGrantingPermission()"
                      [disabled]="aclForm.invalid">
                      <nz-icon nzType="plus"></nz-icon>
                      Grant Permission
                    </button>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>
          </form>
        </nz-card>

        <!-- Current Permissions Table -->
        <nz-card nzTitle="Current Permissions">
          @if (isLoadingAcls()) {
            <div class="flex justify-center items-center py-12">
              <nz-spin nzSize="large"></nz-spin>
            </div>
          } @else if (currentAcls().length > 0) {
            <nz-table #basicTable [nzData]="currentAcls()" [nzSize]="'middle'">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Permission</th>
                  <th nzWidth="100px" nzAlign="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let acl of basicTable.data">
                  <td>
                    <div class="flex items-center">
                      <nz-icon nzType="user" class="text-blue-500 mr-2"></nz-icon>
                      <span class="font-medium">{{ acl.username }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center">
                      <nz-icon [nzType]="getPermissionIcon(acl.permission)" class="mr-2" 
                               [class]="getPermissionColor(acl.permission)"></nz-icon>
                      <span>{{ acl.permission }}</span>
                    </div>
                  </td>
                  <td nzAlign="center">
                    <button 
                      nz-button 
                      nzType="text" 
                      nzDanger
                      nzSize="small"
                      (click)="revokePermissionConfirmation(acl)">
                      <nz-icon nzType="delete"></nz-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </nz-table>
          } @else {
            <nz-empty nzNotFoundImage="simple" nzNotFoundContent="No permissions granted yet">
              <div nz-empty-footer>
                <span class="text-gray-500">Grant permissions using the form above</span>
              </div>
            </nz-empty>
          }
        </nz-card>

      } @else {
        <nz-card class="text-center">
          <div class="py-12">
            <nz-icon nzType="exclamation-circle" class="text-6xl text-gray-400 mb-4"></nz-icon>
            <h2 class="text-2xl font-semibold mb-2">Document Not Found</h2>
            <p class="text-gray-600 mb-6">The document details could not be loaded.</p>
            <button nz-button nzType="primary" routerLink="/documents">
              <nz-icon nzType="arrow-left"></nz-icon> 
              Back to Documents
            </button>
          </div>
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
export class DocumentAclPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private aclService = inject(AclService);
  private documentService = inject(DocumentService);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  documentId = signal<number | null>(null);
  document: WritableSignal<Document | null> = signal(null);
  currentAcls: WritableSignal<AclEntryResponse[]> = signal([]);
  users: WritableSignal<User[]> = signal([]);
  filteredUsers: WritableSignal<User[]> = signal([]);

  isLoadingDocument = signal(true);
  isLoadingAcls = signal(false);
  isLoadingUsers = signal(false);
  isGrantingPermission = signal(false);

  aclForm!: FormGroup;

  permissions = [
    { value: 'VIEW', label: 'View' },
    { value: 'EDIT', label: 'Edit' },
    { value: 'DELETE', label: 'Delete' }
  ];

  constructor() {
    this.aclForm = this.fb.group({
      userId: [null as number | null, Validators.required],
      permission: [null as string | null, Validators.required]
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

  onUserSearch(searchTerm: string): void {
    const filter = searchTerm.toLowerCase();
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
    const aclData = {
      action: 'grant' as 'grant',
      userId: this.aclForm.value.userId,
      permission: this.aclForm.value.permission
    };
    const docId = this.documentId()!;
    this.aclService.updateAcl(docId, aclData).subscribe({
      next: () => {
        this.snackbar.success('Permission granted successfully.');
        this.loadCurrentAcls(docId);
        this.aclForm.reset({ userId: null, permission: null });
        this.isGrantingPermission.set(false);
      },
      error: (err: any) => {
        this.isGrantingPermission.set(false);
        this.snackbar.error('Failed to grant permission: ' + (err.error?.message || err.message));
      }
    });
  }

  revokePermissionConfirmation(acl: AclEntryResponse): void {
    this.modal.confirm({
      nzTitle: 'Confirm Revoke',
      nzContent: `Are you sure you want to revoke ${acl.permission} permission for ${acl.username}?`,
      nzOkText: 'Revoke',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.revokePermission(acl);
      }
    });
  }

  revokePermission(acl: any): void {
    const docId = this.documentId();
    if (!docId) {
      this.snackbar.error('Document ID is missing.');
      return;
    }
    const aclData = {
      action: 'revoke' as 'revoke',
      userId: acl.userId ?? acl.principalId,
      permission: acl.permission
    };
    this.aclService.updateAcl(docId, aclData).subscribe({
      next: () => {
        this.snackbar.success('Permission revoked successfully.');
        this.loadCurrentAcls(docId);
      },
      error: (err: any) => {
        this.snackbar.error('Failed to revoke permission: ' + (err.error?.message || err.message));
      }
    });
  }

  getPermissionIcon(permission: string): string {
    switch (permission) {
      case 'VIEW':
        return 'eye';
      case 'EDIT':
        return 'edit';
      case 'DELETE':
        return 'delete';
      default:
        return 'safety-certificate';
    }
  }

  getPermissionColor(permission: string): string {
    switch (permission) {
      case 'VIEW':
        return 'text-blue-500';
      case 'EDIT':
        return 'text-yellow-500';
      case 'DELETE':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }
}
