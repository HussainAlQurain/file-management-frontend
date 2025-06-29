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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';
import { Document, CreateDocumentDto } from '../../core/models/document.model';
import { FileUploadComponent, FileUploadProgress } from '../../shared/components/file-upload/file-upload.component';
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
    MatCheckboxModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-6">Create New Document</h2>      <mat-stepper linear #stepper="matStepper">
        <!-- Step 1: Select Company -->
        <mat-step [stepControl]="companyForm">
          <form [formGroup]="companyForm">
            <ng-template matStepLabel>Select Company</ng-template>
            <mat-form-field appearance="outline" class="w-full md:w-1/2">
              <mat-label>Company</mat-label>
              <mat-select formControlName="companyId" required (selectionChange)="onCompanyChange($event.value)">
                @for (company of companies(); track company.id) {
                  <mat-option [value]="company.id">{{ company.name }}</mat-option>
                }
              </mat-select>
              @if (companyForm.get('companyId')?.hasError('required')) {
                <mat-error>Company is required</mat-error>
              }
            </mat-form-field>
            <div class="mt-4">
              <button mat-button matStepperNext color="primary" [disabled]="!selectedCompany()">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Select Resource Type -->
        <mat-step [stepControl]="resourceTypeForm">
          <form [formGroup]="resourceTypeForm">
            <ng-template matStepLabel>Select Document Type</ng-template>
            <mat-form-field appearance="outline" class="w-full md:w-1/2">
              <mat-label>Document Type</mat-label>
              <mat-select formControlName="resourceTypeId" required (selectionChange)="onResourceTypeChange($event.value)">
                @for (rt of resourceTypes(); track rt.id) {
                  <mat-option [value]="rt.id">{{ rt.name }} ({{ rt.code }})</mat-option>
                }
              </mat-select>
              @if (resourceTypeForm.get('resourceTypeId')?.hasError('required')) {
                <mat-error>Document type is required</mat-error>
              }
            </mat-form-field>
            <div class="mt-4">
              <button mat-button matStepperPrevious>Previous</button>
              <button mat-button matStepperNext color="primary" [disabled]="!selectedResourceType()" class="ml-2">
                Next
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Fill Metadata (Dynamic Form) -->
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

            <mat-form-field appearance="outline" class="w-full mb-3">
              <mat-label>Resource Code</mat-label>
              <input matInput formControlName="resourceCode" required>
              @if (metadataForm.get('resourceCode')?.hasError('required')) {
                <mat-error>Resource code is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full mb-3">
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
                *ngIf="metadataForm.get('parentId')?.value" 
                matSuffix 
                mat-icon-button 
                aria-label="Clear" 
                (click)="clearParentSelection()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full mb-3">
              <mat-label>Tags</mat-label>
              <input matInput formControlName="tags" placeholder="Enter tags separated by commas">
            </mat-form-field>

            @if (selectedResourceType()?.fields && selectedResourceType()?.fields?.length === 0) {
              <div class="alert alert-info bg-blue-100 border-blue-500 border-l-4 p-4 mb-4">
                <div class="font-semibold">No custom fields</div>
                <p>This document type doesn't have any custom fields defined. Contact an administrator to add fields to this document type.</p>
              </div>
            } @else {
              @for (field of selectedResourceType()?.fields; track field.id) {
                @if (field.kind === FieldType.BOOLEAN) {
                  <div class="mb-3">
                    <mat-checkbox [formControlName]="field.name">
                      {{ field.label || field.name }}
                    </mat-checkbox>
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </div>
                } @else if (field.kind === FieldType.DATE) {
                  <mat-form-field appearance="outline" class="w-full mb-3">
                    <mat-label>{{ field.label || field.name }}</mat-label>
                    <input matInput [matDatepicker]="picker" [formControlName]="field.name">
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </mat-form-field>
                } @else if (field.kind === FieldType.SELECT) {
                  <mat-form-field appearance="outline" class="w-full mb-3">
                    <mat-label>{{ field.label || field.name }}</mat-label>
                    <mat-select [formControlName]="field.name">
                      @if(field.options && field.options.length > 0) {
                        @for (option of field.options; track option) {
                          <mat-option [value]="option">{{ option }}</mat-option>
                        }
                      } @else {
                        <mat-option disabled>No options available</mat-option>
                      }
                    </mat-select>
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </mat-form-field>
                } @else if (field.kind === FieldType.TEXTAREA) {
                  <mat-form-field appearance="outline" class="w-full mb-3">
                    <mat-label>{{ field.label || field.name }}</mat-label>
                    <textarea matInput [formControlName]="field.name" rows="3" cdkTextareaAutosize cdkAutosizeMinRows="3" cdkAutosizeMaxRows="10"></textarea>
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </mat-form-field>
                } @else if (field.kind === FieldType.NUMBER) {
                  <mat-form-field appearance="outline" class="w-full mb-3">
                    <mat-label>{{ field.label || field.name }}</mat-label>
                    <input matInput type="number" [formControlName]="field.name">
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </mat-form-field>
                } @else {
                  <mat-form-field appearance="outline" class="w-full mb-3">
                    <mat-label>{{ field.label || field.name }}</mat-label>
                    <input matInput [formControlName]="field.name">
                    @if (metadataForm.get(field.name)?.hasError('required') && field.required) {
                      <mat-error>{{ field.label || field.name }} is required</mat-error>
                    }
                  </mat-form-field>
                }
              }
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
            [maxFileSize]="maxFileSize"
            [allowedExtensions]="allowedFileExtensions"
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
            [maxFileSize]="maxFileSize"
            [allowedExtensions]="allowedFileExtensions"
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
  private companyService = inject(CompanyService);
  private documentService = inject(DocumentService);
  private snackbar = inject(SnackbarService);
  private dialogRef = inject(MatDialogRef<DocumentCreatePageComponent>, { optional: true });

  FieldType = FieldType;

  companies = signal<Company[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  selectedCompany = signal<Company | undefined>(undefined);
  selectedResourceType = signal<ResourceType | undefined>(undefined);
  
  primaryFile = signal<File | null>(null);
  attachmentFiles = signal<File[]>([]);
  isSubmitting = signal(false);

  // Parent document search
  isSearchingParents = signal(false);
  parentSearchQuery = signal('');
  parentSearchResults = signal<Document[]>([]);

  // File upload options - revert to plain properties
  maxFileSize = 100 * 1024 * 1024; // 100MB
  allowedFileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'zip', 'rar'];

  primaryFileProgress = signal<FileUploadProgress[]>([]);  attachmentsProgress = signal<FileUploadProgress[]>([]);
  
  companyForm: FormGroup = this.fb.group({
    companyId: ['', Validators.required]
  });

  resourceTypeForm: FormGroup = this.fb.group({
    resourceTypeId: ['', Validators.required]
  });

  metadataForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    resourceCode: ['', Validators.required],
    tags: [''],
    parentSearch: [''],
    parentId: [null]
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
    this.loadCompanies();
    this.setupParentDocumentSearch();
  }

  setupParentDocumentSearch(): void {
    this.metadataForm.get('parentSearch')?.valueChanges.pipe(
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
          this.metadataForm.patchValue({ parentId: value.id });
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
    return this.documentService.list({
      titleContains: query,
      page: 0,
      size: 10
    }).pipe(
      map(page => page.content)
    );
  }

  displayParentFn(doc: Document): string {
    return doc ? `${doc.title} (${doc.resourceCode})` : '';
  }

  clearParentSelection(): void {
    this.metadataForm.patchValue({
      parentSearch: '',
      parentId: null
    });
    this.parentSearchResults.set([]);
  }

  loadCompanies(): void {
    this.companyService.getAccessibleCompanies().subscribe({
      next: companies => {
        this.companies.set(companies);
        if (companies.length === 0) {
          this.snackbar.info('No companies are accessible to you. Please contact your administrator for access.');
        }
      },
      error: err => {
        this.snackbar.error('Failed to load companies: ' + (err.error?.message || err.message));
      }
    });
  }

  onCompanyChange(companyId: number): void {
    const company = this.companies().find(c => c.id === companyId);
    this.selectedCompany.set(company);
    this.selectedResourceType.set(undefined);
    this.resourceTypeForm.patchValue({ resourceTypeId: '' });
    
    if (company) {
      this.loadResourceTypesForCompany(companyId);
    }
  }
  loadResourceTypesForCompany(companyId: number): void {
    console.log('Loading accessible resource types for company ID:', companyId);
    this.resourceTypeService.getAccessibleForCompany(companyId).subscribe({
      next: types => {
        console.log('Accessible resource types received:', types);
        
        this.resourceTypes.set(types);
        if (types.length === 0) {
          this.snackbar.info('No document types are accessible to you in this company. Please contact your administrator for access.');
        }
      },
      error: err => {
        console.error('Error loading accessible resource types:', err);
        this.snackbar.error('Failed to load document types: ' + (err.error?.message || err.message));
      }
    });
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
    const resourceType = this.resourceTypes().find(rt => rt.id === resourceTypeId);
    
    if (resourceType) {
      // Debug the initial resource type
      console.log('Selected resource type from dropdown:', resourceType);
      console.log('Fields available from dropdown selection:', resourceType.fields);
      
      // Check if the fields are already available from the list
      if (resourceType.fields && resourceType.fields.length > 0) {
        console.log('Using fields already available from dropdown selection');
        this.selectedResourceType.set(resourceType);
        
        // Generate resource code
        const baseCode = resourceType.code;
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const generatedCode = `${baseCode}-${timestamp}-${randomSuffix}`;
        
        this.metadataForm.patchValue({ resourceCode: generatedCode });
        
        // Build the form with the fields we already have
        this.buildMetadataForm(resourceType.fields);
      } else {
        // If fields aren't available in the dropdown selection, fetch the complete resource type
        console.log('Fields not available from dropdown, fetching complete resource type');
        this.resourceTypeService.getWithFields(resourceTypeId).subscribe({
          next: (fullResourceType) => {
            console.log('Fetched resource type with fields:', fullResourceType);
            console.log('Fields from backend:', fullResourceType.fields);
            
            this.selectedResourceType.set(fullResourceType);
            
            // Generate resource code based on the resource type code
            const baseCode = fullResourceType.code;
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const generatedCode = `${baseCode}-${timestamp}-${randomSuffix}`;
            
            // Update the resource code in the form
            this.metadataForm.patchValue({ resourceCode: generatedCode });
            
            // Initialize dynamic form fields
            if (fullResourceType.fields && fullResourceType.fields.length > 0) {
              this.buildMetadataForm(fullResourceType.fields);
            } else {
              // Reset any previously added dynamic fields
              const currentControls = { ...this.metadataForm.controls };
              Object.keys(currentControls).forEach(key => {
                if (key !== 'title' && key !== 'resourceCode' && key !== 'tags' && key !== 'parentSearch' && key !== 'parentId') {
                  this.metadataForm.removeControl(key);
                }
              });
              
              // If fields is empty array (not null/undefined), inform user that the resource type has no fields
              if (Array.isArray(fullResourceType.fields) && fullResourceType.fields.length === 0) {
                this.snackbar.info(`Resource type '${fullResourceType.code}' has no custom fields defined.`);
              }
            }
          },
          error: (err) => {
            this.snackbar.error('Failed to load resource type details: ' + (err.error?.message || err.message));
          }
        });
      }
    } else {
      this.selectedResourceType.set(undefined);
    }
  }

  buildMetadataForm(fields: FieldDefinitionDto[]): void {
    // Remove existing dynamic field controls
    const currentControls = { ...this.metadataForm.controls };
    Object.keys(currentControls).forEach(key => {
      if (key !== 'title' && key !== 'resourceCode' && key !== 'tags' && key !== 'parentSearch' && key !== 'parentId') {
        this.metadataForm.removeControl(key);
      }
    });
    
    // Add new field controls
    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      let defaultValue: any;
      
      switch (field.kind) {
        case FieldType.BOOLEAN:
          defaultValue = false;
          break;
        case FieldType.NUMBER:
          defaultValue = null;
          break;
        case FieldType.DATE:
          defaultValue = null;
          break;
        case FieldType.SELECT:
          defaultValue = field.options && field.options.length > 0 ? field.options[0] : '';
          break;
        case FieldType.TEXTAREA:
          defaultValue = '';
          break;
        case FieldType.TEXT:
        default:
          defaultValue = '';
          break;
      }
      
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
    if (this.metadataForm.invalid || !this.primaryFile()) return;
    
    const formValue = this.metadataForm.value;
    const pFile = this.primaryFile();
    if (!pFile) {
      this.snackbar.error('Primary file is required');
      return;
    }
    
    // Extract specific fields from the form
    const { title, resourceCode, tags, parentId, parentSearch, ...fieldValues } = formValue;
    
    // Extract tags from comma-separated string
    const tagNames = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
    
    // Prepare document DTO
    const documentDto: CreateDocumentDto = {
      title,
      resourceTypeId: this.resourceTypeForm.value.resourceTypeId,
      resourceCode,
      mimeType: pFile.type,
      parentId: parentId || undefined,
      fieldValues: this.convertFieldValuesToStrings(fieldValues),
      tagNames
    };
    
    this.isSubmitting.set(true);

    this.documentService.create(documentDto, pFile, this.attachmentFiles()).subscribe({
      next: (newDoc: Document) => {
        this.isSubmitting.set(false);
        this.snackbar.success(`Document '${newDoc.title}' created successfully!`);
        if (this.dialogRef) {
          this.dialogRef.close('created');
        } else {
          this.router.navigate(['/documents', newDoc.id]);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create document. ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  // Helper method to convert all field values to strings as required by the backend
  private convertFieldValuesToStrings(fieldValues: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Get resource type to check field types
    const resourceType = this.selectedResourceType();
    
    for (const key in fieldValues) {
      if (fieldValues.hasOwnProperty(key)) {
        let value = fieldValues[key];
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          result[key] = '';
          continue;
        }
        
        // Check if this is a date field
        const isDateField = resourceType?.fields?.some(
          field => field.name === key && field.kind === FieldType.DATE
        );
        
        if (isDateField) {
          // For date fields, ensure we have a proper YYYY-MM-DD format without time
          if (value instanceof Date) {
            // Format as YYYY-MM-DD
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            result[key] = `${year}-${month}-${day}`;
          } else if (typeof value === 'string') {
            // Handle string date input - try to parse and format
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                result[key] = `${year}-${month}-${day}`;
              } else {
                result[key] = value; // Keep original if parsing fails
              }
            } catch (e) {
              result[key] = value; // Keep original if parsing fails
            }
          } else {
            result[key] = String(value); // Fallback
          }
        } else if (typeof value === 'boolean') {
          // Handle boolean values
          result[key] = value ? 'true' : 'false';
        } else {
          // Handle all other types
          result[key] = String(value);
        }
      }
    }
    return result;
  }
}
