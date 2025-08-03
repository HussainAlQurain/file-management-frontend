import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
import { TranslationService } from '../../../core/services/translation.service';

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
    TranslateModule,
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
    <div class="company-acl-container" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <div class="header-top">
            <div class="header-title-section">
              <div class="breadcrumb-section">
                <a (click)="goBack()" class="breadcrumb-link">
                  {{ 'admin.companies.acl.breadcrumb.companies' | translate }}
                </a>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current">{{ 'admin.companies.acl.breadcrumb.manage_access' | translate }}</span>
              </div>
              <h1 class="page-title">{{ 'admin.companies.acl.title' | translate }}</h1>
              <p class="page-subtitle">{{ company()?.name || ('common.loading' | translate) }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="default" (click)="goBack()" class="action-button">
                <nz-icon [nzType]="translationService.isRTL() ? 'arrow-right' : 'arrow-left'"></nz-icon>
                <span>{{ 'admin.companies.acl.back' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <nz-spin nzSize="large" [nzTip]="'admin.companies.acl.loading' | translate"></nz-spin>
        </div>
      } @else {
        <!-- Grant User Access Form -->
        <nz-card [nzTitle]="'admin.companies.acl.grant_form.title' | translate" class="form-card">
          <form nz-form [formGroup]="accessForm" (ngSubmit)="onSubmit()" class="access-form">
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">{{ 'admin.companies.acl.grant_form.user' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'admin.companies.acl.grant_form.user_required' | translate">
                    <nz-select 
                      formControlName="userId" 
                      [nzPlaceHolder]="'admin.companies.acl.grant_form.user_placeholder' | translate"
                      class="rtl-input"
                      [class.rtl-select]="translationService.isRTL()">
                      @for (user of users(); track user.id) {
                        <nz-option [nzValue]="user.id" [nzLabel]="user.username">
                          <div class="user-option" [class.rtl-option]="translationService.isRTL()">
                            <span class="user-name">{{ user.username }}</span>
                            <span class="user-email">{{ user.email }}</span>
                          </div>
                        </nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label>{{ 'admin.companies.acl.grant_form.resource_type' | translate }}</nz-form-label>
                  <nz-form-control>
                    <nz-select 
                      formControlName="resourceTypeId" 
                      [nzPlaceHolder]="'admin.companies.acl.grant_form.resource_type_placeholder' | translate" 
                      nzAllowClear
                      class="rtl-input"
                      [class.rtl-select]="translationService.isRTL()">
                      @for (rt of resourceTypes(); track rt.id) {
                        <nz-option [nzValue]="rt.id" [nzLabel]="rt.name">
                          <nz-icon nzType="file-text" [class]="translationService.isRTL() ? 'ml-2' : 'mr-2'"></nz-icon>
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
                      class="grant-button">
                      <nz-icon nzType="plus"></nz-icon>
                      <span>{{ 'admin.companies.acl.grant_form.grant_button' | translate }}</span>
                    </button>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>
            
            <!-- Permissions Section -->
            <nz-form-item>
              <nz-form-label>{{ 'admin.companies.acl.grant_form.permissions' | translate }}</nz-form-label>
              <nz-form-control>
                <div class="permissions-grid" [class.rtl-permissions]="translationService.isRTL()">
                  <label nz-checkbox formControlName="canRead" class="permission-checkbox">
                    <nz-icon nzType="eye" [class]="translationService.isRTL() ? 'ml-1' : 'mr-1'"></nz-icon>
                    {{ 'admin.companies.acl.grant_form.permissions_read' | translate }}
                  </label>
                  <label nz-checkbox formControlName="canWrite" class="permission-checkbox">
                    <nz-icon nzType="edit" [class]="translationService.isRTL() ? 'ml-1' : 'mr-1'"></nz-icon>
                    {{ 'admin.companies.acl.grant_form.permissions_write' | translate }}
                  </label>
                  <label nz-checkbox formControlName="canDelete" class="permission-checkbox">
                    <nz-icon nzType="delete" [class]="translationService.isRTL() ? 'ml-1' : 'mr-1'"></nz-icon>
                    {{ 'admin.companies.acl.grant_form.permissions_delete' | translate }}
                  </label>
                  <label nz-checkbox formControlName="canManage" class="permission-checkbox">
                    <nz-icon nzType="setting" [class]="translationService.isRTL() ? 'ml-1' : 'mr-1'"></nz-icon>
                    {{ 'admin.companies.acl.grant_form.permissions_manage' | translate }}
                  </label>
                </div>
              </nz-form-control>
            </nz-form-item>
          </form>
        </nz-card>

        <!-- Current Access List -->
        <nz-card [nzTitle]="'admin.companies.acl.table.title' | translate" class="table-card">
          <nz-table #basicTable [nzData]="accessList()" [nzSize]="'middle'">
            <thead>
              <tr>
                <th>{{ 'admin.companies.acl.table.user' | translate }}</th>
                <th>{{ 'admin.companies.acl.table.resource_type' | translate }}</th>
                <th>{{ 'admin.companies.acl.table.permissions' | translate }}</th>
                <th nzWidth="120px" nzAlign="center">{{ 'admin.companies.acl.table.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let access of basicTable.data">
                <td>
                  <div class="user-cell" [class.rtl-cell]="translationService.isRTL()">
                    <nz-icon nzType="user" class="user-icon"></nz-icon>
                    <span class="user-name">{{ access.userName }}</span>
                  </div>
                </td>
                <td>
                  <div class="resource-cell" [class.rtl-cell]="translationService.isRTL()">
                    <nz-icon nzType="file-text" class="resource-icon"></nz-icon>
                    <span>{{ access.resourceTypeName || ('admin.companies.acl.table.all_resource_types' | translate) }}</span>
                  </div>
                </td>
                <td>
                  <div class="permissions-tags" [class.rtl-tags]="translationService.isRTL()">
                    @if (access.canRead) {
                      <nz-tag nzColor="blue">
                        <nz-icon nzType="eye"></nz-icon>
                        {{ 'admin.companies.acl.permissions.read' | translate }}
                      </nz-tag>
                    }
                    @if (access.canWrite) {
                      <nz-tag nzColor="green">
                        <nz-icon nzType="edit"></nz-icon>
                        {{ 'admin.companies.acl.permissions.write' | translate }}
                      </nz-tag>
                    }
                    @if (access.canDelete) {
                      <nz-tag nzColor="red">
                        <nz-icon nzType="delete"></nz-icon>
                        {{ 'admin.companies.acl.permissions.delete' | translate }}
                      </nz-tag>
                    }
                    @if (access.canManage) {
                      <nz-tag nzColor="purple">
                        <nz-icon nzType="setting"></nz-icon>
                        {{ 'admin.companies.acl.permissions.manage' | translate }}
                      </nz-tag>
                    }
                  </div>
                </td>
                <td nzAlign="center">
                  <div class="actions-cell">
                    <button 
                      nz-button 
                      nzType="text" 
                      nzSize="small"
                      nz-dropdown 
                      [nzDropdownMenu]="menu"
                      [nzPlacement]="translationService.isRTL() ? 'bottomLeft' : 'bottomRight'">
                      <nz-icon nzType="more" nzTheme="outline"></nz-icon>
                    </button>
                    <nz-dropdown-menu #menu="nzDropdownMenu">
                      <ul nz-menu>
                        <li nz-menu-item (click)="editAccess(access)">
                          <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                          {{ 'admin.companies.acl.actions.edit' | translate }}
                        </li>
                        <li nz-menu-divider></li>
                        <li nz-menu-item (click)="deleteAccess(access)" class="delete-action">
                          <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                          {{ 'admin.companies.acl.actions.remove' | translate }}
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
            <div class="empty-state-container">
              <nz-icon nzType="safety-certificate" class="empty-state-icon"></nz-icon>
              <h3 class="empty-state-title">{{ 'admin.companies.acl.empty.message' | translate }}</h3>
              <p class="empty-state-description">{{ 'admin.companies.acl.empty.description' | translate }}</p>
            </div>
          }
        </nz-card>
      }
    </div>
  `,
  styles: [`
    .company-acl-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    /* Page Header Redesign */
    .page-header-wrapper {
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 24px;
    }

    .page-header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .header-title-section {
      flex: 1;
      min-width: 0;
    }

    .breadcrumb-section {
      margin-bottom: 8px;
      font-size: 14px;
    }

    .breadcrumb-link {
      color: #1890ff;
      cursor: pointer;
      text-decoration: none;
    }

    .breadcrumb-link:hover {
      color: #40a9ff;
    }

    .breadcrumb-separator {
      margin: 0 8px;
      color: rgba(0, 0, 0, 0.45);
    }

    .breadcrumb-current {
      color: rgba(0, 0, 0, 0.85);
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
      line-height: 1.4;
    }

    .header-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .action-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    /* Loading Container */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 20px;
      background: #fff;
      border-radius: 6px;
      margin: 0 24px;
    }

    /* Form Card */
    .form-card {
      margin: 0 24px 24px 24px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .access-form {
      padding-top: 16px;
    }

    /* RTL Form Support */
    .rtl-input {
      direction: ltr;
      text-align: left;
    }

    .rtl-select .ant-select-selector {
      text-align: left;
    }

    [dir="rtl"] .rtl-input {
      direction: rtl;
      text-align: right;
    }

    [dir="rtl"] .rtl-select .ant-select-selector {
      text-align: right;
    }

    .user-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .rtl-option {
      align-items: flex-end;
    }

    .user-name {
      font-weight: 500;
      font-size: 14px;
    }

    .user-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }

    /* Permissions Grid */
    .permissions-grid {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .rtl-permissions {
      direction: rtl;
    }

    .permission-checkbox {
      display: flex;
      align-items: center;
      white-space: nowrap;
    }

    .grant-button {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    /* Table Card */
    .table-card {
      margin: 0 24px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    /* Table Cell Styling */
    .user-cell,
    .resource-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rtl-cell {
      flex-direction: row-reverse;
    }

    .user-icon {
      color: #1890ff;
      font-size: 16px;
    }

    .resource-icon {
      color: rgba(0, 0, 0, 0.45);
      font-size: 16px;
    }

    .user-name {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }

    /* Permission Tags */
    .permissions-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .rtl-tags {
      flex-direction: row-reverse;
    }

    /* Actions */
    .actions-cell {
      display: flex;
      justify-content: center;
    }

    .delete-action {
      color: #ff4d4f !important;
    }

    .delete-action:hover {
      background-color: #fff2f0 !important;
    }

    /* Empty State */
    .empty-state-container {
      text-align: center;
      padding: 64px 24px;
    }

    .empty-state-icon {
      font-size: 4rem;
      color: #d9d9d9;
      margin-bottom: 16px;
      display: block;
    }

    .empty-state-title {
      font-size: 1.125rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 8px;
      margin-top: 0;
    }

    .empty-state-description {
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
    }

    /* Table Styling */
    ::ng-deep .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      border-bottom: 1px solid #e8e8e8;
    }

    ::ng-deep .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f5f5f5;
    }

    ::ng-deep .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .page-header-content {
        padding: 16px;
      }
      
      .form-card,
      .table-card {
        margin: 0 16px 24px 16px;
      }
    }

    @media (max-width: 768px) {
      .header-top {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .action-button {
        justify-content: center;
        min-width: 160px;
      }
      
      .permissions-grid {
        flex-direction: column;
        gap: 12px;
      }
      
      .form-card,
      .table-card {
        margin: 0 12px 24px 12px;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 20px;
      }
      
      .action-button {
        width: 100%;
      }
      
      .grant-button {
        height: 44px;
      }
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
  private translateService = inject(TranslateService);
  translationService = inject(TranslationService);

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
          const errorMessage = this.translateService.instant('admin.companies.acl.loading_error');
          this.snackbar.error(errorMessage);
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
          const successMessage = this.translateService.instant('admin.companies.acl.messages.grant_success');
          this.snackbar.success(successMessage);
          this.accessForm.reset();
          this.loadData();
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Error granting access:', error);
          const errorMessage = this.translateService.instant('admin.companies.acl.messages.grant_error');
          this.snackbar.error(errorMessage);
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
    const titleText = this.translateService.instant('admin.companies.acl.delete.title');
    const contentText = this.translateService.instant('admin.companies.acl.delete.content')
      .replace('{userName}', access.userName);
    const okText = this.translateService.instant('admin.companies.acl.delete.ok');
    const cancelText = this.translateService.instant('admin.companies.acl.delete.cancel');

    this.modal.confirm({
      nzTitle: titleText,
      nzContent: contentText,
      nzOkText: okText,
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: cancelText,
      nzOnOk: () => {
        if (access.id) {
          return this.companyService.deleteUserAccess(access.id).toPromise().then(() => {
            const successMessage = this.translateService.instant('admin.companies.acl.messages.remove_success');
            this.snackbar.success(successMessage);
            this.loadData();
          }).catch((error) => {
            console.error('Error removing access:', error);
            const errorMessage = this.translateService.instant('admin.companies.acl.messages.remove_error');
            this.snackbar.error(errorMessage);
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
