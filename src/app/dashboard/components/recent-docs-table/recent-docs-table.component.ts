import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Document } from '../../../core/models/document.model';

// NG-ZORRO imports
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-recent-docs-table',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NzTableModule, 
    NzButtonModule, 
    NzIconModule, 
    NzSpinModule,
    NzTagModule,
    NzAvatarModule,
    NzTypographyModule,
    NzEmptyModule,
    NzToolTipModule
  ],
  template: `
    <div class="recent-docs-table">
      <nz-spin [nzSpinning]="loading" nzTip="Loading recent documents...">
        <nz-table 
          #basicTable 
          [nzData]="documents" 
          [nzFrontPagination]="false"
          [nzShowPagination]="false"
          [nzSize]="'middle'"
          [nzBordered]="false">
          <thead>
            <tr>
              <th nzWidth="40%">Document</th>
              <th nzWidth="20%">Type</th>
              <th nzWidth="20%">Status</th>
              <th nzWidth="15%">Created</th>
              <th nzWidth="5%" nzAlign="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let document of basicTable.data" 
                class="document-row"
                (click)="onRowClick(document)">
              <!-- Document Info -->
              <td>
                <div class="document-info">
                  <nz-avatar 
                    [nzIcon]="getDocumentIcon(document.resourceTypeName ?? '')"
                    [style]="{ backgroundColor: getDocumentColor(document.resourceTypeName ?? '') }"
                    nzSize="small">
                  </nz-avatar>
                  <div class="document-details">
                    <a [routerLink]="['/documents', document.id]" 
                       class="document-title"
                       (click)="$event.stopPropagation()">
                      {{ document.title }}
                    </a>
                    <div class="document-code">{{ document.resourceCode }}</div>
                  </div>
                </div>
              </td>
              
              <!-- Resource Type -->
              <td>
                <nz-tag [nzColor]="getTypeColor(document.resourceTypeName ?? '')">
                  {{ document.resourceTypeName }}
                </nz-tag>
              </td>
              
              <!-- Status -->
              <td>
                <nz-tag [nzColor]="getStatusColor(document.status ?? '')">
                  {{ document.status }}
                </nz-tag>
              </td>
              
              <!-- Created At -->
              <td>
                <div class="date-info">
                  <div class="date-primary">{{ document.createdAt | date:'MMM d' }}</div>
                  <div class="date-secondary">{{ document.createdAt | date:'h:mm a' }}</div>
                </div>
              </td>
              
              <!-- Actions -->
              <td nzAlign="center">
                <button 
                  nz-button 
                  nzType="text" 
                  nzSize="small"
                  [routerLink]="['/documents', document.id]"
                  nz-tooltip="View Document"
                  (click)="$event.stopPropagation()">
                  <span nz-icon nzType="eye" nzTheme="outline"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>
        
        <!-- Empty State -->
        <nz-empty 
          *ngIf="!loading && documents.length === 0"
          nzNotFoundImage="simple" 
          [nzNotFoundContent]="'No recent documents found'"
          style="margin: 40px 0;">
        </nz-empty>
      </nz-spin>
    </div>
  `,
  styles: [`
    .recent-docs-table {
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
    }

    .document-code {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .date-info {
      font-size: 12px;
    }

    .date-primary {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      line-height: 1.4;
    }

    .date-secondary {
      color: rgba(0, 0, 0, 0.45);
      line-height: 1.2;
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

    ::ng-deep .ant-empty {
      color: rgba(0, 0, 0, 0.45);
    }
  `]
})
export class RecentDocsTableComponent {
  @Input() documents: Document[] = [];
  @Input() loading = false;
  @Output() documentSelected = new EventEmitter<number>();
  
  onRowClick(document: Document): void {
    this.documentSelected.emit(document.id);
  }

  getDocumentIcon(resourceTypeName: string): string {
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

  getDocumentColor(resourceTypeName: string): string {
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

  getTypeColor(resourceTypeName: string): string {
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

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'ARCHIVED': 'warning',
      'DELETED': 'error',
      'DRAFT': 'processing'
    };
    return statusColors[status] || 'default';
  }
}
