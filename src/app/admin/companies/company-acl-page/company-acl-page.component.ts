import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { CompanyService } from '../../../core/services/company.service';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { 
  Company, 
  UserCompanyResourceTypeAccessDto, 
  CreateUserCompanyResourceTypeAccessDto,
  UpdateUserCompanyResourceTypeAccessDto 
} from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface ResourceType {
  id: number;
  code: string;
  name: string;
  companyId: number;
}

@Component({
  selector: 'app-company-acl-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzFormModule,
    NzSelectModule,
    NzCheckboxModule,
    NzTagModule,
    NzEmptyModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzGridModule,
    NzDropDownModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <nz-page-header class="mb-6" [nzGhost]="false">
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a (click)="goBack()">Companies</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Manage Access</nz-breadcrumb-item>
        </nz-breadcrumb>
        
        <nz-page-header-title>Manage Company Access</nz-page-header-title>
        <nz-page-header-subtitle>{{ company()?.name || 'Loading...' }}</nz-page-header-subtitle>
        
        <nz-page-header-extra>
          <button nz-button nzType="default" (click)="goBack()">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Companies
          </button>
        </nz-page-header-extra>
      </nz-page-header>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <nz-spin nzSize="large" nzTip="Loading access data..."></nz-spin>
        </div>
      } @else {
        <!-- Grant User Access Form -->
        <nz-card nzTitle="Grant User Access" class="mb-6">
          <form nz-form [formGroup]="accessForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">User</nz-form-label>
                  <nz-form-control [nzErrorTip]="'User is required'">
                    <nz-select formControlName="userId" nzPlaceHolder="Select a user">
                      @for (user of users(); track user.id) {
                        <nz-option [nzValue]="user.id" [nzLabel]="user.username">
                          <div class="flex flex-col">
                            <span class="font-medium">{{ user.username }}</span>
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
                  <nz-form-label>Resource Type</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="resourceTypeId" nzPlaceHolder="All Resource Types" nzAllowClear>
                      @for (rt of resourceTypes(); track rt.id) {
                        <nz-option [nzValue]="rt.id" [nzLabel]="rt.name">
                          <nz-icon nzType="file-text" class="mr-2"></nz-icon>
                          {{ rt.name }}
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
                      [nzLoading]="isSubmitting()"
                      [disabled]="accessForm.invalid || !hasAnyPermission()"
                      class="w-full">
                      <nz-icon nzType="plus"></nz-icon>
                      Grant Access
                    </button>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>
            
            <!-- Permissions Section -->
            <nz-form-item>
              <nz-form-label>Permissions</nz-form-label>
              <nz-form-control>
                <div class="flex gap-4">
                  <label nz-checkbox formControlName="canRead">
                    <nz-icon nzType="eye" class="mr-1"></nz-icon>
                    Read
                  </label>
                  <label nz-checkbox formControlName="canWrite">
                    <nz-icon nzType="edit" class="mr-1"></nz-icon>
                    Write
                  </label>
                  <label nz-checkbox formControlName="canDelete">
                    <nz-icon nzType="delete" class="mr-1"></nz-icon>
                    Delete
                  </label>
                  <label nz-checkbox formControlName="canManage">
                    <nz-icon nzType="setting" class="mr-1"></nz-icon>
                    Manage
                  </label>
                </div>
              </nz-form-control>
            </nz-form-item>
          </form>
        </nz-card>

        <!-- Current Access List -->
        <nz-card nzTitle="Current User Access">
          <nz-table #basicTable [nzData]="accessList()" [nzSize]="'middle'">
            <thead>
              <tr>
                <th>User</th>
                <th>Resource Type</th>
                <th>Permissions</th>
                <th nzWidth="120px" nzAlign="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let access of basicTable.data">
                <td>
                  <div class="flex items-center">
                    <nz-icon nzType="user" class="text-blue-500 mr-2"></nz-icon>
                    <span class="font-medium">{{ access.userName }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center">
                    <nz-icon nzType="file-text" class="text-gray-500 mr-2"></nz-icon>
                    <span>{{ access.resourceTypeName || 'All Resource Types' }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1 flex-wrap">
                    @if (access.canRead) {
                      <nz-tag nzColor="blue">
                        <nz-icon nzType="eye"></nz-icon>
                        Read
                      </nz-tag>
                    }
                    @if (access.canWrite) {
                      <nz-tag nzColor="green">
                        <nz-icon nzType="edit"></nz-icon>
                        Write
                      </nz-tag>
                    }
                    @if (access.canDelete) {
                      <nz-tag nzColor="red">
                        <nz-icon nzType="delete"></nz-icon>
                        Delete
                      </nz-tag>
                    }
                    @if (access.canManage) {
                      <nz-tag nzColor="purple">
                        <nz-icon nzType="setting"></nz-icon>
                        Manage
                      </nz-tag>
                    }
                  </div>
                </td>
                <td nzAlign="center">
                  <div class="flex justify-center">
                    <button 
                      nz-button 
                      nzType="text" 
                      nzSize="small"
                      nz-dropdown 
                      [nzDropdownMenu]="menu">
                      <nz-icon nzType="more" nzTheme="outline"></nz-icon>
                    </button>
                    <nz-dropdown-menu #menu="nzDropdownMenu">
                      <ul nz-menu>
                        <li nz-menu-item (click)="editAccess(access)">
                          <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                          Edit Access
                        </li>
                        <li nz-menu-divider></li>
                        <li nz-menu-item (click)="deleteAccess(access)" class="text-red-500">
                          <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                          Remove Access
                        </li>
                      </ul>
                    </nz-dropdown-menu>
                  </div>
                </td>
              </tr>
            </tbody>
          </nz-table>

          <!-- Empty State -->
          @if (accessList().length === 0) {
            <nz-empty 
              nzNotFoundImage="simple" 
              nzNotFoundContent="No user access granted">
              <div nz-empty-footer>
                <span class="text-gray-500">Grant access to users using the form above</span>
              </div>
            </nz-empty>
          }
        </nz-card>
      }
    </div>
  `,
  styles: [`
    nz-page-header {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
    
    nz-table ::ng-deep .ant-table-tbody > tr:hover > td {
      background: #f5f5f5;
    }
  `]
})
export class CompanyAclPageComponent implements OnInit {
  private companyService = inject(CompanyService);
  private userService = inject(UserService);
  private resourceTypeService = inject(ResourceTypeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modal = inject(NzModalService);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  isSubmitting = signal(false);
  company = signal<Company | null>(null);
  users = signal<User[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  accessList = signal<UserCompanyResourceTypeAccessDto[]>([]);

  accessForm: FormGroup = this.fb.group({
    userId: [null, [Validators.required]],
    resourceTypeId: [null],
    canRead: [false],
    canWrite: [false],
    canDelete: [false],
    canManage: [false]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const companyId = Number(this.route.snapshot.paramMap.get('id'));
    if (companyId) {
      this.isLoading.set(true);
      forkJoin({
        company: this.companyService.get(companyId),
        users: this.userService.getAllUsers(),
        resourceTypes: this.resourceTypeService.listAllNonPaged(),
        userAccess: this.companyService.getUserAccessByCompany(companyId)
      }).subscribe({
        next: (data) => {
          this.company.set(data.company);
          this.users.set(data.users);
          this.resourceTypes.set(data.resourceTypes.filter(rt => rt.companyId === companyId));
          this.accessList.set(data.userAccess);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.snackbar.error('Failed to load data');
          this.isLoading.set(false);
        }
      });
    }
  }

  hasAnyPermission(): boolean {
    const form = this.accessForm.value;
    return form.canRead || form.canWrite || form.canDelete || form.canManage;
  }

  onSubmit() {
    if (this.accessForm.valid && this.company() && this.hasAnyPermission()) {
      this.isSubmitting.set(true);
      
      const accessData: CreateUserCompanyResourceTypeAccessDto = {
        userId: this.accessForm.value.userId,
        companyId: this.company()!.id,
        resourceTypeId: this.accessForm.value.resourceTypeId || undefined,
        canRead: this.accessForm.value.canRead,
        canWrite: this.accessForm.value.canWrite,
        canDelete: this.accessForm.value.canDelete,
        canManage: this.accessForm.value.canManage
      };

      this.companyService.createUserAccess(accessData).subscribe({
        next: () => {
          this.snackbar.success('User access granted successfully');
          this.accessForm.reset();
          this.loadData();
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Error granting access:', error);
          this.snackbar.error('Failed to grant user access');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  editAccess(access: UserCompanyResourceTypeAccessDto) {
    // Populate form with existing access for editing
    this.accessForm.patchValue({
      userId: access.userId,
      resourceTypeId: access.resourceTypeId,
      canRead: access.canRead,
      canWrite: access.canWrite,
      canDelete: access.canDelete,
      canManage: access.canManage
    });
  }

  deleteAccess(access: UserCompanyResourceTypeAccessDto) {
    this.modal.confirm({
      nzTitle: 'Remove Access',
      nzContent: `Are you sure you want to remove access for "${access.userName}"?`,
      nzOkText: 'Remove',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        if (access.id) {
          return this.companyService.deleteUserAccess(access.id).toPromise().then(() => {
            this.snackbar.success('User access removed successfully');
            this.loadData();
          }).catch((error) => {
            console.error('Error removing access:', error);
            this.snackbar.error('Failed to remove user access');
          });
        }
        return Promise.resolve();
      }
    });
  }

  goBack() {
    this.router.navigate(['/companies']);
  }
}
