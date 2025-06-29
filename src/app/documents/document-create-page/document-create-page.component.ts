import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// NG-ZORRO imports
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';
import { Document, CreateDocumentDto } from '../../core/models/document.model';

@Component({
  selector: 'app-document-create-page',
  standalone: true,  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzStepsModule,
    NzCardModule,
    NzSpinModule,
    NzIconModule,
    NzUploadModule,
    NzAlertModule,
    NzDividerModule,
    NzCheckboxModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzAutocompleteModule,
    NzTagModule,
    NzSpaceModule,
    NzTypographyModule,
    NzEmptyModule,
    NzPageHeaderModule
  ],
  template: `
    <div class="create-document-container">
      <!-- Page Header -->
      <nz-page-header 
        nzBackIcon
        (nzBack)="navigateBack()"
        nzTitle="Create New Document"
        nzSubtitle="Follow the steps to create a new document">
      </nz-page-header>

      <nz-card>
        <nz-steps [nzCurrent]="currentStep" nzSize="small">
          <nz-step nzTitle="Select Company"></nz-step>
          <nz-step nzTitle="Document Type"></nz-step>
          <nz-step nzTitle="Document Details"></nz-step>
          <nz-step nzTitle="Upload File"></nz-step>
        </nz-steps>
        
        <div class="steps-content">
          <!-- Step 1: Select Company -->
          <div *ngIf="currentStep === 0" class="step-container">
            <form nz-form [formGroup]="companyForm" nzLayout="vertical">
              <h3 nz-typography>Select Company</h3>
              <p nz-typography nzType="secondary">Choose the company this document belongs to</p>
              
              <nz-form-item>
                <nz-form-label nzRequired>Company</nz-form-label>
                <nz-form-control nzErrorTip="Please select a company">
                  <nz-select 
                    formControlName="companyId" 
                    nzShowSearch
                    nzPlaceHolder="Select a company"
                    nzSize="large"
                    (ngModelChange)="onCompanyChange($event)">
                    <nz-option 
                      *ngFor="let company of companies()" 
                      [nzValue]="company.id" 
                      [nzLabel]="company.name">
                      <span>{{ company.name }}</span>
                      <span *ngIf="company.description" class="option-desc">{{ company.description }}</span>
                    </nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </form>
          </div>

          <!-- Step 2: Select Resource Type -->
          <div *ngIf="currentStep === 1" class="step-container">
            <form nz-form [formGroup]="resourceTypeForm" nzLayout="vertical">
              <h3 nz-typography>Select Document Type</h3>
              <p nz-typography nzType="secondary">Choose the type of document you want to create</p>
              
              <nz-spin *ngIf="loadingResourceTypes" nzTip="Loading document types...">
                <div style="height: 200px;"></div>
              </nz-spin>
              
              <div *ngIf="!loadingResourceTypes">
                <nz-form-item>
                  <nz-form-label nzRequired>Document Type</nz-form-label>
                  <nz-form-control nzErrorTip="Please select a document type">
                    <nz-select 
                      formControlName="resourceTypeId" 
                      nzShowSearch
                      nzPlaceHolder="Select a document type"
                      nzSize="large"
                      (ngModelChange)="onResourceTypeChange($event)">
                      <nz-option 
                        *ngFor="let rt of resourceTypes()" 
                        [nzValue]="rt.id" 
                        [nzLabel]="rt.name">
                        <div class="resource-type-option">
                          <div class="option-title">{{ rt.name }}</div>
                          <div class="option-meta">
                            <nz-tag nzColor="blue">{{ rt.code }}</nz-tag>
                            <span *ngIf="rt.description" class="option-desc">{{ rt.description }}</span>
                          </div>
                        </div>
                      </nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
                
                <nz-empty 
                  *ngIf="resourceTypes().length === 0" 
                  nzNotFoundContent="No document types available for this company">
                </nz-empty>
              </div>
            </form>
          </div>

          <!-- Step 3: Fill Metadata -->
          <div *ngIf="currentStep === 2" class="step-container">
            <form nz-form [formGroup]="metadataForm" nzLayout="vertical">
              <h3 nz-typography>Document Details</h3>
              <p nz-typography nzType="secondary">Fill in the document information</p>
              
              <nz-divider></nz-divider>
              
              <!-- Basic Information -->
              <div class="form-section">
                <h4 nz-typography>Basic Information</h4>
                
                <nz-form-item>
                  <nz-form-label nzRequired>Title</nz-form-label>
                  <nz-form-control nzErrorTip="Title is required">
                    <input nz-input formControlName="title" placeholder="Enter document title" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Resource Code</nz-form-label>
                  <nz-form-control nzErrorTip="Resource code is required" nzExtra="Auto-generated based on document type">
                    <input nz-input formControlName="resourceCode" placeholder="Resource code" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Parent Document</nz-form-label>
                  <nz-form-control>
                    <input 
                      nz-input 
                      formControlName="parentSearch" 
                      placeholder="Search for parent document..."
                      [nzAutocomplete]="auto" />
                    <nz-autocomplete #auto>
                      <nz-auto-option 
                        *ngIf="isSearchingParents()" 
                        nzDisabled 
                        nzCustomContent>
                        <span nz-icon nzType="loading" nzTheme="outline"></span>
                        Searching...
                      </nz-auto-option>
                      <nz-auto-option 
                        *ngIf="!isSearchingParents() && parentSearchResults().length === 0 && parentSearchQuery().length > 0" 
                        nzDisabled 
                        nzCustomContent>
                        No documents found
                      </nz-auto-option>
                      <nz-auto-option 
                        *ngFor="let doc of parentSearchResults()" 
                        [nzValue]="doc" 
                        [nzLabel]="doc.title">
                        <div class="parent-option">
                          <div>{{ doc.title }}</div>
                          <div class="option-meta">
                            <nz-tag nzColor="cyan">{{ doc.resourceCode }}</nz-tag>
                          </div>
                        </div>
                      </nz-auto-option>
                    </nz-autocomplete>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Tags</nz-form-label>
                  <nz-form-control nzExtra="Separate tags with commas">
                    <input nz-input formControlName="tags" placeholder="Enter tags (comma separated)" />
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Custom Fields -->
              <div *ngIf="selectedResourceType()?.fields && selectedResourceType()!.fields!.length > 0" class="form-section">
                <nz-divider></nz-divider>
                <h4 nz-typography>Custom Fields</h4>
                
                <ng-container *ngFor="let field of selectedResourceType()!.fields">
                  <!-- Boolean Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.BOOLEAN">
                    <nz-form-control>
                      <label nz-checkbox [formControlName]="field.name">
                        {{ field.label || field.name }}
                        <span *ngIf="field.required" class="required-marker">*</span>
                      </label>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Date Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.DATE">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <nz-date-picker 
                        [formControlName]="field.name"
                        nzFormat="yyyy-MM-dd"
                        style="width: 100%;">
                      </nz-date-picker>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Select Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.SELECT">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <nz-select 
                        [formControlName]="field.name"
                        nzPlaceHolder="Select an option">
                        <nz-option 
                          *ngFor="let option of field.options" 
                          [nzValue]="option" 
                          [nzLabel]="option">
                        </nz-option>
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Textarea Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.TEXTAREA">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <textarea 
                        nz-input 
                        [formControlName]="field.name" 
                        [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                        [placeholder]="'Enter ' + (field.label || field.name)">
                      </textarea>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Number Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.NUMBER">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <nz-input-number 
                        [formControlName]="field.name"
                        [nzPlaceHolder]="'Enter ' + (field.label || field.name)"
                        style="width: 100%;">
                      </nz-input-number>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Text Field (default) -->
                  <nz-form-item *ngIf="!field.kind || field.kind === FieldType.TEXT">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <input 
                        nz-input 
                        [formControlName]="field.name"
                        [placeholder]="'Enter ' + (field.label || field.name)" />
                    </nz-form-control>
                  </nz-form-item>
                </ng-container>
              </div>

              <nz-alert 
                *ngIf="selectedResourceType()?.fields && selectedResourceType()!.fields!.length === 0"
                nzType="info" 
                nzMessage="No custom fields"
                nzDescription="This document type doesn't have any custom fields defined."
                [nzShowIcon]="true">
              </nz-alert>
            </form>
          </div>

          <!-- Step 4: Upload Primary File -->
          <div *ngIf="currentStep === 3" class="step-container">
            <h3 nz-typography>Upload Primary File</h3>
            <p nz-typography nzType="secondary">Upload the main file for this document</p>
            
            <nz-divider></nz-divider>
            
            <div class="upload-section">
              <nz-upload
                nzType="drag"
                [nzMultiple]="false"
                [nzBeforeUpload]="beforeUpload"
                [nzShowUploadList]="false"
                [nzAccept]="acceptFileTypes()">
                <p class="ant-upload-drag-icon">
                  <span nz-icon nzType="cloud-upload" nzTheme="outline"></span>
                </p>
                <p class="ant-upload-text">Click or drag file to this area to upload</p>
                <p class="ant-upload-hint">
                  Support for a single file upload. Maximum file size: {{ maxFileSize / (1024*1024) }}MB
                </p>
              </nz-upload>
              
              <div *ngIf="primaryFile()" class="file-info-card">
                <nz-card>
                  <div class="file-info-content">
                    <span nz-icon nzType="file" nzTheme="outline" class="file-icon"></span>
                    <div class="file-details">
                      <div class="file-name">{{ primaryFile()!.name }}</div>
                      <div class="file-meta">
                        <span>{{ getFileSize(primaryFile()!.size) }}</span>
                        <nz-divider nzType="vertical"></nz-divider>
                        <span>{{ primaryFile()!.type || 'Unknown type' }}</span>
                      </div>
                    </div>
                    <button nz-button nzType="text" nzDanger (click)="removePrimaryFile()">
                      <span nz-icon nzType="delete" nzTheme="outline"></span>
                    </button>
                  </div>
                </nz-card>
              </div>
              
              <nz-alert 
                nzType="info" 
                [nzMessage]="'Allowed file types: ' + allowedFileExtensions.join(', ')"
                [nzShowIcon]="true"
                style="margin-top: 16px;">
              </nz-alert>
            </div>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="steps-action">
          <button 
            nz-button 
            nzType="default" 
            (click)="previousStep()"
            *ngIf="currentStep > 0">
            <span nz-icon nzType="left" nzTheme="outline"></span>
            Previous
          </button>
          
          <button 
            nz-button 
            nzType="primary" 
            (click)="nextStep()"
            [disabled]="!canProceed()"
            *ngIf="currentStep < 3">
            Next
            <span nz-icon nzType="right" nzTheme="outline"></span>
          </button>
          
          <button 
            nz-button 
            nzType="primary" 
            (click)="onSubmit()"
            [nzLoading]="isSubmitting()"
            [disabled]="!canSubmit()"
            *ngIf="currentStep === 3">
            <span nz-icon nzType="check" nzTheme="outline"></span>
            Create Document
          </button>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .create-document-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .steps-content {
      margin-top: 32px;
      min-height: 400px;
    }

    .step-container {
      padding: 24px 0;
    }

    .steps-action {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h4 {
      margin-bottom: 16px;
    }

    .resource-type-option {
      padding: 4px 0;
    }

    .option-title {
      font-weight: 500;
    }

    .option-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .option-desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .parent-option {
      padding: 4px 0;
    }

    .upload-section {
      max-width: 500px;
      margin: 0 auto;
    }

    .file-info-card {
      margin-top: 24px;
    }

    .file-info-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-icon {
      font-size: 32px;
      color: #1890ff;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .file-meta {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .required-marker {
      color: #ff4d4f;
      margin-left: 4px;
    }

    ::ng-deep .ant-upload.ant-upload-drag {
      border-color: #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
    }

    ::ng-deep .ant-upload.ant-upload-drag:hover {
      border-color: #1890ff;
    }

    ::ng-deep .ant-form-item {
      margin-bottom: 16px;
    }
  `],
  providers: [NzMessageService]
})
export class DocumentCreatePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private documentService = inject(DocumentService);
  private snackbar = inject(SnackbarService);
  private message = inject(NzMessageService);

  FieldType = FieldType;

  companies = signal<Company[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  selectedCompany = signal<Company | undefined>(undefined);
  selectedResourceType = signal<ResourceType | undefined>(undefined);
  loadingResourceTypes = false;
  
  primaryFile = signal<File | null>(null);
  isSubmitting = signal(false);
  currentStep = 0;

  // Parent document search
  isSearchingParents = signal(false);
  parentSearchQuery = signal('');
  parentSearchResults = signal<Document[]>([]);

  // File upload options
  maxFileSize = 100 * 1024 * 1024; // 100MB
  allowedFileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'zip', 'rar'];

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

  // File upload handler
  beforeUpload = (file: any): boolean => {
    const isValidType = this.allowedFileExtensions.some(ext => 
      file.name.toLowerCase().endsWith('.' + ext)
    );
    
    if (!isValidType) {
      this.message.error(`File type not allowed. Allowed types: ${this.allowedFileExtensions.join(', ')}`);
      return false;
    }
    
    const isValidSize = file.size / 1024 / 1024 < (this.maxFileSize / 1024 / 1024);
    if (!isValidSize) {
      this.message.error(`File must be smaller than ${this.maxFileSize / (1024 * 1024)}MB!`);
      return false;
    }
    
    this.primaryFile.set(file);
    return false; // Prevent automatic upload
  };

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

  loadCompanies(): void {
    this.companyService.getAccessibleCompanies().subscribe({
      next: companies => {
        this.companies.set(companies);
        if (companies.length === 0) {
          this.message.warning('No companies are accessible to you. Please contact your administrator.');
        }
      },
      error: err => {
        this.message.error('Failed to load companies');
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
    this.loadingResourceTypes = true;
    this.resourceTypeService.getAccessibleForCompany(companyId).subscribe({
      next: types => {
        this.resourceTypes.set(types);
        this.loadingResourceTypes = false;
        if (types.length === 0) {
          this.message.info('No document types are accessible in this company.');
        }
      },
      error: err => {
        this.loadingResourceTypes = false;
        this.message.error('Failed to load document types');
      }
    });
  }

  onResourceTypeChange(resourceTypeId: number): void {
    const resourceType = this.resourceTypes().find(rt => rt.id === resourceTypeId);
    
    if (resourceType) {
      // Check if fields are already available
      if (resourceType.fields && resourceType.fields.length > 0) {
        this.selectedResourceType.set(resourceType);
        this.generateResourceCode(resourceType);
        this.buildMetadataForm(resourceType.fields);
      } else {
        // Fetch complete resource type with fields
        this.resourceTypeService.getWithFields(resourceTypeId).subscribe({
          next: (fullResourceType) => {
            this.selectedResourceType.set(fullResourceType);
            this.generateResourceCode(fullResourceType);
            this.buildMetadataForm(fullResourceType.fields || []);
          },
          error: () => {
            this.message.error('Failed to load document type details');
          }
        });
      }
    }
  }

  generateResourceCode(resourceType: ResourceType): void {
    const baseCode = resourceType.code;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${baseCode}-${timestamp}-${randomSuffix}`;
    
    this.metadataForm.patchValue({ resourceCode: generatedCode });
  }

  buildMetadataForm(fields: FieldDefinitionDto[]): void {
    // Reset form to base fields
    const currentValues = this.metadataForm.value;
    this.metadataForm = this.fb.group({
      title: [currentValues.title, Validators.required],
      resourceCode: [currentValues.resourceCode, Validators.required],
      tags: [currentValues.tags],
      parentSearch: [currentValues.parentSearch],
      parentId: [currentValues.parentId]
    });

    // Add dynamic fields
    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      let defaultValue: any = '';
      
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
        default:
          defaultValue = '';
      }
      
      this.metadataForm.addControl(field.name, this.fb.control(defaultValue, validators));
    });
  }

  removePrimaryFile(): void {
    this.primaryFile.set(null);
  }

  getFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.companyForm.valid;
      case 1:
        return this.resourceTypeForm.valid;
      case 2:
        return this.metadataForm.valid;
      case 3:
        return true;
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    return this.metadataForm.valid && this.primaryFile() !== null && !this.isSubmitting();
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/documents']);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);
    
    // Prepare field values
    const fieldValues = this.convertFieldValuesToStrings(
      Object.keys(this.metadataForm.value)
        .filter(key => !['title', 'resourceCode', 'tags', 'parentSearch', 'parentId'].includes(key))
        .reduce((acc, key) => {
          acc[key] = this.metadataForm.value[key];
          return acc;
        }, {} as Record<string, any>)
    );

    // Prepare tags
    const tags = this.metadataForm.value.tags 
      ? this.metadataForm.value.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const dto: CreateDocumentDto = {
      title: this.metadataForm.value.title,
      resourceCode: this.metadataForm.value.resourceCode,
      resourceTypeId: this.resourceTypeForm.value.resourceTypeId,
      parentId: this.metadataForm.value.parentId,
      fieldValues,
      tagNames: tags
    };

    const loading = this.message.loading('Creating document...', { nzDuration: 0 });
    
    this.documentService.create(dto, this.primaryFile()!).subscribe({
      next: (createdDoc: Document) => {
        this.message.remove(loading.messageId);
        this.message.success('Document created successfully');
        this.router.navigate(['/documents', createdDoc.id]);
      },
      error: (err: any) => {
        this.message.remove(loading.messageId);
        this.message.error('Failed to create document: ' + (err.error?.message || err.message));
        this.isSubmitting.set(false);
      }
    });
  }

  private convertFieldValuesToStrings(fieldValues: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(fieldValues)) {
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'boolean') {
        result[key] = value.toString();
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = String(value);
      }
    }
    
    return result;
  }
}
