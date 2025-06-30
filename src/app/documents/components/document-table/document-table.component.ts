import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// NG-ZORRO imports
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { Document } from '../../../core/models/document.model';

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    NzDropDownModule,
    NzMenuModule,
    NzToolTipModule,
    NzBadgeModule,
    NzEmptyModule,
    NzAvatarModule
  ],
  template: `
    <div class="document-table">
      <nz-spin [nzSpinning]="loading" nzTip="Loading documents...">
        <nz-table 
          #documentsTable
          [nzData]="documents" 
          [nzFrontPagination]="false"
          [nzShowPagination]="totalItems > pageSize"
          [nzPaginationPosition]="'bottom'"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalItems"
          [nzPageSizeOptions]="[5, 10, 25, 50]"
          [nzShowSizeChanger]="true"
          [nzShowQuickJumper]="true"
          [nzSize]="'middle'"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)">
          
          <thead>
            <tr>
              <th nzWidth="35%">Title</th>
              <th nzWidth="15%">Resource Code</th>
              <th nzWidth="12%">Type</th>
              <th nzWidth="10%">Status</th>
              <th nzWidth="10%">Owner</th>
              <th nzWidth="8%">File Type</th>
              <th nzWidth="10%" nzAlign="center">Actions</th>
            </tr>
          </thead>
          
          <tbody>
            <tr *ngFor="let document of documentsTable.data" 
                class="document-row"
                (click)="onRowClick(document)">
              
              <!-- Title Column with Parent/Child indicator -->
              <td>
                <div class="document-info">
                  <nz-avatar 
                    [nzIcon]="getDocumentIcon(document.resourceType?.name || document.resourceTypeName)"
                    [style]="{ backgroundColor: getDocumentColor(document.resourceType?.name || document.resourceTypeName) }"
                    nzSize="small">
                  </nz-avatar>
                  <div class="document-details">
                    <div class="flex items-center">
                      <nz-icon 
                        *ngIf="document.parent" 
                        nzType="arrow-right"
                        nzTheme="outline"
                        class="text-gray-400 mr-1"
                        [nz-tooltip]="'Child of: ' + document.parent.title">
                      </nz-icon>
                      <nz-badge 
                        *ngIf="document.children && document.children.length > 0"
                        [nzCount]="document.children.length" 
                        nzSize="small"
                        [nz-tooltip]="'Has ' + document.children.length + ' child document(s)'">
                        <nz-icon nzType="folder" nzTheme="outline" class="text-blue-500 mr-1"></nz-icon>
                      </nz-badge>
                      <a [routerLink]="['/documents', document.id]" 
                         class="document-title"
                         (click)="$event.stopPropagation()">
                        {{ document.title }}
                      </a>
                    </div>
                    <div class="document-code">{{ document.resourceCode }}</div>
                  </div>
                </div>
              </td>
              
              <!-- Resource Code -->
              <td>
                <span class="text-gray-600 font-mono text-sm">{{ document.resourceCode }}</span>
              </td>
              
              <!-- Resource Type -->
              <td>
                <nz-tag [nzColor]="getTypeColor(document.resourceType?.name || document.resourceTypeName)">
                  {{ document.resourceType?.name || document.resourceTypeName }}
                </nz-tag>
              </td>
              
              <!-- Status -->
              <td>
                <nz-tag [nzColor]="getStatusColor(document.status)">
                  {{ document.status }}
                </nz-tag>
              </td>
              
              <!-- Owner -->
              <td>
                <span class="text-gray-700">{{ document.owner?.username || document.owner?.email || 'System' }}</span>
              </td>
              
              <!-- File Type -->
              <td>
                <div class="flex items-center">
                  <nz-icon 
                    [nzType]="getFileIcon(document.mimeType)" 
                    nzTheme="outline"
                    class="text-gray-500 mr-1"
                    [nz-tooltip]="document.mimeType">
                  </nz-icon>
                  <span class="text-sm">{{ getFileType(document.mimeType) }}</span>
                </div>
              </td>
              
              <!-- Actions -->
              <td nzAlign="center">
                <button 
                  nz-button 
                  nzType="text" 
                  nzSize="small"
                  nz-dropdown 
                  [nzDropdownMenu]="menu"
                  nzPlacement="bottomRight"
                  (click)="$event.stopPropagation()">
                  <span nz-icon nzType="more" nzTheme="outline"></span>
                </button>
                <nz-dropdown-menu #menu="nzDropdownMenu">
                  <ul nz-menu>
                    <li nz-menu-item>
                      <a [routerLink]="['/documents', document.id]">
                        <nz-icon nzType="eye" nzTheme="outline"></nz-icon>
                        <span>View</span>
                      </a>
                    </li>
                    <li nz-menu-item>
                      <a [routerLink]="['/documents', document.id, 'edit']">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                        <span>Edit</span>
                      </a>
                    </li>
                    <li nz-menu-item>
                      <a [routerLink]="['/documents', document.id, 'acl']">
                        <nz-icon nzType="safety" nzTheme="outline"></nz-icon>
                        <span>Manage Access</span>
                      </a>
                    </li>
                    <li nz-menu-divider></li>
                    <li nz-menu-item nzDanger (click)="onDelete(document)">
                      <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                      <span>Delete</span>
                    </li>
                  </ul>
                </nz-dropdown-menu>
              </td>
            </tr>
          </tbody>
        </nz-table>
        
        <!-- Empty State -->
        <nz-empty 
          *ngIf="!loading && documents.length === 0"
          nzNotFoundImage="simple" 
          [nzNotFoundContent]="'No documents found'"
          style="margin: 40px 0;">
          <ng-template #nzNotFoundContent>
            <div class="text-center">
              <nz-icon nzType="folder-open" class="text-5xl text-gray-300 mb-4"></nz-icon>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p class="text-gray-500">Try adjusting your filters or create a new document</p>
            </div>
          </ng-template>
        </nz-empty>
      </nz-spin>
    </div>
  `,
  styles: [`
    .document-table {
      background: #fff;
      border-radius: 8px;
    }

    .document-row {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .document-row:hover {
      background-color: #f5f5f5;
    }

    .document-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .document-details {
      flex: 1;
      min-width: 0;
    }

    .document-title {
      display: block;
      font-weight: 500;
      color: #1890ff;
      text-decoration: none;
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .document-title:hover {
      text-decoration: underline;
      color: #40a9ff;
    }

    .document-code {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    ::ng-deep .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      border-bottom: 1px solid #f0f0f0;
    }

    ::ng-deep .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f5f5f5;
      padding: 12px 16px;
    }

    ::ng-deep .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }

    ::ng-deep .ant-pagination {
      margin-top: 16px;
      text-align: right;
    }

    ::ng-deep .ant-dropdown-menu-item:hover {
      background-color: #f5f5f5;
    }

    ::ng-deep .ant-dropdown-menu-item-danger:hover {
      background-color: #fff2f0;
      color: #ff4d4f;
    }
  `]
})
export class DocumentTableComponent {
  @Input() documents: Document[] = [];
  @Input() loading = false;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  
  @Output() page = new EventEmitter<PageEvent>();
  @Output() delete = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  
  onPageIndexChange(pageIndex: number): void {
    this.page.emit({
      pageIndex: pageIndex - 1, // ng-zorro uses 1-based pagination
      pageSize: this.pageSize
    });
  }
  
