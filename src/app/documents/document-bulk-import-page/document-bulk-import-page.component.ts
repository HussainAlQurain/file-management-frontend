import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
import { TranslationService } from '../../core/services/translation.service';
import { ResourceTypeDuplicationService } from '../../core/services/resource-type-duplication.service';
import { BulkImportRequestDto, BulkImportResultDto, BulkImportErrorDto, MultiCompanyImportResultDto, BulkAttachmentDto } from '../../core/models/bulk-import.model';
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
    TranslateModule,
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
    <div class="bulk-import-container" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <!-- Title and Actions Row -->
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">{{ 'bulk_import.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'bulk_import.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <nz-space nzSize="middle">
                <button *nzSpaceItem nz-button nzType="default" routerLink="/documents" class="action-button">
                  <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                  <span>{{ 'bulk_import.back_to_documents' | translate }}</span>
                </button>
              </nz-space>
            </div>
          </div>
          
          <!-- Breadcrumb -->
          <div class="breadcrumb-section" [class.rtl-breadcrumb]="translationService.isRTL()">
            <nz-breadcrumb>
              <nz-breadcrumb-item>
                <a routerLink="/documents">{{ 'nav.documents' | translate }}</a>
              </nz-breadcrumb-item>
              <nz-breadcrumb-item>{{ 'bulk_import.breadcrumb' | translate }}</nz-breadcrumb-item>
            </nz-breadcrumb>
          </div>
        </div>
      </div>

      <!-- Steps -->
      <nz-card class="steps-card">
        <nz-steps [nzCurrent]="currentStep()" nzSize="small" [class.rtl-steps]="translationService.isRTL()">
          <nz-step 
            [nzTitle]="'bulk_import.steps.resource_type' | translate" 
            [nzDescription]="'bulk_import.steps.resource_type_desc' | translate">
          </nz-step>
          <nz-step 
            [nzTitle]="'bulk_import.steps.upload_file' | translate" 
            [nzDescription]="'bulk_import.steps.upload_file_desc' | translate">
          </nz-step>
          <nz-step 
            [nzTitle]="'bulk_import.steps.review_import' | translate" 
            [nzDescription]="'bulk_import.steps.review_import_desc' | translate">
          </nz-step>
          <nz-step 
            [nzTitle]="'bulk_import.steps.results' | translate" 
            [nzDescription]="'bulk_import.steps.results_desc' | translate">
          </nz-step>
        </nz-steps>
      </nz-card>

      <!-- Step 1: Resource Type Selection -->
      <nz-card *ngIf="currentStep() === 0" [nzTitle]="'bulk_import.step1.title' | translate" class="content-card">
        <form nz-form [formGroup]="resourceTypeForm" nzLayout="vertical">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'bulk_import.step1.company' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'bulk_import.step1.company_required' | translate">
                  <nz-select 
                    formControlName="companyId" 
                    [nzPlaceHolder]="'bulk_import.step1.company_placeholder' | translate"
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
                <nz-form-label [nzRequired]="true">{{ 'bulk_import.step1.document_type' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'bulk_import.step1.document_type_required' | translate">
                  <nz-select 
                    formControlName="resourceTypeId" 
                    [nzPlaceHolder]="'bulk_import.step1.document_type_placeholder' | translate"
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
            <nz-divider [nzText]="'bulk_import.step1.fields_preview' | translate" nzOrientation="left"></nz-divider>
            <nz-descriptions nzBordered nzSize="small">
              <nz-descriptions-item 
                *ngFor="let field of selectedResourceType()!.fields" 
                [nzTitle]="field.label || field.name"
                [nzSpan]="1">
                <nz-tag [nzColor]="getFieldTypeColor(field.kind)">
                  {{ ('bulk_import.field_types.' + field.kind) | translate }}
                </nz-tag>
                <nz-tag *ngIf="field.required" nzColor="red">{{ 'bulk_import.step1.field_required' | translate }}</nz-tag>
                <div *ngIf="field.options && field.options.length > 0" class="field-options">
                  {{ 'bulk_import.step1.field_options' | translate }}: {{ field.options.join(', ') }}
                </div>
              </nz-descriptions-item>
            </nz-descriptions>
          </div>

          <nz-divider></nz-divider>

          <nz-space [class.rtl-space]="translationService.isRTL()">
            <button 
              *nzSpaceItem
              nz-button 
              nzType="primary" 
              [nzLoading]="isDownloadingTemplate()"
              [disabled]="!resourceTypeForm.get('resourceTypeId')?.value"
              (click)="downloadTemplate()">
              <nz-icon nzType="download"></nz-icon>
              <span>{{ 'bulk_import.step1.download_template' | translate }}</span>
            </button>
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default" 
              [disabled]="!resourceTypeForm.get('resourceTypeId')?.value"
              (click)="nextStep()">
              <nz-icon nzType="arrow-right"></nz-icon>
              <span>{{ 'bulk_import.step1.next_upload' | translate }}</span>
            </button>
          </nz-space>
        </form>
      </nz-card>

      <!-- Step 2: File Upload -->
      <nz-card *ngIf="currentStep() === 1" [nzTitle]="'bulk_import.step2.title' | translate" class="content-card">
        <nz-alert
          nzType="info"
          [nzMessage]="'bulk_import.step2.instructions' | translate"
          [nzDescription]="'bulk_import.step2.instructions_desc' | translate"
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
              <p class="ant-upload-text">{{ 'bulk_import.step2.drag_drop' | translate }}</p>
              <p class="ant-upload-hint">{{ 'bulk_import.step2.file_support' | translate }}</p>
            </nz-upload>
            
            <!-- Fallback button -->
            <div class="mt-3">
              <button nz-button nzType="dashed" nzBlock (click)="fileInput.click()">
                <nz-icon nzType="folder-open"></nz-icon>
                <span>{{ 'bulk_import.step2.browse_files' | translate }}</span>
              </button>
            </div>
          </div>

          <div nz-col [nzSpan]="12">
            <div *ngIf="uploadedFile()" class="file-info">
              <nz-descriptions nzBordered nzSize="small" [nzTitle]="'bulk_import.step2.file_info' | translate">
                <nz-descriptions-item [nzTitle]="'bulk_import.step2.filename' | translate">{{ uploadedFile()!.name }}</nz-descriptions-item>
                <nz-descriptions-item [nzTitle]="'bulk_import.step2.size' | translate">{{ formatFileSize(uploadedFile()!.size) }}</nz-descriptions-item>
                <nz-descriptions-item [nzTitle]="'bulk_import.step2.type' | translate">{{ uploadedFile()!.type || ('common.not_available' | translate) }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </div>
        </div>

        <nz-divider></nz-divider>

        <nz-space [class.rtl-space]="translationService.isRTL()">
          <button *nzSpaceItem nz-button nzType="default" (click)="previousStep()">
            <nz-icon nzType="arrow-left"></nz-icon>
            <span>{{ 'bulk_import.step2.previous' | translate }}</span>
          </button>
          <button 
            *nzSpaceItem
            nz-button 
            nzType="primary" 
            [disabled]="!uploadedFile()"
            (click)="validateFile()">
            <nz-icon nzType="check-circle"></nz-icon>
            <span>{{ 'bulk_import.step2.validate_continue' | translate }}</span>
          </button>
        </nz-space>
      </nz-card>

      <!-- Step 3: Review & Import Options -->
      <nz-card *ngIf="currentStep() === 2" [nzTitle]="'bulk_import.step3.title' | translate" class="content-card">
        <!-- Validation Results -->
        <div *ngIf="validationResult()" class="validation-results mb-4">
          <nz-alert
            [nzType]="validationResult()!.errors.length === 0 ? 'success' : 'warning'"
            [nzMessage]="validationResult()!.errors.length === 0 ? ('bulk_import.step3.validation_success' | translate) : ('bulk_import.step3.validation_issues' | translate)"
            [nzDescription]="getDataRowsMessage(validationResult()!.totalRows)"
            nzShowIcon>
          </nz-alert>

          <!-- Validation Errors -->
          <div *ngIf="validationResult()!.errors.length > 0" class="mt-4">
            <nz-collapse>
              <nz-collapse-panel 
                [nzHeader]="'bulk_import.step3.validation_issues_title' | translate" 
                [nzActive]="true"
                [nzExtra]="errorCountTemplate">
                <ng-template #errorCountTemplate>
                  <nz-tag nzColor="orange">{{ getIssuesCountMessage(validationResult()!.errors.length) }}</nz-tag>
                </ng-template>

                <nz-table [nzData]="validationResult()!.errors" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>{{ 'bulk_import.step3.row' | translate }}</th>
                      <th>{{ 'bulk_import.step3.field' | translate }}</th>
                      <th>{{ 'bulk_import.step3.value' | translate }}</th>
                      <th>{{ 'bulk_import.step3.issue' | translate }}</th>
                      <th>{{ 'bulk_import.step3.severity' | translate }}</th>
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
                          {{ ('bulk_import.severities.' + error.severity) | translate }}
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
                {{ 'bulk_import.step3.skip_invalid' | translate }}
              </label>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox formControlName="generateResourceCodes">
                {{ 'bulk_import.step3.generate_codes' | translate }}
              </label>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox formControlName="duplicateResourceTypesIfMissing">
                {{ 'bulk_import.step3.duplicate_resource_types' | translate }}
              </label>
              <div class="checkbox-help">
                {{ 'bulk_import.step3.duplicate_resource_types_help' | translate }}
              </div>
            </nz-form-control>
          </nz-form-item>
        </form>

        <nz-divider></nz-divider>

        <nz-space [class.rtl-space]="translationService.isRTL()">
          <button *nzSpaceItem nz-button nzType="default" (click)="previousStep()">
            <nz-icon nzType="arrow-left"></nz-icon>
            <span>{{ 'bulk_import.step2.previous' | translate }}</span>
          </button>
          <button 
            *nzSpaceItem
            nz-button 
            nzType="primary" 
            [nzLoading]="isProcessing()"
            [disabled]="!canProceedWithImport()"
            (click)="processImport()">
            <nz-icon nzType="cloud-upload"></nz-icon>
            <span>{{ 'bulk_import.step3.start_import' | translate }}</span>
          </button>
        </nz-space>
      </nz-card>

      <!-- Step 4: Results -->
      <nz-card *ngIf="currentStep() === 3" [nzTitle]="'bulk_import.step4.title' | translate" class="content-card">
        <div *ngIf="importResult()">
          <!-- Success Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows === 0"
            nzStatus="success"
            [nzTitle]="getSuccessTitle(importResult()!.successfulRows)"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="/documents">
                <nz-icon nzType="unordered-list"></nz-icon>
                <span>{{ 'bulk_import.step4.view_documents' | translate }}</span>
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="plus"></nz-icon>
                <span>{{ 'bulk_import.step4.import_more' | translate }}</span>
              </button>
            </div>
          </nz-result>

          <!-- Partial Success/Failure Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows > 0 && importResult()!.successfulRows > 0"
            nzStatus="warning"
            [nzTitle]="getPartialTitle(importResult()!.successfulRows, importResult()!.failedRows)"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="/documents">
                <nz-icon nzType="unordered-list"></nz-icon>
                <span>{{ 'bulk_import.step4.view_documents' | translate }}</span>
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="plus"></nz-icon>
                <span>{{ 'bulk_import.step4.try_again' | translate }}</span>
              </button>
            </div>
          </nz-result>

          <!-- Complete Failure Result -->
          <nz-result 
            *ngIf="importResult()!.failedRows > 0 && importResult()!.successfulRows === 0"
            nzStatus="error"
            [nzTitle]="getFailureTitle(importResult()!.failedRows)"
            [nzSubTitle]="importResult()!.summary">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="previousStep()">
                <nz-icon nzType="arrow-left"></nz-icon>
                <span>{{ 'bulk_import.step4.back_review' | translate }}</span>
              </button>
              <button nz-button nzType="default" (click)="startNewImport()">
                <nz-icon nzType="reload"></nz-icon>
                <span>{{ 'bulk_import.step4.start_over' | translate }}</span>
              </button>
            </div>
          </nz-result>

          <!-- Import Errors -->
          <div *ngIf="importResult()!.errors.length > 0" class="import-errors mt-4">
            <nz-collapse>
              <nz-collapse-panel 
                [nzHeader]="'bulk_import.step4.import_errors' | translate" 
                [nzExtra]="errorCountTemplate">
                <ng-template #errorCountTemplate>
                  <nz-tag nzColor="red">{{ getErrorsCountMessage(importResult()!.errors.length) }}</nz-tag>
                </ng-template>

                <nz-table [nzData]="importResult()!.errors" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>{{ 'bulk_import.step3.row' | translate }}</th>
                      <th>{{ 'bulk_import.step3.field' | translate }}</th>
                      <th>{{ 'bulk_import.step3.value' | translate }}</th>
                      <th>{{ 'common.error' | translate }}</th>
                      <th>{{ 'bulk_import.step3.severity' | translate }}</th>
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
                          {{ ('bulk_import.severities.' + error.severity) | translate }}
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
                [nzHeader]="'bulk_import.step4.created_documents' | translate" 
                [nzExtra]="successCountTemplate">
                <ng-template #successCountTemplate>
                  <nz-tag nzColor="green">{{ getCreatedCountMessage(importResult()!.createdDocuments.length) }}</nz-tag>
                </ng-template>

                <nz-table [nzData]="importResult()!.createdDocuments" nzSize="small" [nzPageSize]="10">
                  <thead>
                    <tr>
                      <th>{{ 'documents.table.title' | translate }}</th>
                      <th>{{ 'bulk_import.step4.resource_code' | translate }}</th>
                      <th>{{ 'bulk_import.step4.created_at' | translate }}</th>
                      <th>{{ 'documents.table.actions' | translate }}</th>
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
                          <span>{{ 'bulk_import.step4.view' | translate }}</span>
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
      overflow: visible;
    }

    .bulk-import-container.rtl {
      direction: rtl;
    }

    .page-header-wrapper {
      background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
      margin: -24px -24px 24px -24px;
      padding: 40px 48px 32px 48px;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: relative;
    }

    .page-header-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%);
    }

    .page-header-content {
      max-width: 100%;
      overflow: visible;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      overflow: visible;
    }

    .header-title-section {
      flex: 1;
      padding-top: 8px;
    }

    .header-title-section.rtl-header {
      text-align: right;
    }

    .page-title {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1f1f1f;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      margin: 0;
      color: #666;
      font-size: 15px;
      line-height: 1.5;
      font-weight: 400;
    }

    .header-actions {
      flex-shrink: 0;
      margin-left: 24px;
      padding-top: 4px;
    }

    .header-actions.rtl-actions {
      margin-left: 0;
      margin-right: 24px;
    }

    .action-button {
      height: 44px;
      padding: 0 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #d9d9d9;
      background: #fff;
      color: #262626;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .action-button:hover {
      border-color: #40a9ff;
      color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
      transform: translateY(-1px);
    }

    .breadcrumb-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .breadcrumb-section.rtl-breadcrumb {
      text-align: right;
    }

    ::ng-deep .breadcrumb-section .ant-breadcrumb {
      font-size: 14px;
    }

    ::ng-deep .breadcrumb-section .ant-breadcrumb a {
      color: #1890ff;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    ::ng-deep .breadcrumb-section .ant-breadcrumb a:hover {
      color: #40a9ff;
    }

    .steps-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #f0f0f0;
      overflow: hidden;
    }

    .steps-card.rtl-steps {
      direction: rtl;
    }

    ::ng-deep .steps-card .ant-card-body {
      padding: 32px;
    }

    .content-card {
      margin-bottom: 24px;
      overflow: visible;
    }

    .content-card .ant-card-body {
      overflow: visible;
    }

    .file-info {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #d9d9d9;
    }

    .field-options {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .checkbox-help {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
    }

    .validation-results {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #d9d9d9;
    }

    .import-errors, .created-documents {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #d9d9d9;
    }

    .rtl-space {
      direction: rtl;
    }

    .rtl-space .ant-space-item {
      margin-left: 8px;
      margin-right: 0;
    }

    ::ng-deep .ant-upload.ant-upload-drag {
      border-radius: 6px;
      border: 1px dashed #d9d9d9;
      background: #fafafa;
      transition: border-color 0.3s ease;
    }

    ::ng-deep .ant-upload.ant-upload-drag:hover {
      border-color: #40a9ff;
    }

    ::ng-deep .ant-upload-drag .ant-upload-btn {
      padding: 40px 16px !important;
    }

    ::ng-deep .ant-upload-drag .ant-upload-drag-icon {
      margin-bottom: 16px;
    }

    ::ng-deep .ant-upload-drag .ant-upload-text {
      font-size: 16px;
      color: #666;
      margin-bottom: 8px;
    }

    ::ng-deep .ant-upload-drag .ant-upload-hint {
      font-size: 14px;
      color: #999;
    }

    ::ng-deep .ant-result-extra {
      margin-top: 24px;
    }

    ::ng-deep .ant-result-extra .ant-btn {
      margin-right: 8px;
    }

    ::ng-deep .rtl .ant-result-extra .ant-btn {
      margin-right: 0;
      margin-left: 8px;
    }

    ::ng-deep .ant-steps-item-title {
      font-weight: 500;
    }

    ::ng-deep .ant-card-head-title {
      font-weight: 600;
      font-size: 16px;
    }

    ::ng-deep .ant-form-item-label > label {
      font-weight: 500;
    }

    /* Override shell layout constraints for bulk import */
    ::ng-deep .inner-content {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      min-height: auto !important;
      height: auto !important;
    }

    /* Ensure the main container and all child containers expand naturally */
    ::ng-deep app-document-bulk-import-page,
    ::ng-deep .bulk-import-container,
    ::ng-deep .ant-card,
    ::ng-deep .ant-card-body,
    ::ng-deep .ant-row,
    ::ng-deep .ant-col {
      overflow: visible !important;
      height: auto !important;
      min-height: auto !important;
    }

    /* RTL specific styles */
    ::ng-deep .rtl .ant-steps-item-tail::after {
      left: 0;
      right: auto;
    }

    ::ng-deep .rtl .ant-steps-item-icon {
      margin-left: 8px;
      margin-right: 0;
    }

    ::ng-deep .rtl .ant-breadcrumb {
      direction: rtl;
    }

    ::ng-deep .rtl .ant-breadcrumb-separator {
      transform: scaleX(-1);
    }

    /* Animation for smooth transitions */
    .content-card {
      animation: fadeInUp 0.3s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .page-header-wrapper {
        padding: 32px 24px 24px 24px;
        margin: -24px -24px 24px -24px;
      }

      .header-top {
        flex-direction: column;
        gap: 20px;
        align-items: stretch;
      }

      .header-title-section {
        padding-top: 0;
      }

      .page-title {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .page-subtitle {
        font-size: 14px;
      }

      .header-actions {
        margin-left: 0;
        width: 100%;
        padding-top: 0;
      }

      .header-actions.rtl-actions {
        margin-right: 0;
      }

      .action-button {
        width: 100%;
        justify-content: center;
        height: 48px;
      }

      .breadcrumb-section {
        margin-top: 16px;
        padding-top: 12px;
      }

      ::ng-deep .steps-card .ant-card-body {
        padding: 24px 16px;
      }
    }
  `],
  providers: [NzMessageService]
})
export class DocumentBulkImportPageComponent implements OnInit {
  private bulkImportService = inject(BulkImportService);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private resourceTypeDuplicationService = inject(ResourceTypeDuplicationService);
  public translationService = inject(TranslationService);
  private translateService = inject(TranslateService);
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
  multiCompanyImportResult = signal<MultiCompanyImportResultDto | null>(null);
  fileList = signal<NzUploadFile[]>([]);
  
  // Attachment support
  attachmentFiles = signal<File[]>([]);
  attachmentFileList = signal<NzUploadFile[]>([]);
  parsedAttachments = signal<BulkAttachmentDto[]>([]);
  
  // Multi-company support
  selectedCompanies = signal<number[]>([]);
  isMultiCompanyMode = signal(false);
  
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
      this.message.error(this.translateService.instant('bulk_import.messages.file_processing_failed'));
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
      resourceTypeId: [null, [Validators.required]],
      targetCompanyIds: [[]],
      isMultiCompany: [false]
    });

    this.importOptionsForm = this.fb.group({
      skipInvalidRows: [true],
      generateResourceCodes: [true],
      duplicateResourceTypesIfMissing: [false],
      hasAttachments: [false],
      attachmentLinkingStrategy: ['ROW_PREFIX']
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
          this.message.error(this.translateService.instant('common.failed_to_load', { item: this.translateService.instant('bulk_import.step1.company') }));
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
          this.message.error(this.translateService.instant('common.failed_to_load', { item: this.translateService.instant('bulk_import.step1.document_type') }));
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
          this.message.success(this.translateService.instant('bulk_import.messages.template_downloaded'));
        },
        error: () => {
          this.isDownloadingTemplate.set(false);
          this.message.error(this.translateService.instant('bulk_import.messages.template_download_failed'));
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
      this.message.error(this.translateService.instant('bulk_import.messages.invalid_file'));
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
    this.message.success(this.translateService.instant('bulk_import.messages.file_selected', { 0: file.name }));
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
            this.message.success(this.translateService.instant('bulk_import.messages.validation_successful'));
          } else {
            this.message.warning(this.translateService.instant('bulk_import.messages.validation_issues', { 0: result.errors.length }));
          }
        },
        error: () => {
          this.isValidating.set(false);
          this.message.error(this.translateService.instant('bulk_import.messages.validation_failed'));
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
    const isMultiCompany = this.resourceTypeForm.get('isMultiCompany')?.value;
    const targetCompanyIds = this.resourceTypeForm.get('targetCompanyIds')?.value;
    
    if (!file || !resourceTypeId) return;

    const request: BulkImportRequestDto = {
      resourceTypeId,
      companyId,
      skipInvalidRows: this.importOptionsForm.get('skipInvalidRows')?.value,
      generateResourceCodes: this.importOptionsForm.get('generateResourceCodes')?.value,
      duplicateResourceTypesIfMissing: this.importOptionsForm.get('duplicateResourceTypesIfMissing')?.value,
      hasAttachments: this.importOptionsForm.get('hasAttachments')?.value,
      attachmentLinkingStrategy: this.importOptionsForm.get('attachmentLinkingStrategy')?.value
    };

    // Set target companies for multi-company import
    if (isMultiCompany && targetCompanyIds && targetCompanyIds.length > 0) {
      request.targetCompanyIds = targetCompanyIds;
    }

    this.isProcessing.set(true);
    
    const attachments = this.attachmentFiles();
    const hasAttachments = attachments.length > 0;
    
    if (isMultiCompany) {
      // Multi-company import
      this.bulkImportService.processMultiCompanyImport(file, attachments, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result: MultiCompanyImportResultDto) => {
            this.multiCompanyImportResult.set(result);
            this.handleMultiCompanyImportResult(result);
            this.isProcessing.set(false);
            this.nextStep();
          },
          error: () => {
            this.isProcessing.set(false);
            this.message.error(this.translateService.instant('bulk_import.messages.import_processing_failed'));
          }
        });
    } else if (hasAttachments) {
      // Single company with attachments
      this.bulkImportService.processBulkImportWithAttachments(file, attachments, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result: BulkImportResultDto) => {
            this.importResult.set(result);
            this.handleSingleCompanyImportResult(result);
            this.isProcessing.set(false);
            this.nextStep();
          },
          error: () => {
            this.isProcessing.set(false);
            this.message.error(this.translateService.instant('bulk_import.messages.import_processing_failed'));
          }
        });
    } else {
      // Regular single company import
      this.bulkImportService.processBulkImport(file, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result: BulkImportResultDto) => {
            this.importResult.set(result);
            this.handleSingleCompanyImportResult(result);
            this.isProcessing.set(false);
            this.nextStep();
          },
          error: () => {
            this.isProcessing.set(false);
            this.message.error(this.translateService.instant('bulk_import.messages.import_processing_failed'));
          }
        });
    }
  }

  private handleSingleCompanyImportResult(result: BulkImportResultDto): void {
    if (result.failedRows === 0) {
      const message = this.translateService.instant('bulk_import.messages.import_successful')
        .replace('{count}', result.successfulRows.toString());
      this.message.success(message);
    } else if (result.successfulRows > 0) {
      const message = this.translateService.instant('bulk_import.messages.import_partial')
        .replace('{success}', result.successfulRows.toString())
        .replace('{failed}', result.failedRows.toString());
      this.message.warning(message);
    } else {
      const message = this.translateService.instant('bulk_import.messages.import_failed')
        .replace('{count}', result.failedRows.toString());
      this.message.error(message);
    }
  }

  private handleMultiCompanyImportResult(result: MultiCompanyImportResultDto): void {
    if (result.totalFailedRows === 0) {
      const message = this.translateService.instant('bulk_import.messages.multi_company_import_successful')
        .replace('{success}', result.totalSuccessfulRows.toString())
        .replace('{companies}', result.totalProcessedCompanies.toString());
      this.message.success(message);
    } else if (result.totalSuccessfulRows > 0) {
      const message = this.translateService.instant('bulk_import.messages.multi_company_import_partial')
        .replace('{success}', result.totalSuccessfulRows.toString())
        .replace('{failed}', result.totalFailedRows.toString())
        .replace('{companies}', result.totalProcessedCompanies.toString());
      this.message.warning(message);
    } else {
      const message = this.translateService.instant('bulk_import.messages.multi_company_import_failed')
        .replace('{failed}', result.totalFailedRows.toString())
        .replace('{companies}', result.totalProcessedCompanies.toString());
      this.message.error(message);
    }
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
    this.attachmentFiles.set([]);
    this.attachmentFileList.set([]);
    this.parsedAttachments.set([]);
    this.selectedResourceType.set(null);
    this.validationResult.set(null);
    this.importResult.set(null);
    this.multiCompanyImportResult.set(null);
    this.selectedCompanies.set([]);
    this.isMultiCompanyMode.set(false);
    this.resourceTypeForm.reset();
    this.importOptionsForm.patchValue({
      skipInvalidRows: true,
      generateResourceCodes: true,
      duplicateResourceTypesIfMissing: false,
      hasAttachments: false,
      attachmentLinkingStrategy: 'ROW_PREFIX'
    });
  }

  // Attachment handling methods
  onAttachmentFileChange(info: NzUploadChangeParam): void {
    console.log('Attachment file change event:', info);
    
    let newFileList = [...info.fileList];
    
    // Update the file list for display purposes
    this.attachmentFileList.set(newFileList);
    
    // Extract actual File objects
    const actualFiles: File[] = [];
    newFileList.forEach(nzFile => {
      if (nzFile.originFileObj) {
        actualFiles.push(nzFile.originFileObj as File);
      }
    });
    
    this.attachmentFiles.set(actualFiles);
    this.importOptionsForm.patchValue({ hasAttachments: actualFiles.length > 0 });
    
    // Parse attachments for validation
    this.parseAttachmentsForPreview(actualFiles);
  }

  private parseAttachmentsForPreview(files: File[]): void {
    const linkingStrategy = this.importOptionsForm.get('attachmentLinkingStrategy')?.value || 'ROW_PREFIX';
    const parsedAttachments: BulkAttachmentDto[] = [];
    
    files.forEach(file => {
      const attachment: BulkAttachmentDto = {
        originalFilename: file.name,
        linkedRowIdentifier: '',
        mimeType: file.type,
        sizeBytes: file.size
      };
      
      if (linkingStrategy === 'ROW_PREFIX') {
        this.parseRowPrefixLinking(attachment);
      } else if (linkingStrategy === 'RESOURCE_CODE') {
        this.parseResourceCodeLinking(attachment);
      }
      
      parsedAttachments.push(attachment);
    });
    
    this.parsedAttachments.set(parsedAttachments);
  }

  private parseRowPrefixLinking(attachment: BulkAttachmentDto): void {
    const filename = attachment.originalFilename;
    if (filename && filename.toUpperCase().startsWith('ROW')) {
      try {
        const parts = filename.split('_', 2);
        if (parts.length >= 1) {
          const rowPart = parts[0].toUpperCase().replace('ROW', '');
          const rowNumber = parseInt(rowPart);
          attachment.rowNumber = rowNumber;
          attachment.linkedRowIdentifier = 'ROW' + rowNumber;
        }
      } catch (e) {
        attachment.errorMessage = 'Invalid row number format in filename';
      }
    } else {
      attachment.errorMessage = 'Filename must start with ROW{number}_ format';
    }
  }

  private parseResourceCodeLinking(attachment: BulkAttachmentDto): void {
    const filename = attachment.originalFilename;
    if (filename && filename.includes('_')) {
      const parts = filename.split('_', 2);
      if (parts.length >= 1) {
        attachment.resourceCode = parts[0];
        attachment.linkedRowIdentifier = parts[0];
      }
    } else {
      attachment.errorMessage = 'Filename must contain resource code followed by underscore';
    }
  }

  // Multi-company handling methods
  onMultiCompanyToggle(enabled: boolean): void {
    this.isMultiCompanyMode.set(enabled);
    if (enabled) {
      this.resourceTypeForm.get('targetCompanyIds')?.setValidators([Validators.required]);
    } else {
      this.resourceTypeForm.get('targetCompanyIds')?.clearValidators();
      this.resourceTypeForm.get('targetCompanyIds')?.setValue([]);
    }
    this.resourceTypeForm.get('targetCompanyIds')?.updateValueAndValidity();
  }

  onCompanySelectionChange(companyIds: number[]): void {
    this.selectedCompanies.set(companyIds);
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

  // Translation helper methods
  getDataRowsMessage(count: number): string {
    return this.translateService.instant('bulk_import.step3.data_rows_found', { 0: count });
  }

  getIssuesCountMessage(count: number): string {
    return this.translateService.instant('bulk_import.step3.issues_count', { 0: count });
  }

  getSuccessTitle(count: number): string {
    return this.translateService.instant('bulk_import.step4.success_title', { 0: count });
  }

  getPartialTitle(successful: number, failed: number): string {
    return this.translateService.instant('bulk_import.step4.partial_title', { 0: successful, 1: failed });
  }

  getFailureTitle(count: number): string {
    return this.translateService.instant('bulk_import.step4.failure_title', { 0: count });
  }

  getErrorsCountMessage(count: number): string {
    return this.translateService.instant('bulk_import.step4.errors_count', { 0: count });
  }

  getCreatedCountMessage(count: number): string {
    return this.translateService.instant('bulk_import.step4.created_count', { 0: count });
  }
} 