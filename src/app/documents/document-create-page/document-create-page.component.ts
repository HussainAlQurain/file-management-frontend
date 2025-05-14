import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox'; // Added MatCheckboxModule

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model'; // Changed ResourceTypeField to FieldDefinitionDto
import { Document } from '../../core/models/document.model';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';
import { AsyncBtnComponent } from '../../shared/components/async-btn/async-btn.component';

@Component({
  selector: 'app-document-create-page',
  standalone: true,
  imports: [
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
    FileUploadComponent,
    AsyncBtnComponent,
    MatCheckboxModule // Added MatCheckboxModule
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
                  <mat-option [value]="rt.id">{{ rt.code }}</mat-option> <!-- Changed rt.name to rt.code -->
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
            <h3 class="text-lg font-semibold mb-2">{{ selectedResourceType()?.code }} Details</h3> <!-- Changed selectedResourceType()?.name to selectedResourceType()?.code -->
            
            <mat-form-field appearance="outline" class="w-full mb-3">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" required>
              @if (metadataForm.get('title')?.hasError('required')) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            @for (field of selectedResourceType()?.fields; track field.id) {
              <mat-form-field appearance="outline" class="w-full mb-3">
                <mat-label>{{ field.name }}</mat-label> <!-- Changed field.label to field.name (assuming DTO uses name as primary identifier) -->
                @if (field.kind === FieldType.TEXT) { <input matInput [formControlName]="field.name"> } <!-- Changed field.type to field.kind -->
                @else if (field.kind === FieldType.NUMBER) { <input matInput type="number" [formControlName]="field.name"> } <!-- Changed field.type to field.kind -->
                @else if (field.kind === FieldType.DATE) { <input matInput type="date" [formControlName]="field.name"> } <!-- Changed field.type to field.kind -->
                @else if (field.kind === FieldType.TEXTAREA) { <textarea matInput [formControlName]="field.name"></textarea> } <!-- Changed field.type to field.kind -->
                @else if (field.kind === FieldType.CHECKBOX) {  <!-- Changed field.type to field.kind -->
                  <mat-checkbox [formControlName]="field.name" class="ml-1">{{ field.name }}</mat-checkbox> <!-- Changed field.label to field.name -->
                }
                @else if (field.kind === FieldType.SELECT) {  <!-- Changed field.type to field.kind -->
                  <mat-select [formControlName]="field.name">
                    @for (option of (field as any).options; track option) { <!-- Added (field as any).options to bypass type checking if options is not on FieldDefinitionDto -->
                      <mat-option [value]="option">{{ option }}</mat-option>
                    }
                  </mat-select>
                }
                @else { <input matInput [formControlName]="field.name"> } 

                @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                  <mat-error>{{ field.name }} is required</mat-error> <!-- Changed field.label to field.name -->
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
            [accept]="'*/*'" 
            [multiple]="false"
            [isRequired]="true">
          </app-file-upload>
          <small class="text-gray-500">Max file size: 100MB.</small> 

          <h3 class="text-lg font-semibold mb-2 mt-6">Upload Attachments (Optional)</h3>
          <app-file-upload 
            (filesChanged)="onAttachmentFilesChanged($event)"
            [accept]="'*/*'"
            [multiple]="true">
          </app-file-upload>
          
          <div class="mt-6 flex justify-between">
            <button mat-button matStepperPrevious>Back</button>
            <app-async-btn 
              (click)="onSubmit()" 
              [isLoading]="isSubmitting()"
              [disabled]="!primaryFile() || metadataForm.invalid">
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

  // Make FieldType enum available in the template
  FieldType = FieldType;

  resourceTypes = signal<ResourceType[]>([]);
  selectedResourceType = signal<ResourceType | undefined>(undefined);
  
  primaryFile = signal<File | null>(null);
  attachmentFiles = signal<File[]>([]);
  isSubmitting = signal(false);

  resourceTypeForm: FormGroup = this.fb.group({
    resourceTypeId: ['', Validators.required]
  });

  metadataForm: FormGroup = this.fb.group({
    title: ['', Validators.required]
    // Dynamic fields will be added here
  });

  ngOnInit(): void {
    this.loadResourceTypes();
  }

  loadResourceTypes(): void {
    this.resourceTypeService.getAll().subscribe(types => {
      this.resourceTypes.set(types);
    });
  }

  onResourceTypeChange(resourceTypeId: number): void {
    const rt = this.resourceTypes().find(type => type.id === resourceTypeId);
    this.selectedResourceType.set(rt);
    this.buildMetadataForm(rt?.fields || []);
  }

  buildMetadataForm(fields: FieldDefinitionDto[]): void { // Changed ResourceTypeField to FieldDefinitionDto
    // Clear existing dynamic controls except title
    const currentControls = { ...this.metadataForm.controls };
    Object.keys(currentControls).forEach(key => {
      if (key !== 'title') {
        this.metadataForm.removeControl(key);
      }
    });
    
    // Add new controls based on selected resource type
    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      // Provide a default value based on type, e.g., false for CHECKBOX
      const defaultValue = field.kind === FieldType.CHECKBOX ? false : ''; // Changed field.type to field.kind
      this.metadataForm.addControl(field.name, this.fb.control(defaultValue, validators));
    });
  }

  onPrimaryFileChanged(file: File | null): void {
    this.primaryFile.set(file);
  }

  onAttachmentFilesChanged(files: File[]): void {
    this.attachmentFiles.set(files);
  }

  onSubmit(): void {
    if (this.metadataForm.invalid || !this.primaryFile()) {
      this.snackbar.error('Please fill all required fields and upload a primary file.');
      return;
    }

    this.isSubmitting.set(true);
    
    // Prepare metadata, separating title from other custom fields
    const formValue = { ...this.metadataForm.value };
    const title = formValue.title;
    delete formValue.title; // Remove title from what goes into metadata object

    const documentData: Partial<Document> = {
      title: title,
      resourceTypeId: this.selectedResourceType()!.id,
      metadata: formValue // Store dynamic fields in metadata
    };

    const allFiles: File[] = [this.primaryFile()!];
    if (this.attachmentFiles().length > 0) {
      allFiles.push(...this.attachmentFiles());
    }
    
    this.documentService.create(documentData, allFiles).subscribe({
      next: (newDoc) => {
        this.isSubmitting.set(false);
        this.snackbar.success(`Document '${newDoc.title}' created successfully!`);
        this.router.navigate(['/documents', newDoc.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create document. ' + (err.error?.message || ''));
      }
    });
  }
}