  onPageSizeChange(pageSize: number): void {
    this.page.emit({
      pageIndex: 0, // Reset to first page when changing page size
      pageSize: pageSize
    });
  }
  
  onRowClick(document: Document): void {
    this.view.emit(document.id);
  }
  
  onDelete(document: Document): void {
    this.delete.emit(document.id);
  }

  getDocumentIcon(resourceTypeName: string | undefined): string {
    if (!resourceTypeName) return 'file';
    const iconMap: { [key: string]: string } = {
      'Invoice': 'file-text',
      'Contract': 'solution',
      'Report': 'bar-chart',
      'Certificate': 'safety-certificate',
      'Policy': 'security-scan',
      'Manual': 'book',
      'Form': 'form',
      'Letter': 'mail',
      'Memo': 'message',
      'Presentation': 'presentation'
    };
    return iconMap[resourceTypeName] || 'file';
  }

  getDocumentColor(resourceTypeName: string | undefined): string {
    if (!resourceTypeName) return '#8c8c8c';
    const colorMap: { [key: string]: string } = {
      'Invoice': '#52c41a',
      'Contract': '#1890ff',
      'Report': '#fa8c16',
      'Certificate': '#f5222d',
      'Policy': '#722ed1',
      'Manual': '#13c2c2',
      'Form': '#eb2f96',
      'Letter': '#faad14',
      'Memo': '#a0d911',
      'Presentation': '#fa541c'
    };
    return colorMap[resourceTypeName] || '#8c8c8c';
  }

  getTypeColor(resourceTypeName: string | undefined): string {
    if (!resourceTypeName) return 'default';
    const colorMap: { [key: string]: string } = {
      'Invoice': 'green',
      'Contract': 'blue',
      'Report': 'orange',
      'Certificate': 'red',
      'Policy': 'purple',
      'Manual': 'cyan',
      'Form': 'magenta',
      'Letter': 'gold',
      'Memo': 'lime',
      'Presentation': 'volcano'
    };
    return colorMap[resourceTypeName] || 'default';
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'default';
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'ARCHIVED': 'warning',
      'DELETED': 'error',
      'DRAFT': 'processing'
    };
    return statusColors[status] || 'default';
  }

  getFileIcon(mimeType: string | undefined): string {
    if (!mimeType) return 'file';
    
    if (mimeType.startsWith('image/')) return 'file-image';
    if (mimeType.startsWith('video/')) return 'video-camera';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    switch (mimeType) {
      case 'application/pdf': return 'file-pdf';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        return 'file-word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 
        return 'file-excel';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 
        return 'file-ppt';
      case 'application/zip':
      case 'application/x-rar-compressed': 
        return 'file-zip';
      case 'text/plain': return 'file-text';
      case 'text/html': return 'html5';
      case 'application/json': return 'code';
      default: return 'file';
    }
  }

  getFileType(mimeType: string | undefined): string {
    if (!mimeType) return 'File';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    
    switch (mimeType) {
      case 'application/pdf': return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        return 'Word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 
        return 'Excel';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 
        return 'PowerPoint';
      case 'application/zip': return 'ZIP';
      case 'application/x-rar-compressed': return 'RAR';
      case 'text/plain': return 'Text';
      case 'text/html': return 'HTML';
      case 'application/json': return 'JSON';
      default: return mimeType.split('/')[1]?.toUpperCase() || 'File';
    }
  }
}
