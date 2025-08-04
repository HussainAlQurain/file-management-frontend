import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule, NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzResultModule } from 'ng-zorro-antd/result';

import { BulkImportService } from '../../core/services/bulk-import.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { BulkImportRequestDto, BulkImportResultDto, BulkImportErrorDto } from '../../core/models/bulk-import.model';
import { ResourceType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';

@Component({
  selector: 'app-document-bulk-import-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzSpinModule,
    NzSelectModule,
    NzFormModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzAlertModule,
    NzTableModule,
    NzTagModule,
    NzStepsModule,
    NzCheckboxModule,
    NzCollapseModule,
    NzDescriptionsModule,
    NzGridModule,
    NzSpaceModule,
    NzResultModule
  ],
  template: `
    <div class="bulk-import-container">
      <!-- Page Header -->
      <nz-page-header
        class="site-page-header"
        nzTitle="Bulk Import Documents"
        nzSubtitle="Import multiple documents from Excel file">
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a routerLink="/documents">Documents</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Bulk Import</nz-breadcrumb-item>
        </nz-breadcrumb>

        <nz-page-header-extra>
          <button nz-button nzType="default" routerLink="/documents">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Documents
          </button>
        </nz-page-header-extra>
      </nz-page-header>

      <!-- Steps -->
      <nz-card class="steps-card">
        <nz-steps [nzCurrent]="currentStep()" nzSize="small">
          <nz-step nzTitle="Select Resource Type" nzDescription="Choose document type and download template"></nz-step>
          <nz-step nzTitle="Upload Excel File" nzDescription="Fill template and upload your data"></nz-step>
          <nz-step nzTitle="Review & Import" nzDescription="Validate and process the import"></nz-step>
          <nz-step nzTitle="Results" nzDescription="View import results"></nz-step>
        </nz-steps>
      </nz-card>

      <!-- Step 1: Resource Type Selection -->
      <nz-card *ngIf="currentStep() === 0" nzTitle="Step 1: Select Resource Type & Download Template">
        <form nz-form [formGroup]="resourceTypeForm" nzLayout="vertical">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Company</nz-form-label>
                <nz-form-control [nzErrorTip]="'Please select a company'">
                  <nz-select 
                    formControlName="companyId" 
                    nzPlaceHolder="Select a company"
                    [nzLoading]="isLoadingCompanies()">
                    <nz-option 
                      *ngFor="let company of companies()" 
                      [nzValue]="company.id" 
                      [nzLabel]="company.name">
                    </nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>

            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Document Type</nz-form-label>
                <nz-form-control [nzErrorTip]="'Please select a document type'">
                  <nz-select 
                    formControlName="resourceTypeId" 
                    nzPlaceHolder="Select document type"
                    [nzLoading]="isLoadingResourceTypes()"
                    (ngModelChange)="onResourceTypeChange($event)">
                    <nz-option 
                      *ngFor="let type of filteredResourceTypes" 
                      [nzValue]="type.id" 
                      [nzLabel]="type.name">
                    </nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <!-- Resource Type Fields Preview -->
          <div *ngIf="selectedResourceType()" class="mt-4">
            <nz-divider nzText="Document Fields Preview" nzOrientation="left"></nz-divider>
            <nz-descriptions nzBordered nzSize="small">
              <nz-descriptions-item 
                *ngFor="let field of selectedResourceType()!.fields" 
                [nzTitle]="field.label || field.name"
                [nzSpan]="1">
                <nz-tag [nzColor]="getFieldTypeColor(field.kind)">{{ field.kind }}</nz-tag>
                <nz-tag *ngIf="field.required" nzColor="red">Required</nz-tag>
                <div *ngIf="field.options && field.options.length > 0" class="field-options">
                  Options: {{ field.options.join(', ') }}
                </div>
              </nz-descriptions-item>
            </nz-descriptions>
          </div>

          <nz-divider></nz-divider>

          <nz-space>
            <button 
              *nzSpaceItem
              nz-button 
              nzType="primary" 
              [nzLoading]="isDownloadingTemplate()"
              [disabled]="!resourceTypeForm.get('resourceTypeId')?.value"
              (click)="downloadTemplate()">
              <nz-icon nzType="download"></nz-icon>
              Download Excel Template
            </button>
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default" 
              [disabled]="!resourceTypeForm.get('resourceTypeId')?.value"
              (click)="nextStep()">
              <nz-icon nzType="arrow-right"></nz-icon>
              Next: Upload File
            </button>
          </nz-space>
        </form>
      </nz-card>

      <!-- Step 2: File Upload -->
      <nz-card *ngIf="currentStep() === 1" nzTitle="Step 2: Upload Excel File">
        <nz-alert
          nzType="info"
          nzMessage="Upload Instructions"
          nzDescription="Upload the Excel file you filled with document data. The file will be validated before processing."
          nzShowIcon
          class="mb-4">
        </nz-alert>

        <div nz-row [nzGutter]="[16, 16]">
          <div nz-col [nzSpan]="12">
            <!-- Hidden file input for fallback -->
            <input 
              #fileInput 
              type="file" 
              accept=".xlsx,.xls" 
              (change)="onDirectFileChange($event)"
              style="display: none;">
            
            <nz-upload
              nzType="drag"
              [nzMultiple]="false"
              nzAccept=".xlsx,.xls"
              [nzFileList]="fileList()"
              [nzBeforeUpload]="beforeUpload"
              (nzChange)="onFileChange($event)"
              [nzCustomRequest]="customUploadRequest"
              nzShowUploadList="true">
              <p class="ant-upload-drag-icon">
                <nz-icon nzType="inbox"></nz-icon>
              </p>
              <p class="ant-upload-text">Click or drag Excel file to this area to upload</p>
              <p class="ant-upload-hint">Support for .xlsx and .xls files only</p>
            </nz-upload>
            
            <!-- Fallback button -->
            <div class="mt-3">
              <button nz-button nzType="dashed" nzBlock (click)="fileInput.click()">
                <nz-icon nzType="folder-open"></nz-icon>
                Or click here to browse files
              </button>
            </div>
          </div>

          <div nz-col [nzSpan]="12">
            <div *ngIf="uploadedFile()" class="file-info">
              <nz-descriptions nzBordered nzSize="small" nzTitle="File Information">
                <nz-descriptions-item nzTitle="Filename">{{ uploadedFile()!.name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Size">{{ formatFileSize(uploadedFile()!.size) }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Type">{{ uploadedFile()!.type || 'Unknown' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </div>
        </div>

        <nz-divider></nz-divider>

        <nz-space>
          <button *nzSpaceItem nz-button nzType="default" (click)="previousStep()">
            <nz-icon nzType="arrow-left"></nz-icon>
            Previous
          </button>
          <button 
            *nzSpaceItem
            nz-button 
            nzType="primary" 
            [disabled]="!uploadedFile()"
            (click)="validateFile()">
            <nz-icon nzType="check-circle"></nz-icon>
            Validate & Continue
          </button>
        </nz-space>
      </nz-card>

      <!-- Step 3: Review & Import Options -->
      <nz-card *ngIf="currentStep() === 2" nzTitle="Step 3: Review & Import Options">
        <!-- Validation Results -->
        <div *ngIf="validationResult()" class="validation-results mb-4">
          <nz-alert
            [nzType]="validationResult()!.errors.length === 0 ? 'success' : 'warning'"
            [nzMessage]="validationResult()!.errors.length === 0 ? 'File validation successful' : 'File validation completed with issues'"
            [nzDescription]="'Found ' + validationResult()!.totalRows + ' data rows'"
            nzShowIcon>
          </nz-alert>

          <!-- Validation Errors -->
          <div *ngIf="validationResult()!.errors.length > 0" class="mt-4">
            <nz-collapse>
              <nz-collapse-panel 
                nzHeader="Validation Issues" 
                [nzActive]="true"
                [nzExtra]="errorCountTemplate">
                <ng-template #errorCountTemplate>
                  <nz-tag nzColor="orange">{{ validationResult()!.errors.length }} issues</nz-tag>
                </ng-template>

                <nz-table [nzData]="validationResult()!.errors" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Issue</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let error of validationResult()!.errors">
                      <td>{{ error.rowNumber }}</td>
                      <td>{{ error.field }}</td>
                      <td>{{ error.value }}</td>
                      <td>{{ error.errorMessage }}</td>
                      <td>
                        <nz-tag [nzColor]="error.severity === 'ERROR' ? 'red' : 'orange'">
                          {{ error.severity }}
                        </nz-tag>
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </nz-collapse-panel>
            </nz-collapse>
          </div>
        </div>

        <!-- Import Options -->
        <form nz-form [formGroup]="importOptionsForm" nzLayout="vertical">
          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox formControlName="skipInvalidRows">
                Skip invalid rows and continue with valid data
              </label>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox formControlName="generateResourceCodes">
                Auto-generate resource codes for empty values
              </label>
            </nz-form-control>
          </nz-form-item>
        </form>

        <nz-divider></nz-divider>

        <nz-space>
          <button *nzSpaceItem nz-button nzType="default" (click)="previousStep()">
            <nz-icon nzType="arrow-left"></nz-icon>
            Previous
          </button>
          <button 
            *nzSpaceItem
            nz-button 
            nzType="primary" 
            [nzLoading]="isProcessing()"
            [disabled]="!canProceedWithImport()"
            (click)="processImport()">
            <nz-icon nzType="cloud-upload"></nz-icon>
            Start Import
          </button>
        </nz-space>
      </nz-card>

      <!-- Step 4: Results -->
      <nz-card *ngIf="currentStep() === 3" nzTitle="Step 4: Import Results">
        <div *ngIf="importResult()">
          <!-- Success Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows === 0"
            nzStatus="success"
            [nzTitle]="'Successfully imported ' + importResult()!.successfulRows + ' documents'"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="/documents">
                <nz-icon nzType="unordered-list"></nz-icon>
                View Documents
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="plus"></nz-icon>
                Import More
              </button>
            </div>
          </nz-result>

          <!-- Partial Success/Failure Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows > 0 && importResult()!.successfulRows > 0"
            nzStatus="warning"
            [nzTitle]="'Partially completed: ' + importResult()!.successfulRows + ' successful, ' + importResult()!.failedRows + ' failed'"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="/documents">
                <nz-icon nzType="unordered-list"></nz-icon>
                View Documents
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="plus"></nz-icon>
                Try Again
              </button>
            </div>
          </nz-result>

          <!-- Complete Failure Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows > 0 && importResult()!.successfulRows === 0"
            nzStatus="error"
            [nzTitle]="'Import failed: ' + importResult()!.failedRows + ' rows had errors'"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="previousStep()">
                <nz-icon nzType="arrow-left"></nz-icon>
                Back to Review
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="reload"></nz-icon>
                Start Over
              </button>
            </div>
          </nz-result>

          <!-- Import Errors -->
          <div *ngIf="importResult()!.errors.length > 0" class="import-errors mt-4">
            <nz-collapse>
              <nz-collapse-panel 
                nzHeader="Import Errors" 
                [nzExtra]="errorCountTemplate">
                <ng-template #errorCountTemplate>
                  <nz-tag nzColor="red">{{ importResult()!.errors.length }} errors</nz-tag>
                </ng-template>

                <nz-table [nzData]="importResult()!.errors" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Error</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let error of importResult()!.errors">
                      <td>{{ error.rowNumber }}</td>
                      <td>{{ error.field }}</td>
                      <td>{{ error.value }}</td>
                      <td>{{ error.errorMessage }}</td>
                      <td>
                        <nz-tag [nzColor]="error.severity === 'ERROR' ? 'red' : 'orange'">
                          {{ error.severity }}
                        </nz-tag>
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </nz-collapse-panel>
            </nz-collapse>
          </div>

          <!-- Created Documents Summary -->
          <div *ngIf="importResult()!.createdDocuments.length > 0" class="created-documents mt-4">
            <nz-collapse>
              <nz-collapse-panel 
                nzHeader="Created Documents" 
                [nzExtra]="successCountTemplate">
                <ng-template #successCountTemplate>
                  <nz-tag nzColor="green">{{ importResult()!.createdDocuments.length }} created</nz-tag>
                </ng-template>

                <nz-table [nzData]="importResult()!.createdDocuments" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Resource Code</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let doc of importResult()!.createdDocuments">
                      <td>{{ doc.title }}</td>
                      <td>
                        <nz-tag>{{ doc.resourceCode }}</nz-tag>
                      </td>
                      <td>{{ doc.createdAt | date:'short' }}</td>
                      <td>
                        <a nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id]">
                          <nz-icon nzType="eye"></nz-icon>
                          View
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </nz-collapse-panel>
            </nz-collapse>
          </div>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .bulk-import-container {
      padding: 0;
    }

    .site-page-header {
      background: #fff;
      margin: -24px -24px 24px;
      padding: 16px 24px;
    }

    .steps-card {
      margin-bottom: 24px;
    }

    .file-info {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
    }

    .field-options {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .validation-results {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
    }

    .import-errors, .created-documents {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
    }

    ::ng-deep .ant-upload.ant-upload-drag {
      border-radius: 6px;
    }

    ::ng-deep .ant-upload-drag .ant-upload-btn {
      padding: 40px 16px !important;
    }

    ::ng-deep .ant-result-extra {
      margin-top: 24px;
    }

    ::ng-deep .ant-result-extra .ant-btn {
      margin-right: 8px;
    }
  `],
  providers: [NzMessageService]
})
export class DocumentBulkImportPageComponent implements OnInit {
  private bulkImportService = inject(BulkImportService);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);

  // Signals
  currentStep = signal(0);
  companies = signal<Company[]>([]);
  allResourceTypes = signal<ResourceType[]>([]);
  uploadedFile = signal<File | null>(null);
  selectedResourceType = signal<ResourceType | null>(null);
  validationResult = signal<BulkImportResultDto | null>(null);
  importResult = signal<BulkImportResultDto | null>(null);
  fileList = signal<NzUploadFile[]>([]);
  
  // Loading states
  isLoadingCompanies = signal(false);
  isLoadingResourceTypes = signal(false);
  isDownloadingTemplate = signal(false);
  isValidating = signal(false);
  isProcessing = signal(false);

  // Forms
  resourceTypeForm: FormGroup;
  importOptionsForm: FormGroup;

  // File upload handler
  beforeUpload = (file: NzUploadFile): boolean => {
    console.log('beforeUpload called with file:', file);
    
    // Extract the actual File object and process it immediately
    let actualFile: File | null = null;
    
    if (file.originFileObj) {
      actualFile = file.originFileObj as File;
    } else if ((file as any).file) {
      actualFile = (file as any).file as File;
    } else if (file instanceof File) {
      actualFile = file;
    }
    
    if (actualFile) {
      console.log('Processing file in beforeUpload:', actualFile.name);
      this.processSelectedFile(actualFile, file);
    } else {
      console.error('Could not extract file from beforeUpload');
      this.message.error('Failed to process the selected file');
    }
    
    // Prevent automatic upload, we handle it manually
    return false;
  };

  // Custom upload request to handle files manually
  customUploadRequest = (item: any): any => {
    console.log('customUploadRequest called with:', item);
    
    // Mark the upload as successful immediately since we handle file processing in beforeUpload
    if (item.onSuccess) {
      setTimeout(() => {
        item.onSuccess({}, item.file);
      }, 0);
    }
    
    return { unsubscribe: () => {} };
  };

  constructor() {
    this.resourceTypeForm = this.fb.group({
      companyId: [null, [Validators.required]],
      resourceTypeId: [null, [Validators.required]]
    });

    this.importOptionsForm = this.fb.group({
      skipInvalidRows: [true],
      generateResourceCodes: [true]
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadResourceTypes();
    this.initializeFromQueryParams();
  }

  initializeFromQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['companyId']) {
          this.resourceTypeForm.patchValue({ companyId: +params['companyId'] });
        }
        if (params['resourceTypeId']) {
          this.resourceTypeForm.patchValue({ resourceTypeId: +params['resourceTypeId'] });
          this.onResourceTypeChange(+params['resourceTypeId']);
        }
      });
  }

  loadCompanies(): void {
    this.isLoadingCompanies.set(true);
    this.companyService.getAccessibleCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies) => {
          this.companies.set(companies);
          this.isLoadingCompanies.set(false);
        },
        error: () => {
          this.isLoadingCompanies.set(false);
          this.message.error('Failed to load companies');
        }
      });
  }

  loadResourceTypes(): void {
    this.isLoadingResourceTypes.set(true);
    this.resourceTypeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => {
          this.allResourceTypes.set(types);
          this.isLoadingResourceTypes.set(false);
        },
        error: () => {
          this.isLoadingResourceTypes.set(false);
          this.message.error('Failed to load resource types');
        }
      });
  }

  get filteredResourceTypes(): ResourceType[] {
    const companyId = this.resourceTypeForm.get('companyId')?.value;
    if (!companyId) return [];
    
    return this.allResourceTypes().filter(type => type.companyId === companyId);
  }

  onResourceTypeChange(resourceTypeId: number): void {
    const resourceType = this.allResourceTypes().find(type => type.id === resourceTypeId);
    this.selectedResourceType.set(resourceType || null);
  }

  downloadTemplate(): void {
    const resourceTypeId = this.resourceTypeForm.get('resourceTypeId')?.value;
    if (!resourceTypeId) return;

    this.isDownloadingTemplate.set(true);
    this.bulkImportService.generateExcelTemplate(resourceTypeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const resourceType = this.selectedResourceType();
          const filename = `${resourceType?.code || 'template'}_bulk_import_template.xlsx`;
          this.bulkImportService.downloadBlob(blob, filename);
          this.isDownloadingTemplate.set(false);
          this.message.success('Template downloaded successfully');
        },
        error: () => {
          this.isDownloadingTemplate.set(false);
          this.message.error('Failed to download template');
        }
      });
  }

  onFileChange(info: NzUploadChangeParam): void {
    console.log('File change event:', info);
    console.log('Info type:', info.type);
    console.log('File list:', info.fileList);
    
    // Update the file list for display purposes
    let newFileList = [...info.fileList];
    
    // Limit to 1 file
    newFileList = newFileList.slice(-1);
    
    if (newFileList.length > 0) {
      const nzFile = newFileList[0];
      console.log('Updating file list with:', nzFile);
      
      // Just update the file list, processing is done in beforeUpload
      this.fileList.set(newFileList);
      
      // Only process if the file wasn't already processed in beforeUpload
      if (!this.uploadedFile() && info.type === 'success') {
        // Get the actual File object as fallback
        let file: File | null = null;
        
        if (nzFile.originFileObj) {
          file = nzFile.originFileObj as File;
        } else if ((nzFile as any).file) {
          file = (nzFile as any).file as File;
        } else if (nzFile instanceof File) {
          file = nzFile;
        }
        
        console.log('Fallback processing file:', file);
        
        if (file) {
          this.processSelectedFile(file, nzFile);
        }
      }
    } else {
      console.log('No files in list, clearing state');
      this.fileList.set([]);
      this.uploadedFile.set(null);
    }
  }

  onDirectFileChange(event: Event): void {
    console.log('Direct file input change event');
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Direct file selected:', file);
      
      // Create a mock NzUploadFile for consistency
      const nzFile: NzUploadFile = {
        uid: Date.now().toString(),
        name: file.name,
        status: 'done',
        originFileObj: file
      };
      
      this.processSelectedFile(file, nzFile);
    }
  }

  private processSelectedFile(file: File, nzFile?: NzUploadFile): void {
    console.log('Processing selected file:', file.name);
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.xlsx') || 
                       file.name.toLowerCase().endsWith('.xls');
    
    if (!isValidType) {
      this.message.error('Please select a valid Excel file (.xlsx or .xls)');
      this.fileList.set([]);
      this.uploadedFile.set(null);
      return;
    }
    
    // Update file list if we have an NzUploadFile
    if (nzFile) {
      nzFile.status = 'done';
      this.fileList.set([nzFile]);
    } else {
      // Create a simple file list entry for direct upload
      const mockNzFile: NzUploadFile = {
        uid: Date.now().toString(),
        name: file.name,
        status: 'done',
        originFileObj: file
      };
      this.fileList.set([mockNzFile]);
    }
    
    this.uploadedFile.set(file);
    this.message.success(`${file.name} file selected successfully`);
    console.log('File stored successfully:', file.name);
  }

  validateFile(): void {
    const file = this.uploadedFile();
    const resourceTypeId = this.resourceTypeForm.get('resourceTypeId')?.value;
    
    if (!file || !resourceTypeId) return;

    this.isValidating.set(true);
    this.bulkImportService.validateExcelFile(file, resourceTypeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.validationResult.set(result);
          this.isValidating.set(false);
          this.nextStep();
          
          if (result.errors.length === 0) {
            this.message.success('File validation successful');
          } else {
            this.message.warning(`File validated with ${result.errors.length} issues`);
          }
        },
        error: () => {
          this.isValidating.set(false);
          this.message.error('Failed to validate file');
        }
      });
  }

  canProceedWithImport(): boolean {
    const validation = this.validationResult();
    if (!validation) return false;
    
    const hasErrors = validation.errors.some(error => error.severity === 'ERROR');
    const skipInvalidRows = this.importOptionsForm.get('skipInvalidRows')?.value;
    
    return !hasErrors || skipInvalidRows;
  }

  processImport(): void {
    const file = this.uploadedFile();
    const resourceTypeId = this.resourceTypeForm.get('resourceTypeId')?.value;
    const companyId = this.resourceTypeForm.get('companyId')?.value;
    
    if (!file || !resourceTypeId) return;

    const request: BulkImportRequestDto = {
      resourceTypeId,
      companyId,
      skipInvalidRows: this.importOptionsForm.get('skipInvalidRows')?.value,
      generateResourceCodes: this.importOptionsForm.get('generateResourceCodes')?.value
    };

    this.isProcessing.set(true);
    this.bulkImportService.processBulkImport(file, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.importResult.set(result);
          this.isProcessing.set(false);
          this.nextStep();
          
          if (result.failedRows === 0) {
            this.message.success(`Successfully imported ${result.successfulRows} documents`);
          } else if (result.successfulRows > 0) {
            this.message.warning(`Partially completed: ${result.successfulRows} successful, ${result.failedRows} failed`);
          } else {
            this.message.error(`Import failed: ${result.failedRows} rows had errors`);
          }
        },
        error: () => {
          this.isProcessing.set(false);
          this.message.error('Failed to process import');
        }
      });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  startNewImport(): void {
    // Reset all state
    this.currentStep.set(0);
    this.uploadedFile.set(null);
    this.fileList.set([]);
    this.selectedResourceType.set(null);
    this.validationResult.set(null);
    this.importResult.set(null);
    this.resourceTypeForm.reset();
    this.importOptionsForm.patchValue({
      skipInvalidRows: true,
      generateResourceCodes: true
    });
  }

  getFieldTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'TEXT': 'blue',
      'NUMBER': 'green',
      'DATE': 'orange',
      'BOOLEAN': 'purple',
      'SELECT': 'cyan',
      'TEXTAREA': 'geekblue'
    };
    return colors[type] || 'default';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 