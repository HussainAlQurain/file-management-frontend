import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { forkJoin } from 'rxjs';

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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <div class="p-4">
      <div class="flex items-center gap-4 mb-6">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-3xl font-bold">Manage Company ACLs</h2>
        @if (company()) {
          <span class="text-xl text-gray-600">- {{ company()!.name }}</span>
        }
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-8">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else {
        <!-- Add User Access Form -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Grant User Access</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="accessForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>User</mat-label>
                <mat-select formControlName="userId" required>                  @for (user of users(); track user.id) {
                    <mat-option [value]="user.id">
                      {{ user.username }} ({{ user.email }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Resource Type (Optional)</mat-label>
                <mat-select formControlName="resourceTypeId">
                  <mat-option [value]="null">All Resource Types</mat-option>
                  @for (rt of resourceTypes(); track rt.id) {
                    <mat-option [value]="rt.id">{{ rt.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium mb-2">Permissions</label>
                <mat-checkbox formControlName="canRead">Read</mat-checkbox>
                <mat-checkbox formControlName="canWrite">Write</mat-checkbox>
                <mat-checkbox formControlName="canDelete">Delete</mat-checkbox>
                <mat-checkbox formControlName="canManage">Manage</mat-checkbox>
              </div>

              <div class="flex items-end">
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="accessForm.invalid || isSubmitting()" class="w-full">
                  @if (isSubmitting()) {
                    <mat-spinner diameter="16" class="mr-2"></mat-spinner>
                  }
                  Grant Access
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Current Access List -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Current User Access</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="dataSource" matSort class="w-full">
                <!-- User Column -->
                <ng-container matColumnDef="user">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>User</th>
                  <td mat-cell *matCellDef="let access">{{ access.userName }}</td>
                </ng-container>

                <!-- Resource Type Column -->
                <ng-container matColumnDef="resourceType">
                  <th mat-header-cell *matHeaderCellDef>Resource Type</th>
                  <td mat-cell *matCellDef="let access">
                    {{ access.resourceTypeName || 'All Resource Types' }}
                  </td>
                </ng-container>

                <!-- Permissions Column -->
                <ng-container matColumnDef="permissions">
                  <th mat-header-cell *matHeaderCellDef>Permissions</th>
                  <td mat-cell *matCellDef="let access">
                    <div class="flex gap-1 flex-wrap">
                      @if (access.canRead) {
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Read</span>
                      }
                      @if (access.canWrite) {
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Write</span>
                      }
                      @if (access.canDelete) {
                        <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Delete</span>
                      }
                      @if (access.canManage) {
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Manage</span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let access">
                    <div class="flex gap-2">
                      <button mat-icon-button (click)="editAccess(access)" matTooltip="Edit Access">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteAccess(access)" matTooltip="Remove Access">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            @if (dataSource.data.length === 0) {
              <div class="text-center py-8 text-gray-500">
                <mat-icon class="text-6xl mb-4">security</mat-icon>
                <p class="text-lg">No user access granted</p>
                <p>Grant access to users to get started</p>
              </div>
            }

            <mat-paginator
              [pageSizeOptions]="[5, 10, 25, 100]"
              [pageSize]="10"
              showFirstLastButtons>
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .mat-mdc-table {
      width: 100%;
    }
    
    .mat-mdc-row:hover {
      background-color: #f5f5f5;
    }
  `]
})
export class CompanyAclPageComponent implements OnInit, AfterViewInit {
  private companyService = inject(CompanyService);
  private userService = inject(UserService);
  private resourceTypeService = inject(ResourceTypeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = signal(false);
  isSubmitting = signal(false);
  company = signal<Company | null>(null);
  users = signal<User[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  
  dataSource = new MatTableDataSource<UserCompanyResourceTypeAccessDto>([]);
  displayedColumns = ['user', 'resourceType', 'permissions', 'actions'];

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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
          this.dataSource.data = data.userAccess;
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

  onSubmit() {
    if (this.accessForm.valid && this.company()) {
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
    // For now, just allow updating permissions
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Access',
        message: `Are you sure you want to remove access for "${access.userName}"?`,
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && access.id) {
        this.companyService.deleteUserAccess(access.id).subscribe({
          next: () => {
            this.snackbar.success('User access removed successfully');
            this.loadData();
          },
          error: (error) => {
            console.error('Error removing access:', error);
            this.snackbar.error('Failed to remove user access');
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/companies']);
  }
}
