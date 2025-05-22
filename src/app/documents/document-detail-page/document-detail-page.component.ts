import { Component, OnInit, inject, signal, WritableSignal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DocumentService } from '../../core/services/document.service';
import { Document, Attachment, RelatedDocuments, DocumentVersion } from '../../core/models/document.model';
import { SnackbarService } from '../../core/services/snackbar.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { environment } from '../../../environments/environment';
import { ReminderService, ReminderDTO } from '../../core/services/reminder.service';
import { ReminderDialogComponent } from '../components/reminder-dialog/reminder-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    FileSizePipe,
    MatDatepickerModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else {
        @if (document(); as doc) {
          @if(doc) {
            <mat-card class="mb-6">
              <mat-card-header class="!pb-2">
                <mat-card-title class="text-2xl font-semibold flex flex-col gap-1">
                  {{ doc.title }}
                  <span class="text-base font-normal text-gray-600">Resource Code: {{ doc.resourceCode }}</span>
                </mat-card-title>
                <mat-card-subtitle>
                  Resource Type: {{ doc.resourceType?.name || doc.resourceType?.code || 'N/A' }}
                </mat-card-subtitle>
                <div class="flex-grow"></div>
                <div class="actions flex gap-2">
                  <button mat-stroked-button color="primary" [routerLink]="['/documents', doc.id, 'edit']">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-stroked-button [routerLink]="['/documents', doc.id, 'acl']">
                    <mat-icon>security</mat-icon> Manage ACL
                  </button>
                  <button mat-stroked-button routerLink="/documents">
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                </div>
              </mat-card-header>
              <mat-card-content>
                <mat-tab-group animationDuration="0ms" class="mt-4">
                  <mat-tab label="Details">
                    <div class="p-4">
                      <div class="mb-4 flex items-center gap-2">
                        <mat-icon color="primary">description</mat-icon>
                        <span class="font-semibold">Primary File:</span>
                        @if (doc.storageKey) {
                          <button mat-stroked-button color="primary" (click)="downloadLatestPrimaryFile(doc)">
                            <mat-icon>download</mat-icon> Download Current Version
                          </button>
                          <a mat-stroked-button color="accent" [routerLink]="['/documents', doc.id, 'view']">
                            <mat-icon>visibility</mat-icon> View Document
                          </a>
                        } @else {
                          <span class="text-gray-500">No file uploaded yet.</span>
                        }
                        <label class="ml-4">
                          <input type="file" hidden (change)="onPrimaryFileSelected($event)" #fileInput />
                          <button mat-stroked-button color="accent" type="button" (click)="fileInput.click()">
                            <mat-icon>upload</mat-icon> Upload Primary File
                          </button>
                        </label>
                      </div>
                      @if (doc.description) {
                        <p class="text-gray-700 mb-4">{{ doc.description }}</p>
                      }
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                        <div><strong>ID:</strong> {{ doc.id }}</div>
                        <div><strong>Resource Type:</strong> {{ doc.resourceType?.name || doc.resourceType?.code || 'N/A' }}</div>
                        <div><strong>Resource Code:</strong> {{ doc.resourceCode }}</div>
                        <div><strong>Status:</strong> {{ doc.status }}</div>
                        <div><strong>Created By:</strong> {{ doc.owner?.username || doc.owner?.email || 'System' }}</div>
                        <div><strong>Created At:</strong> {{ doc.createdAt | date:'medium' }}</div>
                        <div><strong>Updated At:</strong> {{ doc.updatedAt | date:'medium' }}</div>
                      </div>
                      @if (doc.fieldValues && getFieldValueKeys(doc.fieldValues).length > 0) {
                        <div class="mb-4">
                          <h3 class="text-lg font-medium mb-2">Field Values</h3>
                          <mat-list role="list">
                            @for (item of doc.fieldValues | keyvalue; track item.key) {
                              <mat-list-item role="listitem" class="h-auto py-2">
                                <div matListItemTitle class="font-semibold">{{ item.key }}:</div>
                                <div matListItemLine class="whitespace-pre-wrap">{{ formatFieldValue(item.value) }}</div>
                              </mat-list-item>
                              <mat-divider></mat-divider>
                            }
                          </mat-list>
                        </div>
                      }
                    </div>
                  </mat-tab>

                  <mat-tab label="Related Documents">
                    <div class="p-4">
                      @if (isLoadingRelated()) {
                        <div class="flex justify-center items-center min-h-[100px]">
                          <mat-spinner diameter="40"></mat-spinner>
                        </div>
                      } @else {
                        @if (relatedDocuments()?.parent) {
                          <div class="mb-6">
                            <h3 class="text-lg font-medium mb-3">Parent Document</h3>
                            <mat-card class="mb-2 cursor-pointer hover:shadow-md transition-shadow" 
                                    [routerLink]="['/documents', relatedDocuments()?.parent?.id]">
                              <mat-card-header>
                                <mat-icon mat-card-avatar>folder</mat-icon>
                                <mat-card-title>{{ relatedDocuments()?.parent?.title }}</mat-card-title>
                                <mat-card-subtitle>{{ relatedDocuments()?.parent?.resourceCode }} | {{ relatedDocuments()?.parent?.resourceTypeName }}</mat-card-subtitle>
                              </mat-card-header>
                            </mat-card>
                          </div>
                        }

                        @if (relatedDocuments()?.children && (relatedDocuments()?.children?.length ?? 0) > 0) {
                          <div>
                            <h3 class="text-lg font-medium mb-3">Child Documents</h3>
                            @for (child of relatedDocuments()?.children || []; track child.id) {
                              <mat-card class="mb-2 cursor-pointer hover:shadow-md transition-shadow" 
                                      [routerLink]="['/documents', child.id]">
                                <mat-card-header>
                                  <mat-icon mat-card-avatar>description</mat-icon>
                                  <mat-card-title>{{ child.title }}</mat-card-title>
                                  <mat-card-subtitle>{{ child.resourceCode }} | {{ child.resourceTypeName }}</mat-card-subtitle>
                                </mat-card-header>
                              </mat-card>
                            }
                          </div>
                        } @else if (!relatedDocuments()?.parent) {
                          <div class="text-center p-6 text-gray-500">
                            <mat-icon class="text-4xl mb-2">share</mat-icon>
                            <p>No related documents found.</p>
                          </div>
                        }
                      }
                    </div>
                  </mat-tab>

                  <mat-tab label="Reminders">
                    <div class="p-4">
                      <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium">Reminders</h3>
                        <button mat-raised-button color="primary" (click)="openReminderDialog()">
                          <mat-icon>add</mat-icon> Add Reminder
                        </button>
                      </div>
                      <mat-list *ngIf="reminders.length > 0; else noReminders">
                        <mat-list-item *ngFor="let r of reminders">
                          <div matListItemTitle>
                            {{ r.message }}
                          </div>
                          <div matListItemLine>
                            Remind At: {{ r.remindAt | date:'short' }}
                            <ng-container *ngIf="isAdmin">
                              &nbsp;|&nbsp; User: {{ getUsername(r.userId) }}
                            </ng-container>
                            &nbsp;|&nbsp;
                            <mat-chip [color]="r.sent ? 'primary' : 'warn'" selected>
                              {{ r.sent ? 'Sent' : 'Pending' }}
                            </mat-chip>
                          </div>
                          <div matListItemMeta *ngIf="canEditOrDelete(r)">
                            <button mat-icon-button (click)="openReminderDialog(r)"><mat-icon>edit</mat-icon></button>
                            <button mat-icon-button color="warn" (click)="deleteReminder(r)"><mat-icon>delete</mat-icon></button>
                          </div>
                        </mat-list-item>
                      </mat-list>
                      <ng-template #noReminders>
                        <div class="text-gray-500 text-center p-6">
                          <mat-icon class="text-4xl mb-2">event_busy</mat-icon>
                          <p>No reminders for this document.</p>
                        </div>
                      </ng-template>
                    </div>
                  </mat-tab>

                  <mat-tab label="Versions">
                    <div class="p-4">
                      @if (versionsLoading) {
                        <div class="flex justify-center items-center min-h-[100px]">
                          <mat-spinner diameter="40"></mat-spinner>
                        </div>
                      } @else if (!versionsLoaded) {
                        <div class="text-center p-4">
                          <button mat-stroked-button color="primary" (click)="loadVersions()">
                            <mat-icon>history</mat-icon> Load Version History
                          </button>
                        </div>
                      } @else if (versions.length > 0) {
                        <div class="version-list">
                          @for (version of versions; track version.versionNo) {
                            <mat-card class="mb-3">
                              <mat-card-header>
                                <mat-icon mat-card-avatar>history</mat-icon>
                                <mat-card-title>Version {{ version.versionNo }}</mat-card-title>
                                <mat-card-subtitle>Created: {{ version.createdAt | date:'medium' }}</mat-card-subtitle>
                              </mat-card-header>
                              <mat-card-content>
                                <div class="py-2">
                                  <div><strong>Size:</strong> {{ version.sizeBytes | fileSize }}</div>
                                  <div class="text-xs text-gray-500 truncate"><strong>Checksum:</strong> {{ version.checksumSha256 }}</div>
                                </div>
                                @if (version.attachments && version.attachments.length > 0) {
                                  <div class="mt-2">
                                    <h4 class="text-sm font-medium mb-1">Attachments ({{ version.attachments.length }})</h4>
                                    <mat-list role="list">
                                      @for (attachment of version.attachments; track attachment.id) {
                                        <mat-list-item role="listitem" class="h-auto py-1">
                                          <div matListItemTitle class="text-sm">{{ attachment.fileName }}</div>
                                          <div matListItemLine class="text-xs text-gray-500">
                                            {{ attachment.sizeBytes | fileSize }} | {{ attachment.mimeType }}
                                          </div>
                                        </mat-list-item>
                                      }
                                    </mat-list>
                                  </div>
                                }
                              </mat-card-content>
                              <mat-card-actions>
                                <button mat-button color="primary" (click)="downloadVersionFile(version.versionNo)">
                                  <mat-icon>download</mat-icon> Download
                                </button>
                                <a mat-button color="accent" [routerLink]="['/documents', documentId(), 'versions', version.versionNo, 'view']">
                                  <mat-icon>visibility</mat-icon> View
                                </a>
                              </mat-card-actions>
                            </mat-card>
                          }
                        </div>
                      } @else {
                        <div class="text-center p-6 text-gray-500">
                          <mat-icon class="text-4xl mb-2">history</mat-icon>
                          <p>No version history available.</p>
                        </div>
                      }
                    </div>
                  </mat-tab>

                  <mat-tab label="Attachments">
                    <div class="p-4">
                      @if (doc.attachments && doc.attachments.length) {
                        <mat-list role="list">
                          @for (attachment of doc.attachments; track attachment.id) {
                            <mat-list-item role="listitem" class="h-auto py-2">
                              <mat-icon matListItemIcon>attachment</mat-icon>
                              <div matListItemTitle class="font-medium">{{ attachment.fileName }}</div>
                              <div matListItemLine class="text-xs text-gray-500">
                                Size: {{ attachment.fileSize | fileSize }} | Type: {{ attachment.contentType }}
                              </div>
                              <div matListItemMeta>
                                <button mat-icon-button (click)="downloadAttachment(attachment.id, attachment.fileName)" matTooltip="Download {{attachment.fileName}}">
                                  <mat-icon>download</mat-icon>
                                </button>
                                <button mat-icon-button (click)="viewAttachment(attachment.id)" matTooltip="View {{attachment.fileName}}">
                                  <mat-icon>visibility</mat-icon>
                                </button>
                              </div>
                            </mat-list-item>
                            <mat-divider></mat-divider>
                          }
                        </mat-list>
                      } @else {
                        <div class="text-center p-6 text-gray-500">
                          <mat-icon class="text-4xl mb-2">attach_file</mat-icon>
                          <p>No attachments for this document.</p>
                        </div>
                      }
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </mat-card-content>
            </mat-card>
          } @else {
            <mat-card class="text-center p-8">
              <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
              <h2 class="text-2xl font-semibold mt-4 mb-2">Document Not Found</h2>
              <p class="text-gray-600 mb-6">The document you are looking for does not exist or could not be loaded.</p>
              <button mat-stroked-button routerLink="/documents">
                <mat-icon>arrow_back</mat-icon> Back to Documents List
              </button>
            </mat-card>
          }
        } @else {
          <mat-card class="text-center p-8">
            <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
            <h2 class="text-2xl font-semibold mt-4 mb-2">Document data is unavailable</h2>
            <button mat-stroked-button routerLink="/documents">
              <mat-icon>arrow_back</mat-icon> Back to Documents List
            </button>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    mat-list-item {
      height: auto !important; /* Override default fixed height */
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }
    .mat-mdc-list-item-unscoped-content {
      width: 100%;
    }
  `]
})
export class DocumentDetailPageComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private reminderService = inject(ReminderService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

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
        this.reminders = reminders;
        if (this.isAdmin) {
          // For admin, fetch user names for display
          this.reminders.forEach(r => {
            if (r.userId && !this.userMap[r.userId]) {
              // Fetch user info (ideally batch, but for now per user)
              // You may want to optimize this in production
              this.documentService['http'].get<any>(`${environment.apiBase}/users/${r.userId}`).subscribe(u => {
                this.userMap[r.userId!] = u.username;
              });
            }
          });
        }
      },
      error: err => {
        this.reminders = [];
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

  downloadAttachment(attachmentId: number, fileName: string): void {
    this.documentService.downloadAttachment(attachmentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download attachment: ' + (err.error?.message || err.message));
      }
    });
  }

  viewAttachment(attachmentId: number): void {
    // Open the attachment view endpoint in a new tab
    window.open(this.documentService.getAttachmentViewUrl(attachmentId), '_blank');
  }

  onPrimaryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.documentId()) {
      const file = input.files[0];
      this.documentService.uploadNewPrimaryVersion(this.documentId()!, file).subscribe({
        next: () => {
          this.snackbar.success('New version uploaded successfully.');
          this.loadDocument(this.documentId()!); // Refresh document details
          this.versions = []; // Reset versions
          this.versionsLoaded = false;
        },
        error: (err) => {
          this.snackbar.error('Failed to upload new version: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  getAttachmentDownloadUrl(attachment: Attachment): string {
    if (!this.documentId()) return '#';
    return `${this.apiBaseUrl}/documents/${this.documentId()}/files/${attachment.storageKey}`;
  }

  getFieldValueKeys(fieldValues: Record<string, any>): string[] {
    return Object.keys(fieldValues || {});
  }

  formatFieldValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') { 
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string' && value.startsWith('http')) {
        return value;
    }
    return String(value);
  }

  loadVersions(): void {
    if (!this.documentId()) return;
    this.versionsLoading = true;
    this.versionsSub = this.documentService
      .getVersions(this.documentId()!)
      .subscribe({
        next: (data) => {
          this.versions = data;
          this.versionsLoaded = true;
          this.versionsLoading = false;
        },
        error: () => {
          this.versions = [];
          this.versionsLoaded = true;
          this.versionsLoading = false;
        }
      });
  }

  downloadVersionFile(versionNo: number): void {
    if (!this.documentId()) return;
    
    this.documentService.downloadVersionFile(this.documentId()!, versionNo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Get filename from the document title or use a default
        const doc = this.document();
        a.download = doc ? `${doc.title}_v${versionNo}` : `document_${this.documentId()}_v${versionNo}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackbar.error('Failed to download version: ' + (err.error?.message || err.message));
      }
    });
  }

  openReminderDialog(reminder?: ReminderDTO) {
    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      data: {
        reminder,
        documentId: this.documentId(),
        isAdmin: this.isAdmin
      },
      width: '400px'
    });
    dialogRef.afterClosed().subscribe((result: ReminderDTO | undefined) => {
      if (result) {
        if (reminder && reminder.id) {
          // Edit
          this.reminderService.update(reminder.id, result).subscribe({
            next: () => {
              this.snackbar.success('Reminder updated.');
              this.loadReminders(this.documentId()!);
            },
            error: err => {
              this.snackbar.error('Failed to update reminder.');
            }
          });
        } else {
          // Add
          this.reminderService.create(result).subscribe({
            next: () => {
              this.snackbar.success('Reminder created.');
              this.loadReminders(this.documentId()!);
            },
            error: err => {
              this.snackbar.error('Failed to create reminder.');
            }
          });
        }
      }
    });
  }

  deleteReminder(reminder: ReminderDTO) {
    if (!reminder.id) return;
    if (!confirm('Delete this reminder?')) return;
    this.reminderService.delete(reminder.id).subscribe({
      next: () => {
        this.snackbar.success('Reminder deleted.');
        this.loadReminders(this.documentId()!);
      },
      error: err => {
        this.snackbar.error('Failed to delete reminder.');
      }
    });
  }

  canEditOrDelete(reminder: ReminderDTO): boolean {
    return this.isAdmin || (reminder.userId === this.currentUserId);
  }

  getUsername(userId: number | undefined): string {
    if (!userId) return '';
    return this.userMap[userId] || ('User #' + userId);
  }

  ngOnDestroy(): void {
    if (this.versionsSub) this.versionsSub.unsubscribe();
    if (this.relatedSub) this.relatedSub.unsubscribe();
  }
}
