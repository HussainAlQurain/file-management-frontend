import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
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

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Document } from '../../core/models/document.model';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    FileUploadComponent
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
                          <mat-label>{{ field.name }}</mat-label>
                          <mat-select [formControlName]="field.name" [required]="field.required">
                            @for (option of (field as any).options; track option) {
                              <mat-option [value]="option">{{ option }}</mat-option>
                            }
                          </mat-select>
                          @if (metadataFormGroup.get(field.name)?.hasError('required')) {
                            <mat-error>{{ field.name }} is required.</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="w-full" *ngSwitchDefault>
                            <mat-label>{{ field.name }} (Unsupported type: {{field.kind}})</mat-label>
                            <input matInput [formControlName]="field.name" [required]="field.required" readonly>
                        </mat-form-field>

                      </ng-container>
                    }
                  </div>
                }
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

  isLoading = signal(true);
  isSubmitting = signal(false);
  documentId = signal<number | null>(null);
  document: WritableSignal<Document | null> = signal(null);
  resourceType: WritableSignal<ResourceType | null> = signal(null);
  newAttachments: WritableSignal<File[]> = signal([]);

  editForm!: FormGroup;
  FieldType = FieldType; 

  constructor() {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      tags: [''], 
      metadata: this.fb.group({}) 
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.documentId.set(+id);
        this.loadDocumentAndResourceType(+id);
      } else {
        this.isLoading.set(false);
        this.snackbar.error('Document ID not found in URL.');
        this.router.navigate(['/documents']);
      }
    });
  }

  loadDocumentAndResourceType(id: number): void {
    this.isLoading.set(true);
    this.documentService.get(id).subscribe({
      next: doc => {
        this.document.set(doc);
        if (doc.resourceTypeId) {
          this.resourceTypeService.get(doc.resourceTypeId).subscribe({
            next: rt => {
              this.resourceType.set(rt);
              this.buildMetadataForm(rt.fields, doc.metadata);
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
      tags: doc.tags ? doc.tags.join(', ') : ''
    });
    if (doc.metadata) {
      this.metadataFormGroup.patchValue(this.prepareMetadataForForm(doc.metadata));
    }
  }
  
  get metadataFormGroup(): FormGroup {
    return this.editForm.get('metadata') as FormGroup;
  }

  buildMetadataForm(fields: FieldDefinitionDto[], existingMetadata?: Record<string, any>): void {
    const metadataGroup = this.metadataFormGroup;
    // Clear existing controls before rebuilding
    Object.keys(metadataGroup.controls).forEach(key => {
        metadataGroup.removeControl(key);
    });

    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      let value: any = existingMetadata?.[field.name] ?? null;
      if (field.kind === FieldType.DATE && value) {
        value = new Date(value as string); 
      }
      // Ensure default value for checkbox if null/undefined
      if (field.kind === FieldType.CHECKBOX && (value === null || value === undefined)) {
        value = false;
      }
      metadataGroup.addControl(field.name, this.fb.control(value, validators));
    });
  }

  prepareMetadataForForm(metadata: Record<string, any>): Record<string, any> {
    const prepared: Record<string, any> = {};
    const rtFields = this.resourceType()?.fields;
    if (!rtFields) return metadata; // Return as is if no fields definition

    for (const key in metadata) {
      if (metadata.hasOwnProperty(key)) {
        const rtField = rtFields.find(f => f.name === key);
        if (rtField?.kind === FieldType.DATE && metadata[key]) {
          prepared[key] = new Date(metadata[key] as string);
        } else {
          prepared[key] = metadata[key];
        }
      }
    }
    return prepared;
  }

  onNewAttachmentsChanged(files: File[]): void {
    this.newAttachments.set(files);
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackbar.error('Please correct the errors in the form.');
      return;
    }
    this.isSubmitting.set(true);

    const formValue = this.editForm.value;
    const updatedDocument: Partial<Document> = {
      title: formValue.title,
      description: formValue.description,
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      metadata: this.prepareMetadataForSubmit(formValue.metadata)
    };

    const docId = this.documentId();
    if (!docId) {
        this.snackbar.error('Document ID is missing. Cannot update.');
        this.isSubmitting.set(false);
        return;
    }

    this.documentService.update(docId, updatedDocument, this.newAttachments()).subscribe({
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
        if (metadataFormValue.hasOwnProperty(field.name)) {
          let value = metadataFormValue[field.name];
          if (field.kind === FieldType.DATE && value instanceof Date) {
            preparedMetadata[field.name] = value.toISOString().split('T')[0]; 
          } else if (value !== null && value !== '') {
            preparedMetadata[field.name] = value;
          } else if (value === '' && field.kind !== FieldType.TEXT) { 
             preparedMetadata[field.name] = null;
          } else if (value === '' && field.kind === FieldType.TEXT) {
            preparedMetadata[field.name] = '';
          }
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
