import { Component, OnInit, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

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
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    FileUploadComponent,
    MatListModule
  ],
  template: `
    <div class="p-4 md:p-8">
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-[300px]">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else if (document()) {
        <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
          <mat-card>
            <mat-card-header>
              <mat-card-title class="text-2xl font-semibold">Edit Document: {{ document()?.title }}</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-6 p-4">
              <!-- Basic Info -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" required>
                @if (editForm.get('title')?.hasError('required')) {
                  <mat-error>Title is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Parent Document (Optional)</mat-label>
                <input 
                  matInput 
                  formControlName="parentSearch" 
                  placeholder="Search for parent document..." 
                  [matAutocomplete]="parentAuto">
                <mat-autocomplete #parentAuto="matAutocomplete" [displayWith]="displayParentFn">
                  @if (isSearchingParents()) {
                    <mat-option disabled>
                      <mat-spinner diameter="20"></mat-spinner> Searching...
                    </mat-option>
                  } @else if (parentSearchResults().length === 0 && parentSearchQuery().length > 0) {
                    <mat-option disabled>No documents found</mat-option>
                  } @else {
                    @for (doc of parentSearchResults(); track doc.id) {
                      <mat-option [value]="doc">
                        {{ doc.title }} ({{ doc.resourceCode }})
                      </mat-option>
                    }
                  }
                </mat-autocomplete>
                <button 
                  *ngIf="editForm.get('parentId')?.value" 
                  matSuffix 
                  mat-icon-button 
                  aria-label="Clear" 
                  (click)="clearParentSelection()">
                  <mat-icon>close</mat-icon>
                </button>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Tags (comma-separated)</mat-label>
                <input matInput formControlName="tags">
                 <mat-hint>Enter tags separated by commas.</mat-hint>
              </mat-form-field>

              <!-- Dynamic Metadata Fields -->
              @if (resourceType(); as rt) {
                @if (rt.fields && rt.fields.length > 0) {
                  <h3 class="text-xl font-medium mt-6 mb-3 border-b pb-2">Metadata ({{ rt.code }})</h3>
                  <div formGroupName="metadata" class="space-y-4">
                    @for (field of rt.fields; track field.id) {
                      <ng-container [ngSwitch]="field.kind">
                        <mat-form-field appearance="outline" class="w-full" *ngSwitchCase="FieldType.TEXT">
                          <mat-label>{{ field.name }}</mat-label>
                          <input matInput [formControlName]="field.name" [required]="field.required">
                          @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error>{{ field.name }} is required.</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="w-full" *ngSwitchCase="FieldType.NUMBER">
                          <mat-label>{{ field.name }}</mat-label>
                          <input matInput type="number" [formControlName]="field.name" [required]="field.required">
                           @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error>{{ field.name }} is required.</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="w-full" *ngSwitchCase="FieldType.DATE">
                          <mat-label>{{ field.name }}</mat-label>
                          <input matInput [matDatepicker]="picker" [formControlName]="field.name" [required]="field.required">
                          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                          <mat-datepicker #picker></mat-datepicker>
                           @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error>{{ field.name }} is required.</mat-error>
                          }
                        </mat-form-field>

                        <div class="py-2" *ngSwitchCase="FieldType.CHECKBOX"> 
                           <mat-checkbox [formControlName]="field.name" [required]="field.required">
                            {{ field.name }}
                          </mat-checkbox>
                           @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error class="text-xs">{{ field.name }} is required.</mat-error> 
                          }
                        </div>

                        <mat-form-field appearance="outline" class="w-full" *ngSwitchCase="FieldType.SELECT">
                          <mat-label>{{ field.label || field.name }}</mat-label>
                          <mat-select [formControlName]="field.name" [required]="field.required">
                            @if(field.options && field.options.length > 0) {
                              @for (option of field.options; track option) {
                                <mat-option [value]="option">{{ option }}</mat-option>
                              }
                            } @else {
                              <mat-option disabled>No options available</mat-option>
                            }
                          </mat-select>
                          @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error>{{ field.label || field.name }} is required.</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="w-full" *ngSwitchDefault>
                            <mat-label>{{ field.label || field.name }} (Unsupported type: {{field.kind}})</mat-label>
                            <input matInput [formControlName]="field.name" [required]="field.required" readonly>
                        </mat-form-field>

                      </ng-container>
                    }
                  </div>
                }
              }

              <!-- Existing Attachments -->
              @if (document()?.attachments && document()!.attachments.length > 0) {
                <h3 class="text-xl font-medium mt-6 mb-3 border-b pb-2">Existing Attachments</h3>
                <mat-list>
                  @for (att of document()?.attachments; track att.id; let i = $index) {
                    <mat-list-item>
                      <mat-icon matListItemIcon>attachment</mat-icon>
                      <div matListItemTitle>
                        <a [href]="getAttachmentDownloadUrl(att.storageKey)" target="_blank" class="hover:underline">
                          {{ att.fileName }}
                        </a>
                      </div>
                      <div matListItemMeta>
                        <button mat-icon-button color="warn" type="button" (click)="markAttachmentForRemoval(att.id, i)" matTooltip="Remove Attachment">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </mat-list-item>
                  }
                </mat-list>
              } @else {
                <p class="text-gray-500 mt-4">No existing attachments.</p>
              }

              <!-- File Upload for New Attachments -->
              <h3 class="text-xl font-medium mt-6 mb-3 border-b pb-2">Add New Attachments</h3>
              <app-file-upload 
                (filesChanged)="onNewAttachmentsChanged($event)" 
                [multiple]="true"
                title="Drag and drop new attachments here"
                subtitle="or click to select files">
              </app-file-upload>
              @if (newAttachments().length > 0) {
                <div class="mt-2 text-sm text-gray-600">
                  {{ newAttachments().length }} new file(s) selected.
                </div>
              }

            </mat-card-content>
            <mat-card-actions class="p-4 flex justify-end space-x-2">
              <button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="editForm.invalid || isSubmitting()">
                @if(isSubmitting()){ <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner> } 
                Save Changes
              </button>
            </mat-card-actions>
          </mat-card>
        </form>
      } @else {
        <mat-card class="text-center p-8">
          <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
          <h2 class="text-2xl font-semibold mt-4 mb-2">Document Not Found</h2>
          <p class="text-gray-600 mb-6">The document you are looking for could not be loaded for editing.</p>
          <button mat-stroked-button routerLink="/documents">
            <mat-icon>arrow_back</mat-icon> Back to Documents List
          </button>
        </mat-card>
      }
    </div>
  `
})
export class DocumentEditPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

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
        // If the value is an object, it means an option was selected
        if (typeof value === 'object' && value !== null) {
          this.editForm.patchValue({ parentId: value.id });
          return of([]);
        }
        
        // Otherwise search for documents matching the query
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
      if (field.kind === FieldType.CHECKBOX && (value === null || value === undefined)) {
        value = false; // Default to false for checkboxes if not present in metadata
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
          } else if (value === null && field.kind === FieldType.CHECKBOX) {
            // Ensure checkbox has a boolean value
             preparedMetadata[field.name] = false;
          } else if (value === null) {
            // For other types, if value is null, send null
            preparedMetadata[field.name] = null;
          }
          // If a field is not in metadataFormValue (e.g. disabled), it won't be included.
          // If it's optional and not provided, it's fine.
          // If it's required, form validation should catch it.
        } else if (field.kind === FieldType.CHECKBOX) {
          // If a checkbox is not in the form value (e.g. if it was never touched and not in original metadata),
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
