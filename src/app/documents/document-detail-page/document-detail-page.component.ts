import { Component, OnInit, inject, signal, WritableSignal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { DocumentService } from '../../core/services/document.service';
import { Document, RelatedDocuments, DocumentVersion } from '../../core/models/document.model';
import { SnackbarService } from '../../core/services/snackbar.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { environment } from '../../../environments/environment';
import { ReminderService, ReminderDTO } from '../../core/services/reminder.service';
import { UserService, UserDTO } from '../../core/services/user.service';
import { User } from '../../core/models/auth.model';
import { ReminderDialogComponent } from '../components/reminder-dialog/reminder-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule,
    NzTabsModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzListModule,
    NzAvatarModule,
    NzSpaceModule,
    NzTypographyModule,
    NzAlertModule,
    NzUploadModule,
    NzModalModule,
    NzTimelineModule,
    NzToolTipModule,
    NzBadgeModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzGridModule,
    NzStatisticModule,
    FileSizePipe
  ],
  template: `
    <div class="document-detail-container">
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-container">
        <nz-spin nzSimple [nzSize]="'large'" nzTip="Loading document..."></nz-spin>
      </div>

      <!-- Document Content -->
      <div *ngIf="!isLoading() && document()">
        <!-- Page Header with Breadcrumb -->
        <nz-page-header 
          nzBackIcon
          (nzBack)="navigateBack()"
          [nzTitle]="document()!.title"
          [nzSubtitle]="'Resource Code: ' + document()!.resourceCode">
          
          <nz-breadcrumb nz-page-header-breadcrumb>
            <nz-breadcrumb-item>
              <a routerLink="/documents">Documents</a>
            </nz-breadcrumb-item>
            <nz-breadcrumb-item>{{ document()!.resourceType?.name || 'Unknown Type' }}</nz-breadcrumb-item>
            <nz-breadcrumb-item>{{ document()!.title }}</nz-breadcrumb-item>
          </nz-breadcrumb>

          <nz-page-header-content>
            <div nz-row [nzGutter]="[16, 16]">
              <nz-statistic nz-col [nzSpan]="6" nzTitle="Status" [nzValue]="document()!.status">
                <ng-template #nzValueTemplate>
                  <nz-tag [nzColor]="getStatusColor(document()!.status)">
                    {{ document()!.status }}
                  </nz-tag>
                </ng-template>
              </nz-statistic>
              <nz-statistic nz-col [nzSpan]="6" nzTitle="Created By" [nzValue]="document()!.owner?.username || 'System'"></nz-statistic>
              <nz-statistic nz-col [nzSpan]="6" nzTitle="Created">
                <ng-template #nzValueTemplate>
                  {{ document()!.createdAt | date:'mediumDate' }}
                </ng-template>
              </nz-statistic>
              <nz-statistic nz-col [nzSpan]="6" nzTitle="Last Updated">
                <ng-template #nzValueTemplate>
                  {{ document()!.updatedAt | date:'mediumDate' }}
                </ng-template>
              </nz-statistic>
            </div>
          </nz-page-header-content>
          
          <nz-page-header-extra>
            <nz-space>
              <button *nzSpaceItem nz-button nzType="primary" [routerLink]="['/documents', document()!.id, 'edit']">
                <span nz-icon nzType="edit" nzTheme="outline"></span>
                Edit
              </button>
              <button *nzSpaceItem nz-button [routerLink]="['/documents', document()!.id, 'acl']">
                <span nz-icon nzType="safety" nzTheme="outline"></span>
                Manage ACL
              </button>
              <ng-container *ngIf="document()!.storageKey">
                <a *nzSpaceItem 
                   nz-button nzType="default" 
                   [routerLink]="['/documents', document()!.id, 'view']">
                  <span nz-icon nzType="eye" nzTheme="outline"></span>
                  View File
                </a>
              </ng-container>
            </nz-space>
          </nz-page-header-extra>
        </nz-page-header>

        <!-- Main Content Tabs -->
        <nz-card class="content-card">
          <nz-tabset>
            <!-- Details Tab -->
            <nz-tab nzTitle="Details">
              <div class="tab-content">
                <!-- Primary File Section -->
                <div class="detail-section">
                  <h3 nz-typography nzType="secondary">Primary File</h3>
                  <div class="primary-file-actions">
                    <div *ngIf="document()!.storageKey; else noFileTemplate" class="file-info">
                      <span nz-icon nzType="file-pdf" nzTheme="twotone" [nzTwotoneColor]="'#ff4d4f'" style="font-size: 24px; margin-right: 8px;"></span>
                      <span>{{ document()!.title }}</span>
                      <nz-space style="margin-left: 16px;">
                        <button *nzSpaceItem nz-button nzType="primary" nzSize="small" (click)="downloadLatestPrimaryFile(document()!)">
                          <span nz-icon nzType="download" nzTheme="outline"></span>
                          Download
                        </button>
                        <nz-upload *nzSpaceItem
                          [nzBeforeUpload]="beforeUpload"
                          [nzShowUploadList]="false">
                          <button nz-button nzType="default" nzSize="small">
                            <span nz-icon nzType="upload" nzTheme="outline"></span>
                            Upload New Version
                          </button>
                        </nz-upload>
                      </nz-space>
                    </div>
                    <ng-template #noFileTemplate>
                      <nz-alert 
                        nzType="warning" 
                        nzMessage="No file uploaded"
                        nzDescription="Upload a primary file to complete this document"
                        [nzShowIcon]="true"
                        style="margin-bottom: 16px;">
                      </nz-alert>
                      <nz-upload
                        [nzBeforeUpload]="beforeUpload"
                        [nzShowUploadList]="false">
                        <button nz-button nzType="primary">
                          <span nz-icon nzType="upload" nzTheme="outline"></span>
                          Upload Primary File
                        </button>
                      </nz-upload>
                    </ng-template>
                  </div>
                </div>

                <!-- Description -->
                <div *ngIf="document()!.description" class="detail-section">
                  <h3 nz-typography nzType="secondary">Description</h3>
                  <p nz-typography>{{ document()!.description }}</p>
                </div>

                <!-- Metadata -->
                <div class="detail-section">
                  <h3 nz-typography nzType="secondary">Document Information</h3>
                  <nz-descriptions nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
                    <nz-descriptions-item nzTitle="ID">{{ document()!.id }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Resource Type">
                      <nz-tag nzColor="blue">{{ document()!.resourceType?.name || 'N/A' }}</nz-tag>
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Resource Code">{{ document()!.resourceCode }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Status">
                      <nz-tag [nzColor]="getStatusColor(document()!.status)">{{ document()!.status }}</nz-tag>
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Created By">{{ document()!.owner?.username || document()!.owner?.email || 'System' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Created At">{{ document()!.createdAt | date:'medium' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Updated At">{{ document()!.updatedAt | date:'medium' }}</nz-descriptions-item>
                  </nz-descriptions>
                </div>

                <!-- Field Values -->
                <div *ngIf="document()!.fieldValues && getFieldValueKeys(document()!.fieldValues).length > 0" class="detail-section">
                  <h3 nz-typography nzType="secondary">Custom Fields</h3>
                  <div class="field-values-grid">
                    <div *ngFor="let item of document()!.fieldValues | keyvalue" class="field-value-item">
                      <div class="field-value-label">{{ item.key }}</div>
                      <div class="field-value-content">{{ formatFieldValue(item.value) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </nz-tab>

            <!-- Related Documents Tab -->
            <nz-tab nzTitle="Related Documents">
              <div class="tab-content">
                <nz-spin *ngIf="isLoadingRelated()" nzSimple></nz-spin>
                
                <div *ngIf="!isLoadingRelated()">
                  <!-- Parent Document -->
                  <div *ngIf="relatedDocuments()?.parent" class="detail-section">
                    <h3 nz-typography nzType="secondary">Parent Document</h3>
                    <nz-card nzHoverable [routerLink]="['/documents', relatedDocuments()!.parent!.id]" class="related-doc-card">
                      <div class="flex items-center">
                        <nz-avatar nzIcon="folder" [nzSize]="48" style="background-color: #1890ff;"></nz-avatar>
                        <div class="ml-4">
                          <h4 nz-typography style="margin: 0;">{{ relatedDocuments()!.parent!.title }}</h4>
                          <p nz-typography nzType="secondary" style="margin: 0;">
                            {{ relatedDocuments()!.parent!.resourceCode }} | {{ relatedDocuments()!.parent!.resourceTypeName }}
                          </p>
                        </div>
                      </div>
                    </nz-card>
                  </div>

                  <!-- Child Documents -->
                  <div *ngIf="relatedDocuments()?.children && relatedDocuments()!.children!.length > 0" class="detail-section">
                    <h3 nz-typography nzType="secondary">Child Documents ({{ relatedDocuments()!.children!.length }})</h3>
                    <div class="children-grid">
                      <nz-card *ngFor="let child of relatedDocuments()!.children" 
                               nzHoverable 
                               [routerLink]="['/documents', child.id]" 
                               class="related-doc-card">
                        <div class="flex items-center">
                          <nz-avatar nzIcon="file" [nzSize]="40" style="background-color: #52c41a;"></nz-avatar>
                          <div class="ml-3">
                            <h5 nz-typography style="margin: 0; font-size: 14px;">{{ child.title }}</h5>
                            <p nz-typography nzType="secondary" style="margin: 0; font-size: 12px;">
                              {{ child.resourceCode }} | {{ child.resourceTypeName }}
                            </p>
                          </div>
                        </div>
                      </nz-card>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <nz-empty *ngIf="!relatedDocuments()?.parent && (!relatedDocuments()?.children || relatedDocuments()!.children!.length === 0)"
                            nzNotFoundImage="simple"
                            [nzNotFoundContent]="'No related documents found'">
                  </nz-empty>
                </div>
              </div>
            </nz-tab>

            <!-- Reminders Tab -->
            <nz-tab nzTitle="Reminders">
              <div class="tab-content">
                <div class="detail-section">
                  <div class="flex justify-between items-center mb-4">
                    <h3 nz-typography nzType="secondary" style="margin: 0;">Document Reminders</h3>
                    <button nz-button nzType="primary" (click)="openReminderDialog()">
                      <span nz-icon nzType="plus" nzTheme="outline"></span>
                      Add Reminder
                    </button>
                  </div>

                  <nz-list *ngIf="reminders.length > 0; else noReminders" [nzDataSource]="reminders" [nzRenderItem]="reminderItem">
                    <ng-template #reminderItem let-reminder>
                      <nz-list-item [nzActions]="[editAction, deleteAction]">
                        <ng-template #editAction>
                          <button *ngIf="canEditOrDelete(reminder)" nz-button nzType="link" (click)="openReminderDialog(reminder)">
                            <span nz-icon nzType="edit" nzTheme="outline"></span>
                          </button>
                        </ng-template>
                        <ng-template #deleteAction>
                          <button *ngIf="canEditOrDelete(reminder)" nz-button nzType="link" nzDanger (click)="deleteReminder(reminder)">
                            <span nz-icon nzType="delete" nzTheme="outline"></span>
                          </button>
                        </ng-template>
                        <nz-list-item-meta>
                          <nz-list-item-meta-title>
                            {{ reminder.message }}
                          </nz-list-item-meta-title>
                          <nz-list-item-meta-description>
                            <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
                            {{ reminder.remindAt | date:'short' }}
                            <span *ngIf="isAdmin"> | User: {{ getUsername(reminder.userId) }}</span>
                            <nz-tag [nzColor]="reminder.sent ? 'success' : 'warning'" style="margin-left: 8px;">
                              {{ reminder.sent ? 'Sent' : 'Pending' }}
                            </nz-tag>
                          </nz-list-item-meta-description>
                        </nz-list-item-meta>
                      </nz-list-item>
                    </ng-template>
                  </nz-list>

                  <ng-template #noReminders>
                    <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'No reminders set for this document'"></nz-empty>
                  </ng-template>
                </div>
              </div>
            </nz-tab>

            <!-- Versions Tab -->
            <nz-tab nzTitle="Version History">
              <div class="tab-content">
                <div class="detail-section">
                  <div *ngIf="!versionsLoaded && !versionsLoading" class="text-center">
                    <button nz-button nzType="primary" (click)="loadVersions()">
                      <span nz-icon nzType="history" nzTheme="outline"></span>
                      Load Version History
                    </button>
                  </div>

                  <nz-spin *ngIf="versionsLoading" nzSimple nzTip="Loading versions..."></nz-spin>

                  <nz-timeline *ngIf="versionsLoaded && versions.length > 0">
                    <nz-timeline-item *ngFor="let version of versions" [nzColor]="version.versionNo === versions[0].versionNo ? 'green' : 'gray'">
                      <nz-card>
                        <h4 nz-typography>
                          Version {{ version.versionNo }}
                          <nz-tag *ngIf="version.versionNo === versions[0].versionNo" nzColor="success" style="margin-left: 8px;">Current</nz-tag>
                        </h4>
                        <nz-descriptions [nzColumn]="1" nzSize="small">
                          <nz-descriptions-item nzTitle="Created">{{ version.createdAt | date:'medium' }}</nz-descriptions-item>
                          <nz-descriptions-item nzTitle="Size">{{ version.sizeBytes | fileSize }}</nz-descriptions-item>
                          <nz-descriptions-item nzTitle="Checksum">
                            <span class="text-xs font-mono">{{ version.checksumSha256 ? version.checksumSha256.substring(0, 16) + '...' : 'N/A' }}</span>
                          </nz-descriptions-item>
                        </nz-descriptions>
                        <nz-space style="margin-top: 12px;">
                          <button *nzSpaceItem nz-button nzType="primary" nzSize="small" (click)="downloadVersionFile(version.versionNo)">
                            <span nz-icon nzType="download" nzTheme="outline"></span>
                            Download
                          </button>
                          <a *nzSpaceItem nz-button nzType="default" nzSize="small" 
                             [routerLink]="['/documents', documentId(), 'versions', version.versionNo, 'view']">
                            <span nz-icon nzType="eye" nzTheme="outline"></span>
                            View
                          </a>
                        </nz-space>
                      </nz-card>
                    </nz-timeline-item>
                  </nz-timeline>

                  <nz-empty *ngIf="versionsLoaded && versions.length === 0" 
                            nzNotFoundImage="simple" 
                            [nzNotFoundContent]="'No version history available'">
                  </nz-empty>
                </div>
              </div>
            </nz-tab>
          </nz-tabset>
        </nz-card>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading() && !document()" class="error-container">
        <nz-card>
          <nz-empty
            nzNotFoundImage="simple"
            [nzNotFoundContent]="errorContent">
            <ng-template #errorContent>
              <h2>Document Not Found</h2>
              <p>The document you are looking for does not exist or could not be loaded.</p>
              <button nz-button nzType="primary" routerLink="/documents">
                <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                Back to Documents
              </button>
            </ng-template>
          </nz-empty>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .document-detail-container {
      padding: 0;
      background: transparent;
    }

    .loading-container, .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .content-card {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .detail-section {
      background: #fafafa;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .primary-file-actions {
      margin-top: 16px;
    }

    .file-info {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .field-values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .field-value-item {
      background: #fff;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #f0f0f0;
    }

    .field-value-label {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .field-value-content {
      color: rgba(0, 0, 0, 0.85);
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;
    }

    .related-doc-card {
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 12px;
    }

    .related-doc-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .children-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    ::ng-deep .ant-page-header {
      background: #fff;
      padding: 16px 24px;
      margin: -24px -24px 0;
    }

    ::ng-deep .ant-page-header-heading-extra {
      margin: 0;
    }

    ::ng-deep .ant-tabs-nav {
      margin-bottom: 0;
    }

    ::ng-deep .ant-timeline-item-content {
      min-height: auto;
    }

    ::ng-deep .ant-descriptions-item-label {
      font-weight: 500;
    }
  `],
  providers: [NzMessageService]
})
export class DocumentDetailPageComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private reminderService = inject(ReminderService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private modal = inject(NzModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private message = inject(NzMessageService);
  private http = inject(HttpClient);

  isLoading = signal(true);
  document: WritableSignal<Document | null> = signal(null);
  documentId = signal<number | null>(null);
  apiBaseUrl = environment.apiBase;
  
  // Related documents
  relatedDocuments = signal<RelatedDocuments | null>(null);
  isLoadingRelated = signal(false);
  
  // Versions
  versions: DocumentVersion[] = [];
  versionsLoaded = false;
  versionsLoading = false;
  private versionsSub?: Subscription;
  private relatedSub?: Subscription;

  reminders: ReminderDTO[] = [];
  isAdmin = false;
  currentUserId: number | null = null;
  userMap: { [id: number]: string } = {};

  // File upload handler
  beforeUpload = (file: any): boolean => {
    if (this.documentId()) {
      const loading = this.message.loading('Uploading new version...', { nzDuration: 0 });
      this.documentService.uploadNewPrimaryVersion(this.documentId()!, file).subscribe({
        next: () => {
          this.message.remove(loading.messageId);
          this.message.success('New version uploaded successfully');
          this.loadDocument(this.documentId()!);
          this.versions = [];
          this.versionsLoaded = false;
        },
        error: (err) => {
          this.message.remove(loading.messageId);
          this.message.error('Failed to upload new version: ' + (err.error?.message || err.message));
        }
      });
    }
    return false;
  };

  ngOnInit(): void {
    const user = this.authService.currentUserSignal();
    this.isAdmin = !!user?.roles?.includes('SYS_ADMIN');
    this.currentUserId = user?.id ?? null;

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocument(+id);
        this.loadRelatedDocuments(+id);
        this.loadReminders(+id);
      } else {
        this.isLoading.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  loadDocument(id: number): void {
    this.isLoading.set(true);
    this.documentService.get(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.document.set(null);
        this.snackbar.error('Failed to load document: ' + (err.error?.message || err.message));
      }
    });
  }

  loadRelatedDocuments(id: number): void {
    this.isLoadingRelated.set(true);
    this.relatedSub = this.documentService.getRelatedDocuments(id).subscribe({
      next: (related) => {
        this.relatedDocuments.set(related);
        this.isLoadingRelated.set(false);
      },
      error: (err) => {
        this.isLoadingRelated.set(false);
        this.snackbar.error('Failed to load related documents: ' + (err.error?.message || err.message));
      }
    });
  }

  loadReminders(documentId: number): void {
    this.reminderService.getForDocument(documentId).subscribe({
      next: reminders => {
        this.reminders = reminders || [];
        if (this.isAdmin && this.reminders.length > 0) {
          // For admin, fetch user names for display
          this.reminders.forEach(r => {
            if (r.userId && !this.userMap[r.userId]) {
              // Use HTTP directly like in the working version
              this.http.get<any>(`${environment.apiBase}/users/${r.userId}`).subscribe({
                next: (u) => {
                  this.userMap[r.userId!] = u.username;
                },
                error: () => {
                  this.userMap[r.userId!] = `User ${r.userId}`;
                }
              });
            }
          });
        }
      },
      error: err => {
        this.reminders = [];
        this.message.error('Failed to load reminders: ' + (err.error?.message || err.message));
      }
    });
  }

  downloadLatestPrimaryFile(doc: Document): void {
    if (!doc || !doc.id || !doc.storageKey) return;
    this.documentService.downloadLatestPrimaryFile(doc.id, doc.storageKey).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title || `document_${doc.id}_latest`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download file: ' + (err.error?.message || err.message));
      }
    });
  }

  getFieldValueKeys(fieldValues: Record<string, any>): string[] {
    return Object.keys(fieldValues || {});
  }

  formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  loadVersions(): void {
    if (!this.documentId() || this.versionsLoading) return;
    
    this.versionsLoading = true;
    this.versionsSub = this.documentService.getVersions(this.documentId()!).subscribe({
      next: (versions) => {
        this.versions = versions;
        this.versionsLoaded = true;
        this.versionsLoading = false;
      },
      error: (err) => {
        this.versionsLoading = false;
        this.snackbar.error('Failed to load versions: ' + (err.error?.message || err.message));
      }
    });
  }

  downloadVersionFile(versionNo: number): void {
    if (!this.documentId()) return;
    
    this.documentService.downloadVersionFile(this.documentId()!, versionNo).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.document()?.title || 'document'}_v${versionNo}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        this.snackbar.error('Failed to download version: ' + (err.error?.message || err.message));
      }
    });
  }

  openReminderDialog(reminder?: ReminderDTO) {
    const modalRef = this.modal.create({
      nzTitle: reminder ? 'Edit Reminder' : 'Add Reminder',
      nzContent: ReminderDialogComponent,
      nzData: {
        documentId: this.documentId(),
        reminder: reminder,
        isAdmin: this.isAdmin
      },
      nzWidth: '500px',
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result: ReminderDTO | undefined) => {
      if (result) {
        // Save the reminder
        if (reminder?.id) {
          // Update existing reminder
          this.reminderService.update(reminder.id, result).subscribe({
            next: () => {
              this.message.success('Reminder updated successfully');
              this.loadReminders(this.documentId()!);
            },
            error: (err) => {
              this.message.error('Failed to update reminder: ' + (err.error?.message || err.message));
            }
          });
        } else {
          // Create new reminder
          this.reminderService.create(result).subscribe({
            next: () => {
              this.message.success('Reminder created successfully');
              this.loadReminders(this.documentId()!);
            },
            error: (err) => {
              this.message.error('Failed to create reminder: ' + (err.error?.message || err.message));
            }
          });
        }
      }
    });
  }

  deleteReminder(reminder: ReminderDTO) {
    if (!reminder.id) return;
    
    if (confirm('Are you sure you want to delete this reminder?')) {
      this.reminderService.delete(reminder.id).subscribe({
        next: () => {
          this.message.success('Reminder deleted successfully');
          this.loadReminders(this.documentId()!);
        },
        error: (err) => {
          this.message.error('Failed to delete reminder: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  canEditOrDelete(reminder: ReminderDTO): boolean {
    return this.isAdmin || reminder.userId === this.currentUserId;
  }

  getUsername(userId: number | undefined): string {
    if (!userId) return 'Unknown';
    return this.userMap[userId] || `User ${userId}`;
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'default';
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'ARCHIVED': 'warning',
      'DELETED': 'error'
    };
    return statusColors[status] || 'default';
  }

  navigateBack(): void {
    this.router.navigate(['/documents']);
  }

  ngOnDestroy(): void {
    this.versionsSub?.unsubscribe();
    this.relatedSub?.unsubscribe();
  }
}
