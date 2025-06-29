import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { ResourceType } from '../../../core/models/resource-type.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-resource-type-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzTagModule,
    NzEmptyModule,
    NzDropDownModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Resource Type Management</h1>
          <p class="text-gray-600 mt-1">Manage document types and their field definitions</p>
        </div>
        <button nz-button nzType="primary" routerLink="new">
          <nz-icon nzType="plus"></nz-icon>
          Create Resource Type
        </button>
      </div>

      <!-- Resource Types Table -->
      <nz-card>
        <nz-table 
          #basicTable 
          [nzData]="resourceTypes()" 
          [nzLoading]="isLoading()"
          [nzPageSize]="10"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzSize]="'middle'">
          <thead>
            <tr>
              <th nzWidth="80px" nzSortKey="id">ID</th>
              <th nzSortKey="code">Code</th>
              <th nzSortKey="name">Name</th>
              <th nzSortKey="company">Company</th>
              <th>Description</th>
              <th nzWidth="100px" nzAlign="center">Fields</th>
              <th nzWidth="140px" nzSortKey="createdAt">Created At</th>
              <th nzWidth="120px" nzAlign="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rt of basicTable.data">
              <td>
                <span class="font-mono text-gray-600">{{ rt.id }}</span>
              </td>
              <td>
                <div class="flex items-center">
                  <nz-icon nzType="file-text" class="text-blue-500 mr-2"></nz-icon>
                  <span class="font-medium">{{ rt.code }}</span>
                </div>
              </td>
              <td>
                <span class="text-gray-900">{{ rt.name }}</span>
              </td>
              <td>
                @if (rt.companyName) {
                  <div class="flex items-center">
                    <nz-icon nzType="apartment" class="text-orange-500 mr-2"></nz-icon>
                    <span>{{ rt.companyName }}</span>
                  </div>
                } @else {
                  <span class="text-gray-400">N/A</span>
                }
              </td>
              <td>
                <span class="text-gray-600">{{ rt.description || '-' }}</span>
              </td>
              <td nzAlign="center">
                <nz-tag [nzColor]="getFieldCountColor(rt.fields?.length || 0)">
                  {{ rt.fields?.length || 0 }} field{{ (rt.fields?.length || 0) !== 1 ? 's' : '' }}
                </nz-tag>
              </td>
              <td>
                <span class="text-sm text-gray-500">{{ rt.createdAt | date:'MMM dd, yyyy' }}</span>
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
                      <li nz-menu-item [routerLink]="['edit', rt.id]">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        Edit Resource Type
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="onDeleteResourceType(rt)" class="text-red-500">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                        Delete Resource Type
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <!-- Empty State -->
        @if (resourceTypes().length === 0 && !isLoading()) {
          <nz-empty 
            nzNotFoundImage="simple" 
            nzNotFoundContent="No resource types found">
            <div nz-empty-footer>
              <button nz-button nzType="primary" routerLink="new">
                <nz-icon nzType="plus"></nz-icon>
                Create First Resource Type
              </button>
            </div>
          </nz-empty>
        }
      </nz-card>
    </div>
  `,
  styles: [`
    nz-table ::ng-deep .ant-table-tbody > tr:hover > td {
      background: #f5f5f5;
    }
  `]
})
export class ResourceTypeListPageComponent implements OnInit {
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private modal = inject(NzModalService);

  isLoading = signal(true);
  resourceTypes = signal<ResourceType[]>([]);

  ngOnInit(): void {
    this.fetchAllResourceTypes();
  }

  fetchAllResourceTypes(): void {
    this.isLoading.set(true);
    this.resourceTypeService.listAllNonPaged().subscribe({
      next: (data) => {
        this.resourceTypes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load resource types: ' + (err.error?.message || err.message));
        this.resourceTypes.set([]);
      }
    });
  }

  onDeleteResourceType(resourceType: ResourceType): void {
    this.modal.confirm({
      nzTitle: 'Delete Resource Type',
      nzContent: `Are you sure you want to delete resource type "${resourceType.code}"? This action cannot be undone and might affect existing documents using this type.`,
      nzOkText: 'Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        return this.resourceTypeService.delete(resourceType.id).toPromise().then(() => {
          this.snackbar.success(`Resource type "${resourceType.code}" deleted successfully`);
          this.fetchAllResourceTypes();
        }).catch((err) => {
          this.snackbar.error('Failed to delete resource type: ' + (err.error?.message || err.message));
        });
      }
    });
  }

  getFieldCountColor(count: number): string {
    if (count === 0) return 'default';
    if (count <= 3) return 'blue';
    if (count <= 6) return 'green';
    return 'orange';
  }
}
