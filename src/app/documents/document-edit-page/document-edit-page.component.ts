import { Component, OnInit, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// Translation imports
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../core/services/translation.service';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Document, UpdateDocumentDto } from '../../core/models/document.model';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-document-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
    NzIconModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzAutocompleteModule,
    NzGridModule,
    NzTypographyModule,
    NzDividerModule,    
    NzAlertModule,
    NzToolTipModule,
    NzListModule,
    FileUploadComponent
  ],
  template: `
    <div class="document-edit-container" [class.rtl]="translationService.isRTL()">
      @if (isLoading()) {
        <div class="loading-container">
          <nz-spin nzSize="large" [nzTip]="'common.loading' | translate"></nz-spin>
        </div>
      } @else if (document()) {
        <form nz-form [formGroup]="editForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
          <nz-card [nzTitle]="'documents.edit.title' | translate">
            <ng-template #titleTemplate>
              <h2>{{ ('documents.edit.title' | translate) + ': ' + document()?.title }}</h2>
            </ng-template>
            
            <div nz-row [nzGutter]="[24, 24]">
              <!-- Basic Information Section -->
              <div nz-col [nzSpan]="24">
                <h3>{{ 'documents.edit.basic_info' | translate }}</h3>
                <nz-divider></nz-divider>
              </div>
              
              <!-- Title Field -->
              <div nz-col [nzSpan]="24">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">{{ 'documents.edit.fields.title' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'documents.edit.validation.title_required' | translate">
                    <input nz-input formControlName="title" [placeholder]="'documents.edit.placeholders.title' | translate">
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Description Field -->
              <div nz-col [nzSpan]="24">
                <nz-form-item>
                  <nz-form-label>{{ 'documents.edit.fields.description' | translate }}</nz-form-label>
                  <nz-form-control>
                    <textarea 
                      nz-input 
                      formControlName="description" 
                      [rows]="4"
                      [placeholder]="'documents.edit.placeholders.description' | translate">
                    </textarea>
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Parent Document Field -->
              <div nz-col [nzSpan]="24">
                <nz-form-item>
                  <nz-form-label>{{ 'documents.edit.fields.parent_document' | translate }}</nz-form-label>
                  <nz-form-control>
                    <input 
                      nz-input 
                      formControlName="parentSearch"
                      [placeholder]="'documents.edit.placeholders.parent_search' | translate"
                      [nzAutocomplete]="parentAuto">
                    <nz-autocomplete #parentAuto [nzDefaultActiveFirstOption]="false">
                      @if (isSearchingParents()) {
                        <nz-auto-option [nzDisabled]="true">
                          <nz-spin nzSize="small"></nz-spin> {{ 'common.searching' | translate }}...
                        </nz-auto-option>
                      } @else if (parentSearchResults().length === 0 && parentSearchQuery().length > 0) {
                        <nz-auto-option [nzDisabled]="true">{{ 'documents.edit.no_documents_found' | translate }}</nz-auto-option>
                      } @else {
                        @for (doc of parentSearchResults(); track doc.id) {
                          <nz-auto-option [nzValue]="displayParentFn(doc)" (selectionChange)="onParentSelected(doc)">
                            {{ doc.title }} ({{ doc.resourceCode }})
                          </nz-auto-option>
                        }
                      }
                    </nz-autocomplete>
                    @if (editForm.get('parentId')?.value) {
                      <span nz-input-group-slot="suffix">
                        <button 
                          nz-button 
                          nzType="text" 
                          nzSize="small"
                          (click)="clearParentSelection()"
                          [nz-tooltip]="'common.clear' | translate">
                          <span nz-icon nzType="close"></span>
                        </button>
                      </span>
                    }
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Tags Field -->
              <div nz-col [nzSpan]="24">
                <nz-form-item>
                  <nz-form-label>{{ 'documents.edit.fields.tags' | translate }}</nz-form-label>
                  <nz-form-control [nzExtra]="'documents.edit.fields.tags_help' | translate">
                    <input 
                      nz-input 
                      formControlName="tags"
                      [placeholder]="'documents.edit.placeholders.tags' | translate">
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Dynamic Metadata Fields -->
              @if (resourceType(); as rt) {
                @if (rt.fields && rt.fields.length > 0) {
                  <div nz-col [nzSpan]="24">
                    <h3>{{ 'documents.edit.metadata_title' | translate }} ({{ rt.code }})</h3>
                    <nz-divider></nz-divider>
                  </div>
                  
                  <div formGroupName="metadata">
                    @for (field of rt.fields; track field.id) {
                      <div nz-col [nzSpan]="24">
                        <ng-container [ngSwitch]="field.kind">
                          <!-- Text Field -->
                          <nz-form-item *ngSwitchCase="FieldType.TEXT">
                            <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                            <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('common.is_required' | translate)">
                              <input nz-input [formControlName]="field.name">
                            </nz-form-control>
                          </nz-form-item>

                          <!-- Number Field -->
                          <nz-form-item *ngSwitchCase="FieldType.NUMBER">
                            <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                            <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('common.is_required' | translate)">
                              <nz-input-number 
                                [formControlName]="field.name" 
                                style="width: 100%">
                              </nz-input-number>
                            </nz-form-control>
                          </nz-form-item>

                          <!-- Date Field -->
                          <nz-form-item *ngSwitchCase="FieldType.DATE">
                            <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                            <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('common.is_required' | translate)">
                              <nz-date-picker 
                                [formControlName]="field.name" 
                                style="width: 100%">
                              </nz-date-picker>
                            </nz-form-control>
                          </nz-form-item>

                          <!-- Boolean Field -->
                          <nz-form-item *ngSwitchCase="FieldType.BOOLEAN">
                            <nz-form-control>
                              <label nz-checkbox [formControlName]="field.name">
                                {{ field.label || field.name }}
                              </label>
                            </nz-form-control>
                          </nz-form-item>

                          <!-- Select Field -->
                          <nz-form-item *ngSwitchCase="FieldType.SELECT">
                            <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                            <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('common.is_required' | translate)">
                              <nz-select [formControlName]="field.name" [nzPlaceHolder]="'common.select_option' | translate">
                                @if(field.options && field.options.length > 0) {
                                  @for (option of field.options; track option) {
                                    <nz-option [nzValue]="option" [nzLabel]="option"></nz-option>
                                  }
                                } @else {
                                  <nz-option [nzDisabled]="true" [nzLabel]="'documents.edit.no_options_available' | translate"></nz-option>
                                }
                              </nz-select>
                            </nz-form-control>
                          </nz-form-item>

                          <!-- Unsupported Field Type -->
                          <nz-form-item *ngSwitchDefault>
                            <nz-form-label>{{ field.label || field.name }} ({{ 'documents.edit.unsupported_type' | translate }}: {{field.kind}})</nz-form-label>
                            <nz-form-control>
                              <input nz-input [formControlName]="field.name" readonly>
                            </nz-form-control>
                          </nz-form-item>
                        </ng-container>
                      </div>
                    }
                  </div>
                }
              }

              <!-- Existing Attachments -->
              @if (document()?.attachments && document()!.attachments.length > 0) {
                <div nz-col [nzSpan]="24">
                  <h3>{{ 'documents.edit.existing_attachments' | translate }}</h3>
                  <nz-divider></nz-divider>
                  
                  <nz-list nzItemLayout="horizontal">
                    @for (att of document()?.attachments; track att.id; let i = $index) {
                      <nz-list-item>
                        <nz-list-item-meta>
                          <nz-list-item-meta-avatar>
                            <span nz-icon nzType="file-text" nzTheme="outline"></span>
                          </nz-list-item-meta-avatar>
                          <nz-list-item-meta-title>
                            <a [href]="getAttachmentDownloadUrl(att.storageKey)" target="_blank" class="link">
                              {{ att.fileName }}
                            </a>
                          </nz-list-item-meta-title>
                        </nz-list-item-meta>
                        <ul nz-list-item-actions>
                          <nz-list-item-action>
                            <button 
                              nz-button 
                              nzType="text" 
                              nzDanger
                              (click)="markAttachmentForRemoval(att.id, i)" 
                              [nz-tooltip]="'documents.edit.remove_attachment' | translate">
                              <span nz-icon nzType="delete" nzTheme="outline"></span>
                            </button>
                          </nz-list-item-action>
                        </ul>
                      </nz-list-item>
                    }
                  </nz-list>
                </div>
              } @else {
                <div nz-col [nzSpan]="24">
                  <nz-alert 
                    nzType="info" 
                    [nzMessage]="'documents.edit.no_existing_attachments' | translate"
                    nzShowIcon>
                  </nz-alert>
                </div>
              }

              <!-- File Upload for New Attachments -->
              <div nz-col [nzSpan]="24">
                <h3>{{ 'documents.edit.add_new_attachments' | translate }}</h3>
                <nz-divider></nz-divider>
                
                <app-file-upload 
                  (filesChanged)="onNewAttachmentsChanged($event)" 
                  [multiple]="true"
                  [title]="'documents.edit.upload_title' | translate"
                  [subtitle]="'documents.edit.upload_subtitle' | translate">
                </app-file-upload>
                
                @if (newAttachments().length > 0) {
                  <nz-alert
                    nzType="success"
                    [nzMessage]="newAttachments().length + ' ' + ('documents.edit.files_selected' | translate)"
                    nzShowIcon
                    style="margin-top: 16px;">
                  </nz-alert>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <nz-divider></nz-divider>
            <div class="action-buttons" [class.rtl-actions]="translationService.isRTL()">
              <button nz-button nzType="default" (click)="cancelEdit()">
                <span nz-icon nzType="close"></span>
                {{ 'common.cancel' | translate }}
              </button>
              <button 
                nz-button 
                nzType="primary" 
                nzHtmlType="submit" 
                [nzLoading]="isSubmitting()"
                [disabled]="editForm.invalid">
                <span nz-icon nzType="save"></span>
                {{ 'documents.edit.save_changes' | translate }}
              </button>
            </div>
          </nz-card>
        </form>
      } @else {
        <!-- Error State -->
        <nz-card>
          <div class="error-state">
            <span nz-icon nzType="exclamation-circle" nzTheme="outline" class="error-icon"></span>
            <h2>{{ 'documents.edit.document_not_found' | translate }}</h2>
            <p>{{ 'documents.edit.document_not_found_description' | translate }}</p>
            <button nz-button nzType="default" routerLink="/documents">
              <span nz-icon nzType="arrow-left"></span>
              {{ 'documents.edit.back_to_documents' | translate }}
            </button>
          </div>
        </nz-card>
      }
    </div>
  `,
  styles: [`
    .document-edit-container {
      padding: 24px;
      background: #f0f2f5;
      min-height: 100vh;
    }

    .document-edit-container.rtl {
      direction: rtl;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .action-buttons.rtl-actions {
      justify-content: flex-start;
      flex-direction: row-reverse;
    }

    .error-state {
      text-align: center;
      padding: 48px 24px;
    }

    .error-icon {
      font-size: 64px;
      color: #ff4d4f;
      margin-bottom: 16px;
    }

    .error-state h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.85);
    }

    .error-state p {
      color: rgba(0, 0, 0, 0.45);
      margin-bottom: 24px;
    }

    .link {
      color: #1890ff;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    /* RTL support */
    .document-edit-container.rtl .action-buttons {
      flex-direction: row-reverse;
      justify-content: flex-start;
    }

    .document-edit-container.rtl .error-state {
      text-align: right;
    }
  `]
})
export class DocumentEditPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  public translationService = inject(TranslationService);

  isLoading = signal(true);
  isSubmitting = signal(false);
  documentId = signal<number | null>(null);
  document: WritableSignal<Document | null> = signal(null);
  resourceType: WritableSignal<ResourceType | null> = signal(null);
  newAttachments: WritableSignal<File[]> = signal([]);
  removedAttachmentIds: WritableSignal<number[]> = signal([]);

  // Parent document search
  isSearchingParents = signal(false);
  parentSearchQuery = signal('');
  parentSearchResults = signal<Document[]>([]);

  editForm!: FormGroup;
  FieldType = FieldType; 

  constructor() {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      tags: [''],
      parentSearch: [''],
      parentId: [null], 
      metadata: this.fb.group({}) 
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocumentAndResourceType(+id);
        this.setupParentDocumentSearch();
      } else {
        this.isLoading.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  setupParentDocumentSearch(): void {
    this.editForm.get('parentSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(value => {
        if (typeof value === 'string') {
          this.parentSearchQuery.set(value);
          this.isSearchingParents.set(value.length > 0);
        }
      }),
      switchMap(value => {
        // Only search if it's a string and has more than 2 characters
        if (typeof value === 'string' && value.length > 2) {
          return this.searchDocuments(value).pipe(
            catchError(() => {
              this.snackbar.error('Failed to search for documents');
              return of([]);
            })
          );
        }
        
        return of([]);
      })
    ).subscribe(results => {
      this.parentSearchResults.set(results);
      this.isSearchingParents.set(false);
    });
  }

  searchDocuments(query: string): Observable<Document[]> {
    // Exclude the current document from search results
    const docId = this.documentId();
    return this.documentService.list({
      titleContains: query,
      page: 0,
      size: 10
    }).pipe(
      map(page => page.content.filter(doc => doc.id !== docId))
    );
  }

  displayParentFn(doc: Document): string {
    return doc ? `${doc.title} (${doc.resourceCode})` : '';
  }

  onParentSelected(doc: Document): void {
    this.editForm.patchValue({
      parentId: doc.id,
      parentSearch: this.displayParentFn(doc)
    });
    this.parentSearchResults.set([]);
  }

  clearParentSelection(): void {
    this.editForm.patchValue({
      parentSearch: '',
      parentId: null
    });
    this.parentSearchResults.set([]);
  }

  loadDocumentAndResourceType(id: number): void {
    this.isLoading.set(true);
    this.documentService.get(id).subscribe({
      next: doc => {
        this.document.set(doc);
        this.removedAttachmentIds.set([]); // Reset removed IDs on load
        if (doc.resourceTypeId) {
          this.resourceTypeService.get(doc.resourceTypeId).subscribe({
            next: rt => {
              this.resourceType.set(rt);
              this.buildMetadataForm(rt.fields, doc.fieldValues);
              this.patchForm(doc);
              this.isLoading.set(false);
            },
            error: err => {
              this.snackbar.error('Failed to load resource type: ' + (err.error?.message || err.message));
              this.patchForm(doc); 
              this.isLoading.set(false);
            }
          });
        } else {
          this.patchForm(doc);
          this.isLoading.set(false);
          this.snackbar.info('Document does not have an associated resource type.');
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load document: ' + (err.error?.message || err.message));
        this.router.navigate(['/documents']);
      }
    });
  }

  patchForm(doc: Document): void {
    this.editForm.patchValue({
      title: doc.title,
      description: doc.description,
      tags: doc.tags ? doc.tags.join(', ') : '',
      parentId: doc.parent?.id || null,
      parentSearch: doc.parent ? `${doc.parent.title} (${doc.parent.resourceCode || ''})` : ''
    });
    if (doc.fieldValues) {
      this.metadataFormGroup.patchValue(this.prepareMetadataForForm(doc.fieldValues));
    }
  }
  
  get metadataFormGroup(): FormGroup {
    return this.editForm.get('metadata') as FormGroup;
  }

  buildMetadataForm(fields: FieldDefinitionDto[], existingFieldValues?: Record<string, any>): void {
    const metadataGroup = this.metadataFormGroup;
    // Clear existing controls before rebuilding
    Object.keys(metadataGroup.controls).forEach(key => {
        metadataGroup.removeControl(key);
    });

    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      // Use field.label or field.name for display, but field.name for formControlName
      let value: any = existingFieldValues?.[field.name] ?? null;
      if (field.kind === FieldType.DATE && value) {
        value = new Date(value as string); 
      }
      if (field.kind === FieldType.BOOLEAN && (value === null || value === undefined)) {
        value = false; // Default to false for boolean fields if not present in metadata
      }
      // For SELECT fields, if the existing value is not in options, it might be better to set it to null or default.
      // However, Angular's mat-select handles this by not selecting anything if value is not in options.
      metadataGroup.addControl(field.name, this.fb.control(value, validators));
    });
  }

  prepareMetadataForForm(fieldValues: Record<string, any>): Record<string, any> {
    const prepared: Record<string, any> = {};
    const rtFields = this.resourceType()?.fields;
    if (!rtFields) return fieldValues; // Return as is if no fields definition

    for (const key in fieldValues) {
      if (fieldValues.hasOwnProperty(key)) {
        const rtField = rtFields.find(f => f.name === key);
        if (rtField?.kind === FieldType.DATE && fieldValues[key]) {
          prepared[key] = new Date(fieldValues[key] as string);
        } else {
          prepared[key] = fieldValues[key];
        }
      }
    }
    return prepared;
  }

  onNewAttachmentsChanged(files: File[]): void {
    this.newAttachments.set(files);
  }

  markAttachmentForRemoval(attachmentId: number, index: number): void {
    this.removedAttachmentIds.update(ids => [...ids, attachmentId]);
    // Optimistically remove from the displayed list
    this.document.update(doc => {
      if (doc && doc.attachments) {
        doc.attachments.splice(index, 1);
      }
      return doc;
    });
    this.snackbar.info('Attachment marked for removal. Save changes to confirm.');
  }

  getAttachmentDownloadUrl(storageKey: string): string {
    const docId = this.documentId();
    // Ensure environment.apiBase does not end with a slash if documentsApiUrl already includes it.
    // Or construct carefully. For now, assuming direct construction.
    return `${environment.apiBase}/documents/${docId}/files/${storageKey}`;
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackbar.error('Please correct the errors in the form.');
      return;
    }
    this.isSubmitting.set(true);

    const formValue = this.editForm.value;
    
    // Backend DTO for update expects 'fieldValues' for metadata
    const dtoForBackend: UpdateDocumentDto = {
        title: formValue.title,
        // description and tags are not in the backend UpdateDocumentDTO based on user prompt
        parentId: formValue.parentId,
        fieldValues: this.prepareMetadataForSubmit(formValue.metadata)
    };

    const formData = new FormData();
    formData.append('dto', new Blob([JSON.stringify(dtoForBackend)], { type: 'application/json' }));

    if (this.removedAttachmentIds().length > 0) {
      // Backend expects a list of Longs for removedAttachmentIds
      this.removedAttachmentIds().forEach(id => formData.append('removedAttachmentIds', id.toString()));
    }

    this.newAttachments().forEach(file => {
      formData.append('newAttachments', file, file.name);
    });

    const docId = this.documentId();
    if (!docId) {
        this.snackbar.error('Document ID is missing. Cannot update.');
        this.isSubmitting.set(false);
        return;
    }

    this.documentService.update(docId, formData).subscribe({
      next: (savedDoc) => {
        this.isSubmitting.set(false);
        this.snackbar.success('Document updated successfully!');
        this.router.navigate(['/documents', savedDoc.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to update document: ' + (err.error?.message || err.message));
      }
    });
  }

  prepareMetadataForSubmit(metadataFormValue: Record<string, any>): Record<string, any> {
    const preparedMetadata: Record<string, any> = {};
    const rt = this.resourceType();
    if (rt && rt.fields) {
      rt.fields.forEach(field => {
        // Use field.name for retrieving from form and for payload key
        if (metadataFormValue.hasOwnProperty(field.name)) {
          let value = metadataFormValue[field.name];
          if (field.kind === FieldType.DATE && value instanceof Date) {
            preparedMetadata[field.name] = value.toISOString().split('T')[0]; 
          } else if (value !== null && value !== '') { // Keep non-empty values
            preparedMetadata[field.name] = value;
          } else if (value === '' && field.kind !== FieldType.TEXT && field.kind !== FieldType.TEXTAREA) { 
            // For non-text fields, empty string might mean 'not set' or null
            // Backend should handle type conversion for boolean, number if empty string is sent.
            // Explicitly setting to null for non-text, non-textarea fields if empty.
            preparedMetadata[field.name] = null;
          } else if (value === '' && (field.kind === FieldType.TEXT || field.kind === FieldType.TEXTAREA)) {
            // Allow empty strings for text and textarea fields
            preparedMetadata[field.name] = '';
          } else if (value === null && field.kind === FieldType.BOOLEAN) {
            // Ensure boolean field has a boolean value
             preparedMetadata[field.name] = false;
          } else if (value === null) {
            // For other types, if value is null, send null
            preparedMetadata[field.name] = null;
          }
          // If a field is not in metadataFormValue (e.g. disabled), it won't be included.
          // If it's optional and not provided, it's fine.
          // If it's required, form validation should catch it.
        } else if (field.kind === FieldType.BOOLEAN) {
          // If a boolean field is not in the form value (e.g. if it was never touched and not in original metadata),
          // it defaults to false.
          preparedMetadata[field.name] = false;
        }
      });
    }
    return preparedMetadata;
  }

  cancelEdit(): void {
    const currentDocId = this.documentId();
    if (currentDocId) {
      this.router.navigate(['/documents', currentDocId]);
    } else {
      this.router.navigate(['/documents']);
    }
  }
}
