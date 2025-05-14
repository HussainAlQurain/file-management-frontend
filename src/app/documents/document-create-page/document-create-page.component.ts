import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpEvent, HttpEventType } from '@angular/common/http';

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { Document } from '../../core/models/document.model';
import { FileUploadComponent, FileUploadProgress } from '../../shared/components/file-upload/file-upload.component'; // Import FileUploadProgress here
import { AsyncBtnComponent } from '../../shared/components/async-btn/async-btn.component';

@Component({
  selector: 'app-document-create-page',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    FileUploadComponent, // Ensure FileUploadComponent is imported
    AsyncBtnComponent,
    MatCheckboxModule
  ],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-6">Create New Document</h2>

      <mat-stepper linear #stepper="matStepper">
        <!-- Step 1: Select Resource Type -->
        <mat-step [stepControl]="resourceTypeForm">
          <form [formGroup]="resourceTypeForm">
            <ng-template matStepLabel>Select Document Type</ng-template>
            <mat-form-field appearance="outline" class="w-full md:w-1/2">
              <mat-label>Document Type</mat-label>
              <mat-select formControlName="resourceTypeId" required (selectionChange)="onResourceTypeChange($event.value)">
                @for (rt of resourceTypes(); track rt.id) {
                  <mat-option [value]="rt.id">{{ rt.code }}</mat-option>
                }
              </mat-select>
              @if (resourceTypeForm.get('resourceTypeId')?.hasError('required')) {
                <mat-error>Document type is required</mat-error>
              }
            </mat-form-field>
            <div class="mt-4">
              <button mat-button matStepperNext color="primary" [disabled]="!selectedResourceType()">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Fill Metadata (Dynamic Form) -->
        <mat-step [stepControl]="metadataForm" label="Enter Document Details">
          <form [formGroup]="metadataForm" class="mt-4">
            <h3 class="text-lg font-semibold mb-2">{{ selectedResourceType()?.code }} Details</h3>
            
            <mat-form-field appearance="outline" class="w-full mb-3">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" required>
              @if (metadataForm.get('title')?.hasError('required')) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            @for (field of selectedResourceType()?.fields; track field.id) {
              <mat-form-field appearance="outline" class="w-full mb-3">
                <mat-label>{{ field.label || field.name }}</mat-label>
                @if (field.kind === FieldType.TEXT) { <input matInput [formControlName]="field.name"> }
                @else if (field.kind === FieldType.NUMBER) { <input matInput type="number" [formControlName]="field.name"> }
                @else if (field.kind === FieldType.DATE) { <input matInput type="date" [formControlName]="field.name"> }
                @else if (field.kind === FieldType.TEXTAREA) { <textarea matInput [formControlName]="field.name"></textarea> }
                @else if (field.kind === FieldType.CHECKBOX) {
                  <mat-checkbox [formControlName]="field.name" class="ml-1">{{ field.label || field.name }}</mat-checkbox>
                }
                @else if (field.kind === FieldType.SELECT) {
                  <mat-select [formControlName]="field.name">
                    @if(field.options && field.options.length > 0) {
                      @for (option of field.options; track option) {
                        <mat-option [value]="option">{{ option }}</mat-option>
                      }
                    } @else {
                      <mat-option disabled>No options available</mat-option>
                    }
                  </mat-select>
                }
                @else { <input matInput [formControlName]="field.name"> } 

                @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                  <mat-error>{{ field.label || field.name }} is required</mat-error>
                }
              </mat-form-field>
            }
            
            <div class="mt-4 flex justify-between">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button matStepperNext color="primary" [disabled]="metadataForm.invalid">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Upload Files -->
        <mat-step label="Upload Files">
          <h3 class="text-lg font-semibold mb-2 mt-4">Upload Primary File</h3>
          <app-file-upload 
            (fileChanged)="onPrimaryFileChanged($event)" 
            [accept]="acceptFileTypes()" 
            [multiple]="false"
            [maxFileSize]="maxFileSize" <!-- Call as signal -->
            [allowedExtensions]="allowedFileExtensions" <!-- Call as signal -->
            (fileValidationFailed)="onFileValidationError($event, 'primary')"
            [uploadProgress]="primaryFileProgress()">
          </app-file-upload>
          <small class="text-gray-500">Max file size: {{ maxFileSize / (1024*1024) }}MB. Allowed types: {{ allowedFileExtensions.join(', ') }}.</small> 
          @if(primaryFileProgress().length > 0 && primaryFileProgress()[0].error) {
            <mat-error class="mt-1 block">{{ primaryFileProgress()[0].error }}</mat-error>
          }

          <h3 class="text-lg font-semibold mb-2 mt-6">Upload Attachments (Optional)</h3>
          <app-file-upload 
            (filesChanged)="onAttachmentFilesChanged($event)"
            [accept]="acceptFileTypes()" 
            [multiple]="true"
            [maxFileSize]="maxFileSize" <!-- Call as signal -->
            [allowedExtensions]="allowedFileExtensions" <!-- Call as signal -->
            (fileValidationFailed)="onFileValidationError($event, 'attachment')"
            [uploadProgress]="attachmentsProgress()">
          </app-file-upload>
          <small class="text-gray-500">Max file size per file: {{ maxFileSize / (1024*1024) }}MB. Allowed types: {{ allowedFileExtensions.join(', ') }}.</small>
            @for(item of attachmentsProgress(); track $index) {
              @if(item.error) {
                <mat-error class="mt-1 block">Attachment '{{ item.file.name }}': {{ item.error }}</mat-error>
              }
            }
          
          <div class="mt-6 flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <app-async-btn 
              (click)="onSubmit()" 
              [isLoading]="isSubmitting()"
              [disabled]="isSubmitDisabled()">
              Create Document
            </app-async-btn>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `
})
export class DocumentCreatePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private resourceTypeService = inject(ResourceTypeService);
  private documentService = inject(DocumentService);
  private snackbar = inject(SnackbarService);

  FieldType = FieldType;

  resourceTypes = signal<ResourceType[]>([]);
  selectedResourceType = signal<ResourceType | undefined>(undefined);
  
  primaryFile = signal<File | null>(null);
  attachmentFiles = signal<File[]>([]);
  isSubmitting = signal(false);

  // File upload options - revert to plain properties
  maxFileSize = 100 * 1024 * 1024; // 100MB
  allowedFileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'zip', 'rar'];

  primaryFileProgress = signal<FileUploadProgress[]>([]);
  attachmentsProgress = signal<FileUploadProgress[]>([]);
  
  resourceTypeForm: FormGroup = this.fb.group({
    resourceTypeId: ['', Validators.required]
  });

  metadataForm: FormGroup = this.fb.group({
    title: ['', Validators.required]
  });

  // Getter for the accept string for file inputs
  acceptFileTypes = computed(() => this.allowedFileExtensions.map(ext => '.' + ext).join(','));

  // Getter for submit button disabled state
  isSubmitDisabled = computed(() => {
    const primaryFileInvalid = !this.primaryFile() || (this.primaryFileProgress().length > 0 && !!this.primaryFileProgress()[0].error);
    const attachmentsInvalid = this.attachmentsProgress().some(att => !!att.error);
    return this.metadataForm.invalid || primaryFileInvalid || attachmentsInvalid;
  });

  ngOnInit(): void {
    this.loadResourceTypes();
  }

  loadResourceTypes(): void {
    this.resourceTypeService.listAllNonPaged().subscribe({
      next: types => {
        this.resourceTypes.set(types);
        if (types.length === 0) {
          this.snackbar.info('No document types (resource types) are defined. Please create one first.');
        }
      },
      error: err => {
        this.snackbar.error('Failed to load document types: ' + (err.error?.message || err.message));
      }
    });
  }

  onResourceTypeChange(resourceTypeId: number): void {
    const rt = this.resourceTypes().find(type => type.id === resourceTypeId);
    this.selectedResourceType.set(rt);
    this.buildMetadataForm(rt?.fields || []);
  }

  buildMetadataForm(fields: FieldDefinitionDto[]): void {
    const currentControls = { ...this.metadataForm.controls };
    Object.keys(currentControls).forEach(key => {
      if (key !== 'title') {
        this.metadataForm.removeControl(key);
      }
    });
    
    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      const defaultValue = field.kind === FieldType.CHECKBOX ? false : '';
      this.metadataForm.addControl(field.name, this.fb.control(defaultValue, validators));
    });
  }

  onPrimaryFileChanged(file: File | null): void {
    this.primaryFileProgress.set([]);
    if (file) {
      this.primaryFile.set(file);
      // Progress will be updated by the FileUploadComponent via the input binding
      // Validation errors are handled by onFileValidationError
    } else {
      this.primaryFile.set(null);
    }
  }

  onAttachmentFilesChanged(files: File[]): void {
    this.attachmentsProgress.set([]);
    this.attachmentFiles.set(files);
    // Progress will be updated by the FileUploadComponent via the input binding
    // Validation errors are handled by onFileValidationError
  }

  onFileValidationError(event: { file: File; reason: string }, type: 'primary' | 'attachment'): void {
    const { file, reason } = event;
    if (type === 'primary') {
      this.primaryFile.set(null);
      this.primaryFileProgress.set([{ file: file, progress: 0, error: reason, uploaded: false }]);
      this.snackbar.error(reason);
    } else if (type === 'attachment') {
      this.attachmentsProgress.update(progressArray => {
        const existingIndex = progressArray.findIndex(p => p.file.name === file.name && p.file.size === file.size);
        if (existingIndex > -1) {
          progressArray[existingIndex].error = reason;
        } else {
          progressArray.push({ file: file, progress: 0, error: reason, uploaded: false });
        }
        return [...progressArray];
      });
      this.attachmentFiles.update(files => files.filter(f => f.name !== file.name || f.size !== file.size));
      this.snackbar.error(`Attachment '${file.name}': ${reason}`);
    }
  }

  onSubmit(): void {
    if (this.metadataForm.invalid || !this.primaryFile()) {
      this.snackbar.error('Please fill all required fields and upload a valid primary file.');
      this.metadataForm.markAllAsTouched(); // Ensure metadata form errors are visible
      // Potentially trigger stepper to go to the step with error if not already there
      return;
    }
    if (this.primaryFileProgress().some(p => !!p.error) || this.attachmentsProgress().some(p => !!p.error)) {
        this.snackbar.error('Please resolve all file validation errors before submitting.');
        return;
    }

    this.isSubmitting.set(true);
    
    const formValue = { ...this.metadataForm.value };
    const title = formValue.title;
    delete formValue.title; // Remove title as it's a top-level property in CreateDocumentDto

    // Prepare the DTO according to the backend's DocumentCreateDTO structure
    const documentDto = {
      title: title,
      resourceTypeId: this.selectedResourceType()!.id,
      fieldValues: formValue // The rest of the metadataForm values are the fieldValues
    };

    const pFile = this.primaryFile();
    if (!pFile) { // Should be caught by earlier checks, but good for safety
        this.snackbar.error('Primary file is missing.');
        this.isSubmitting.set(false);
        return;
    }
    
    this.documentService.create(documentDto, pFile, this.attachmentFiles()).subscribe({
      next: (newDoc: Document) => {
        this.isSubmitting.set(false);
        this.snackbar.success(`Document '${newDoc.title}' created successfully!`);
        this.router.navigate(['/documents', newDoc.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create document. ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }
}
