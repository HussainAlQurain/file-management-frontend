import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, 
         GridOptions, ValueFormatterParams, PasteEndEvent, ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register AG-Grid Enterprise modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadModule, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { BulkImportService } from '../../core/services/bulk-import.service';
import { TranslationService } from '../../core/services/translation.service';
import { Company } from '../../core/models/company.model';
import { ResourceType, FieldDefinitionDto } from '../../core/models/resource-type.model';
import { BulkImportRequestDto, BulkImportResultDto } from '../../core/models/bulk-import.model';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-grid-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    AgGridAngular,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzFormModule,
    NzSpinModule,
    NzSpaceModule,
    NzAlertModule,
    NzDividerModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzUploadModule,
    NzCheckboxModule,
    NzTableModule,
    NzTagModule
  ],
  template: `
    <div class="excel-grid-container" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">{{ 'excel_import.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'excel_import.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <nz-space nzSize="middle">
                <button *nzSpaceItem nz-button nzType="default" routerLink="/documents" class="action-button">
                  <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                  <span>{{ 'excel_import.back_to_documents' | translate }}</span>
                </button>
              </nz-space>
            </div>
          </div>
          
          <div class="breadcrumb-section" [class.rtl-breadcrumb]="translationService.isRTL()">
            <nz-breadcrumb>
              <nz-breadcrumb-item>
                <a routerLink="/documents">{{ 'nav.documents' | translate }}</a>
              </nz-breadcrumb-item>
              <nz-breadcrumb-item>{{ 'excel_import.breadcrumb' | translate }}</nz-breadcrumb-item>
            </nz-breadcrumb>
          </div>
        </div>
      </div>

      <!-- Resource Type Selection -->
      <nz-card [nzTitle]="'excel_import.select_type' | translate" class="selection-card">
        <form nz-form [formGroup]="selectionForm" nzLayout="vertical">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'excel_import.company' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'excel_import.company_required' | translate">
                  <nz-select 
                    formControlName="companyId" 
                    [nzPlaceHolder]="'excel_import.company_placeholder' | translate"
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

            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">{{ 'excel_import.document_type' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'excel_import.document_type_required' | translate">
                  <nz-select 
                    formControlName="resourceTypeId" 
                    [nzPlaceHolder]="'excel_import.document_type_placeholder' | translate"
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

            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label>&nbsp;</nz-form-label>
                <nz-form-control>
                  <nz-space>
                    <!-- File upload button -->
                    <input 
                      #fileInput 
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      (change)="onFileUpload($event)"
                      style="display: none;">
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="default"
                      [disabled]="!selectedResourceType()"
                      (click)="fileInput.click()">
                      <nz-icon nzType="upload"></nz-icon>
                      <span>{{ 'excel_import.upload_file' | translate }}</span>
                    </button>
                    
                    <!-- Clear button -->
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="default"
                      nzDanger
                      [disabled]="!hasData()"
                      (click)="clearGrid()">
                      <nz-icon nzType="clear"></nz-icon>
                      <span>{{ 'excel_import.clear_data' | translate }}</span>
                    </button>
                  </nz-space>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
        </form>
      </nz-card>

      <!-- Instructions -->
      <nz-alert
        *ngIf="selectedResourceType()"
        nzType="info"
        [nzMessage]="'excel_import.instructions_title' | translate"
        nzShowIcon
        class="instructions-alert">
        <div nz-alert-description>
          <ul class="instructions-list">
            <li>{{ 'excel_import.instruction_1' | translate }}</li>
            <li>{{ 'excel_import.instruction_2' | translate }}</li>
            <li>{{ 'excel_import.instruction_3' | translate }}</li>
            <li>{{ 'excel_import.instruction_4' | translate }}</li>
          </ul>
        </div>
      </nz-alert>

      <!-- Import Options -->
      <nz-card 
        *ngIf="selectedResourceType()" 
        [nzTitle]="'excel_import.import_options' | translate"
        class="options-card">
        <form nz-form [formGroup]="importOptionsForm" nzLayout="vertical">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-control>
                  <label nz-checkbox formControlName="skipInvalidRows">
                    {{ 'excel_import.skip_invalid_rows' | translate }}
                  </label>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-control>
                  <label nz-checkbox formControlName="generateResourceCodes">
                    {{ 'excel_import.generate_resource_codes' | translate }}
                  </label>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="24">
              <nz-form-item>
                <nz-form-control>
                  <label nz-checkbox formControlName="duplicateResourceTypesIfMissing">
                    {{ 'excel_import.duplicate_resource_types' | translate }}
                  </label>
                  <div class="checkbox-help">
                    {{ 'excel_import.duplicate_resource_types_help' | translate }}
                  </div>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="24">
              <nz-form-item>
                <nz-form-control>
                  <label nz-checkbox formControlName="hasAttachments" (ngModelChange)="onAttachmentToggle($event)">
                    {{ 'excel_import.has_attachments' | translate }}
                  </label>
                  <div class="checkbox-help">
                    {{ 'excel_import.has_attachments_help' | translate }}
                  </div>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
        </form>
      </nz-card>

      <!-- Attachment Upload -->
      <nz-card 
        *ngIf="selectedResourceType() && importOptionsForm.get('hasAttachments')?.value" 
        [nzTitle]="'excel_import.attachment_upload' | translate"
        class="attachment-card">
        
        <nz-alert
          nzType="info"
          [nzMessage]="'excel_import.attachment_instructions' | translate"
          nzShowIcon
          class="mb-4">
          <div nz-alert-description>
            <ul class="attachment-instructions">
              <li>{{ 'excel_import.attachment_instruction_1' | translate }}</li>
              <li>{{ 'excel_import.attachment_instruction_2' | translate }}</li>
              <li>{{ 'excel_import.attachment_instruction_3' | translate }}</li>
            </ul>
            <div class="strategy-examples" *ngIf="importOptionsForm.get('attachmentLinkingStrategy')?.value">
              <strong>{{ 'excel_import.examples' | translate }}:</strong>
              <div *ngIf="importOptionsForm.get('attachmentLinkingStrategy')?.value === 'ROW_PREFIX'">
                <code>ROW1_contract.pdf</code>, <code>ROW2_invoice.xlsx</code>, <code>ROW3_receipt.jpg</code>
              </div>
              <div *ngIf="importOptionsForm.get('attachmentLinkingStrategy')?.value === 'RESOURCE_CODE'">
                <code>DOC001_file.pdf</code>, <code>INV002_attachment.xlsx</code>, <code>CONTRACT_document.jpg</code>
              </div>
            </div>
          </div>
        </nz-alert>

        <div nz-row [nzGutter]="[16, 16]">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>{{ 'excel_import.linking_strategy' | translate }}</nz-form-label>
              <nz-form-control>
                <nz-select 
                  [ngModel]="importOptionsForm.get('attachmentLinkingStrategy')?.value"
                  (ngModelChange)="importOptionsForm.patchValue({attachmentLinkingStrategy: $event})"
                  [nzPlaceHolder]="'excel_import.select_linking_strategy' | translate">
                  <nz-option value="ROW_PREFIX" [nzLabel]="'excel_import.row_prefix_strategy' | translate"></nz-option>
                  <nz-option value="RESOURCE_CODE" [nzLabel]="'excel_import.resource_code_strategy' | translate"></nz-option>
                </nz-select>
                <div class="strategy-help">
                  <span *ngIf="importOptionsForm.get('attachmentLinkingStrategy')?.value === 'ROW_PREFIX'">
                    {{ 'excel_import.row_prefix_help' | translate }}
                  </span>
                  <span *ngIf="importOptionsForm.get('attachmentLinkingStrategy')?.value === 'RESOURCE_CODE'">
                    {{ 'excel_import.resource_code_help' | translate }}
                  </span>
                </div>
              </nz-form-control>
            </nz-form-item>
          </div>
          
                      <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>{{ 'excel_import.attachment_files' | translate }}</nz-form-label>
                <nz-form-control>
                  <input 
                    #attachmentInput 
                    type="file" 
                    multiple
                    accept="*/*"
                    (change)="onAttachmentFilesSelected($event)"
                    style="display: none;">
                  <nz-space nzDirection="vertical" nzSize="small" style="width: 100%;">
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="dashed"
                      nzBlock
                      (click)="attachmentInput.click()">
                      <nz-icon nzType="upload"></nz-icon>
                      <span>{{ attachmentFiles().length === 0 ? ('excel_import.select_attachments' | translate) : ('excel_import.upload_more' | translate) }}</span>
                    </button>
                    <ng-container *nzSpaceItem>
                      <div *ngIf="attachmentFiles().length > 0">
                        <nz-space nzSize="small" style="width: 100%;">
                          <button 
                            *nzSpaceItem
                            nz-button 
                            nzType="default"
                            nzSize="small"
                            (click)="fixAllNames()">
                            <nz-icon nzType="edit"></nz-icon>
                            <span>{{ 'excel_import.fix_all_names' | translate }}</span>
                          </button>
                          <button 
                            *nzSpaceItem
                            nz-button 
                            nzType="default"
                            nzSize="small"
                            nzDanger
                            (click)="clearAllFiles()">
                            <nz-icon nzType="delete"></nz-icon>
                            <span>{{ 'excel_import.clear_all' | translate }}</span>
                          </button>
                        </nz-space>
                      </div>
                    </ng-container>
                  </nz-space>
                </nz-form-control>
              </nz-form-item>
            </div>
        </div>

        <!-- Attachment Preview -->
        <div *ngIf="attachmentFiles().length > 0" class="attachment-preview">
          <nz-divider [nzText]="'excel_import.selected_attachments' | translate" nzOrientation="left"></nz-divider>
          <nz-table 
            [nzData]="attachmentFiles()" 
            nzSize="small" 
            [nzPageSize]="10"
            [nzShowPagination]="attachmentFiles().length > 10">
            <thead>
              <tr>
                <th width="40px">{{ 'excel_import.order' | translate }}</th>
                <th>{{ 'excel_import.filename' | translate }}</th>
                <th>{{ 'excel_import.size' | translate }}</th>
                <th>{{ 'excel_import.linked_to' | translate }}</th>
                <th>{{ 'excel_import.status' | translate }}</th>
                <th>{{ 'excel_import.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let file of attachmentFiles(); let i = index" 
                  class="draggable-row"
                  draggable="true"
                  (dragstart)="onDragStart($event, i)"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event, i)"
                  [class.drag-over]="dragOverIndex === i">
                <td class="drag-handle">
                  <nz-icon nzType="drag" style="cursor: move; color: #999;"></nz-icon>
                  <span class="row-number">{{ i + 1 }}</span>
                </td>
                <td>{{ file.name }}</td>
                <td>{{ formatFileSize(file.size) }}</td>
                <td>
                  <span *ngIf="getAttachmentLinkInfo(file.name) as linkInfo">
                    <nz-tag [nzColor]="linkInfo.valid ? 'green' : 'red'">
                      {{ linkInfo.display }}
                    </nz-tag>
                  </span>
                </td>
                <td>
                  <nz-tag [nzColor]="getAttachmentLinkInfo(file.name).valid ? 'green' : 'red'">
                    {{ getAttachmentLinkInfo(file.name).valid ? ('excel_import.valid' | translate) : ('excel_import.invalid' | translate) }}
                  </nz-tag>
                </td>
                <td>
                  <nz-space nzSize="small">
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="link" 
                      nzSize="small"
                      [disabled]="i === 0"
                      (click)="moveFileUp(i)">
                      <nz-icon nzType="arrow-up"></nz-icon>
                    </button>
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="link" 
                      nzSize="small"
                      [disabled]="i === attachmentFiles().length - 1"
                      (click)="moveFileDown(i)">
                      <nz-icon nzType="arrow-down"></nz-icon>
                    </button>
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="link" 
                      nzSize="small"
                      [disabled]="getAttachmentLinkInfo(file.name).valid"
                      (click)="suggestRename(file, i)">
                      <nz-icon nzType="edit"></nz-icon>
                      <span>{{ 'excel_import.suggest_rename' | translate }}</span>
                    </button>
                    <button 
                      *nzSpaceItem
                      nz-button 
                      nzType="link" 
                      nzSize="small"
                      nzDanger
                      (click)="removeAttachment(i)">
                      <nz-icon nzType="delete"></nz-icon>
                      <span>{{ 'excel_import.remove' | translate }}</span>
                    </button>
                  </nz-space>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </nz-card>

      <!-- Excel Grid -->
      <nz-card 
        *ngIf="selectedResourceType()" 
        [nzTitle]="'excel_import.data_entry' | translate"
        [nzExtra]="gridActionsTemplate"
        [nzLoading]="false"
        class="grid-card">
        
        <ng-template #gridActionsTemplate>
          <nz-space>
            <button 
              *nzSpaceItem
              nz-button 
              nzType="primary"
              [nzLoading]="isImporting()"
              [disabled]="!hasValidData()"
              (click)="importData()">
              <nz-icon nzType="cloud-upload"></nz-icon>
              <span>{{ 'excel_import.import_data' | translate }}</span>
            </button>
            
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default"
              [disabled]="!hasData()"
              (click)="exportData()">
              <nz-icon nzType="download"></nz-icon>
              <span>{{ 'excel_import.export_excel' | translate }}</span>
            </button>
          </nz-space>
        </ng-template>

        <div class="grid-wrapper">
          <ag-grid-angular
            [class]="'ag-theme-quartz' + (translationService.isRTL() ? ' rtl' : '')"
            [style.height]="'500px'"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [gridOptions]="gridOptions"
            (gridReady)="onGridReady($event)"
            (cellValueChanged)="onCellValueChanged($event)"
            (pasteEnd)="onPasteEnd($event)">
          </ag-grid-angular>
        </div>

        <!-- Data Summary -->
        <div class="data-summary" *ngIf="hasData()">
          <nz-divider></nz-divider>
          <div class="summary-stats">
            <span class="stat-item">
              <nz-icon nzType="file-text"></nz-icon>
              {{ 'excel_import.total_rows' | translate }}: <strong>{{ validRowCount() }}</strong>
            </span>
            <span class="stat-item">
              <nz-icon nzType="check-circle" nzTheme="twotone" [nzTwotoneColor]="'#52c41a'"></nz-icon>
              {{ 'excel_import.valid_rows' | translate }}: <strong>{{ validRowCount() }}</strong>
            </span>
            <span class="stat-item" *ngIf="invalidRowCount() > 0">
              <nz-icon nzType="warning" nzTheme="twotone" [nzTwotoneColor]="'#faad14'"></nz-icon>
              {{ 'excel_import.invalid_rows' | translate }}: <strong>{{ invalidRowCount() }}</strong>
            </span>
          </div>
        </div>
      </nz-card>

      <!-- Import Results -->
      <nz-card 
        *ngIf="importResult()" 
        [nzTitle]="'excel_import.import_results' | translate"
        class="results-card">
        <nz-alert
          [nzType]="importResult()!.failedRows === 0 ? 'success' : 'warning'"
          [nzMessage]="getImportResultMessage()"
          nzShowIcon>
        </nz-alert>

        <!-- Import Errors -->
        <div *ngIf="importResult()!.errors && importResult()!.errors.length > 0" class="import-errors mt-4">
          <nz-divider [nzText]="'excel_import.import_errors' | translate" nzOrientation="left"></nz-divider>
          <nz-table 
            [nzData]="importResult()!.errors" 
            nzSize="small" 
            [nzPageSize]="10"
            [nzShowPagination]="importResult()!.errors.length > 10">
            <thead>
              <tr>
                <th>{{ 'excel_import.error_row' | translate }}</th>
                <th>{{ 'excel_import.error_field' | translate }}</th>
                <th>{{ 'excel_import.error_value' | translate }}</th>
                <th>{{ 'excel_import.error_message' | translate }}</th>
                <th>{{ 'excel_import.error_severity' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let error of importResult()!.errors">
                <td>{{ error.rowNumber }}</td>
                <td>{{ error.field || '-' }}</td>
                <td>{{ error.value || '-' }}</td>
                <td>{{ error.errorMessage }}</td>
                <td>
                  <nz-tag [nzColor]="error.severity === 'ERROR' ? 'red' : 'orange'">
                    {{ error.severity }}
                  </nz-tag>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </div>

        <!-- Created Documents -->
        <div *ngIf="importResult()!.createdDocuments && importResult()!.createdDocuments.length > 0" class="created-documents mt-4">
          <nz-divider [nzText]="'excel_import.created_documents' | translate" nzOrientation="left"></nz-divider>
          <nz-table 
            [nzData]="importResult()!.createdDocuments" 
            nzSize="small" 
            [nzPageSize]="10"
            [nzShowPagination]="importResult()!.createdDocuments.length > 10">
            <thead>
              <tr>
                <th>{{ 'excel_import.document_title' | translate }}</th>
                <th>{{ 'excel_import.resource_code' | translate }}</th>
                <th>{{ 'excel_import.company' | translate }}</th>
                <th>{{ 'excel_import.created_at' | translate }}</th>
                <th>{{ 'excel_import.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of importResult()!.createdDocuments">
                <td>{{ doc.title }}</td>
                <td>
                  <nz-tag>{{ doc.resourceCode }}</nz-tag>
                </td>
                <td>{{ doc.company?.name || '-' }}</td>
                <td>{{ doc.createdAt | date:'short' }}</td>
                <td>
                  <a nz-button nzType="link" nzSize="small" [routerLink]="['/documents', doc.id]">
                    <nz-icon nzType="eye"></nz-icon>
                    <span>{{ 'excel_import.view' | translate }}</span>
                  </a>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </div>

        <div class="result-actions" *ngIf="importResult()!.successfulRows > 0">
          <nz-divider></nz-divider>
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" routerLink="/documents">
              <nz-icon nzType="unordered-list"></nz-icon>
              <span>{{ 'excel_import.view_documents' | translate }}</span>
            </button>
            <button *nzSpaceItem nz-button nzType="default" (click)="resetForNewImport()">
              <nz-icon nzType="plus"></nz-icon>
              <span>{{ 'excel_import.import_more' | translate }}</span>
            </button>
          </nz-space>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .excel-grid-container {
      padding: 0;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .excel-grid-container.rtl {
      direction: rtl;
    }

    .page-header-wrapper {
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 24px;
    }

    .page-header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .header-title-section {
      flex: 1;
    }

    .header-title-section.rtl-header {
      text-align: right;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
    }

    .header-actions {
      flex-shrink: 0;
    }

    .action-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breadcrumb-section {
      padding-top: 8px;
    }

    .selection-card,
    .options-card,
    .grid-card,
    .results-card {
      margin: 0 24px 24px 24px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .instructions-alert {
      margin: 0 24px 24px 24px;
    }

    .instructions-list {
      margin: 8px 0;
      padding-left: 20px;
    }

    .instructions-list li {
      margin-bottom: 4px;
      color: rgba(0, 0, 0, 0.65);
    }

    .grid-wrapper {
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      overflow: hidden;
      background-color: #ffffff;
      
      /* Ensure AG-Grid fits properly */
      ::ng-deep {
        .ag-root-wrapper {
          border: none;
          border-radius: 0;
        }
        
        .ag-header {
          border-top: none;
        }
      }
    }

    /* AG-Grid styling */
    ::ng-deep .ag-theme-quartz {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
    }

    ::ng-deep .ag-header-cell {
      font-weight: 600;
    }

    ::ng-deep .required-cell-empty {
      background-color: #fff2e8 !important;
    }

    ::ng-deep .ag-cell-edit-input {
      padding: 0 6px;
    }

    .data-summary {
      margin-top: 16px;
    }

    .summary-stats {
      display: flex;
      gap: 24px;
      align-items: center;
      color: rgba(0, 0, 0, 0.65);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-item strong {
      color: rgba(0, 0, 0, 0.85);
    }

    .result-actions {
      text-align: center;
      margin-top: 24px;
    }

    .checkbox-help {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
    }

    .strategy-help {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
    }

    .attachment-card {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }

    .attachment-instructions {
      margin: 8px 0;
      padding-left: 20px;
    }

    .attachment-instructions li {
      margin-bottom: 4px;
      color: rgba(0, 0, 0, 0.65);
    }

    .strategy-examples {
      margin-top: 12px;
      padding: 8px 12px;
      background: #f0f8ff;
      border-radius: 4px;
      border-left: 3px solid #1890ff;
    }

    .strategy-examples code {
      background: #fff;
      padding: 2px 6px;
      border-radius: 3px;
      margin: 0 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #1890ff;
      border: 1px solid #d9d9d9;
    }

    .attachment-preview {
      margin-top: 16px;
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #d9d9d9;
    }

    .import-errors,
    .created-documents {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #d9d9d9;
    }

    .mt-4 {
      margin-top: 16px;
    }

    .mb-4 {
      margin-bottom: 16px;
    }

    /* Drag and drop styles */
    .draggable-row {
      transition: background-color 0.2s ease;
    }

    .draggable-row:hover {
      background-color: #f5f5f5;
    }

    .draggable-row.drag-over {
      background-color: #e6f7ff;
      border: 2px dashed #1890ff;
    }

    .drag-handle {
      text-align: center;
      cursor: move;
      user-select: none;
    }

    .row-number {
      margin-left: 8px;
      font-weight: 500;
      color: #666;
    }

    /* RTL Support */
    .excel-grid-container.rtl .instructions-list {
      padding-left: 0;
      padding-right: 20px;
    }

    .excel-grid-container.rtl .stat-item {
      flex-direction: row-reverse;
    }

    ::ng-deep .excel-grid-container.rtl .htCore {
      direction: ltr;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-top {
        flex-direction: column;
        gap: 16px;
      }

      .selection-card,
      .options-card,
      .grid-card,
      .results-card,
      .instructions-alert {
        margin: 0 12px 16px 12px;
      }

      .page-header-content {
        padding: 16px;
      }

      .summary-stats {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `],
  providers: [NzMessageService, NzModalService]
})
export class ExcelGridImportComponent implements OnInit, OnDestroy {
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private bulkImportService = inject(BulkImportService);
  public translationService = inject(TranslationService);
  private translateService = inject(TranslateService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);
  
  private destroy$ = new Subject<void>();
  
  // AG-Grid
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  
  // Component state
  companies = signal<Company[]>([]);
  allResourceTypes = signal<ResourceType[]>([]);
  selectedResourceType = signal<ResourceType | null>(null);
  importResult = signal<BulkImportResultDto | null>(null);
  attachmentFiles = signal<File[]>([]);
  
  // Drag and drop state
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;
  
  // Loading states
  isLoadingCompanies = signal(false);
  isLoadingResourceTypes = signal(false);
  isImporting = signal(false);
  
  // Grid data
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    editable: true,
    resizable: true,
    minWidth: 100,
    flex: 1,
    sortable: true,
    filter: false,
    floatingFilter: false,
    suppressKeyboardEvent: (params) => {
      // Allow copy/paste keyboard shortcuts
      const keyCode = params.event.keyCode;
      const isCtrlOrCmd = params.event.ctrlKey || params.event.metaKey;
      // Allow Ctrl+C, Ctrl+V, Ctrl+X
      if (isCtrlOrCmd && (keyCode === 67 || keyCode === 86 || keyCode === 88)) {
        return false; // Don't suppress these events
      }
      return false;
    }
  };
  gridOptions: GridOptions = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    suppressCellFocus: false,
    stopEditingWhenCellsLoseFocus: true,
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 20,
    editType: 'fullRow',
    suppressClickEdit: false,
    suppressPropertyNamesCheck: true,
    maintainColumnOrder: true,
    animateRows: false, // Disable row animations to prevent flickering
    suppressBrowserResizeObserver: true, // Prevent unnecessary re-renders
    enableRangeSelection: true,
    enableRangeHandle: true,
    suppressCopyRowsToClipboard: false,
    copyHeadersToClipboard: false,
    processCellForClipboard: (params) => {
      // Format values for clipboard
      if (params.value === null || params.value === undefined) return '';
      if (params.column.getColDef()?.cellDataType === 'boolean') {
        return params.value ? 'true' : 'false';
      }
      return params.value;
    },
    processCellFromClipboard: (params) => {
      // Process pasted values - just return the string value
      // The valueParser in each column will handle type conversion
      return params.value;
    },
    processDataFromClipboard: (params) => {
      // Ensure clipboard data is processed correctly
      return params.data;
    }
  };
  
  // Forms
  selectionForm: FormGroup;
  importOptionsForm: FormGroup;
  
  // Computed values
  hasData = signal(false);
  hasValidData = signal(false);
  validRowCount = signal(0);
  invalidRowCount = signal(0);
  
  get filteredResourceTypes(): ResourceType[] {
    const companyId = this.selectionForm.get('companyId')?.value;
    if (!companyId) return [];
    
    return this.allResourceTypes().filter(rt => rt.companyId === companyId);
  }
  
  constructor() {
    this.selectionForm = this.fb.group({
      companyId: [null, [Validators.required]],
      resourceTypeId: [null, [Validators.required]]
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
    
    // Check for query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['companyId']) {
        this.selectionForm.patchValue({ companyId: +params['companyId'] });
      }
      if (params['resourceTypeId']) {
        this.selectionForm.patchValue({ resourceTypeId: +params['resourceTypeId'] });
        this.onResourceTypeChange(+params['resourceTypeId']);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCompanies(): void {
    this.isLoadingCompanies.set(true);
    this.companyService.listAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies: Company[]) => {
          this.companies.set(companies);
          this.isLoadingCompanies.set(false);
        },
        error: (error: any) => {
          console.error('Error loading companies:', error);
          this.message.error(this.translateService.instant('excel_import.error_loading_companies'));
          this.isLoadingCompanies.set(false);
        }
      });
  }
  
  loadResourceTypes(): void {
    this.isLoadingResourceTypes.set(true);
    this.resourceTypeService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types: ResourceType[]) => {
          this.allResourceTypes.set(types);
          this.isLoadingResourceTypes.set(false);
        },
        error: (error: any) => {
          console.error('Error loading resource types:', error);
          this.message.error(this.translateService.instant('excel_import.error_loading_types'));
          this.isLoadingResourceTypes.set(false);
        }
      });
  }
  
  onResourceTypeChange(resourceTypeId: number): void {
    const resourceType = this.allResourceTypes().find(rt => rt.id === resourceTypeId);
    if (resourceType) {
      this.selectedResourceType.set(resourceType);
      this.initializeGrid(resourceType);
    }
  }
  
  initializeGrid(resourceType: ResourceType): void {
    // Set up column definitions based on resource type fields
    this.columnDefs = [
      {
        field: 'title',
        headerName: 'Title *',
        editable: true,
        cellClassRules: {
          'required-cell-empty': (params) => {
            return params.value === null || params.value === undefined || params.value === '';
          }
        },
        cellClass: 'text-cell'
      },
      {
        field: 'company',
        headerName: 'Company *',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.companies().map(c => c.name)
        },
        cellClassRules: {
          'required-cell-empty': (params) => {
            return params.value === null || params.value === undefined || params.value === '';
          }
        },
        cellClass: 'select-cell',
        valueFormatter: (params: ValueFormatterParams) => {
          return params.value || '';
        }
      },
      {
        field: 'resourceCode',
        headerName: 'Resource Code',
        editable: true,
        cellClass: 'text-cell'
      }
    ];
    
    // Add custom fields
    resourceType.fields.forEach((field) => {
      const headerName = field.label || field.name;
      const colDef: ColDef = {
        field: field.name,
        headerName: field.required ? `${headerName} *` : headerName,
        editable: true,
        cellClassRules: field.required ? {
          'required-cell-empty': (params) => {
            return params.value === null || params.value === undefined || params.value === '';
          }
        } : undefined,
        cellClass: 'text-cell'
      };
      
      // Set column type based on field type
      switch (field.kind) {
        case 'NUMBER':
          colDef.cellDataType = 'text'; // Use text to allow flexible input
          colDef.cellClass = 'number-cell';
          colDef.filter = 'agTextColumnFilter'; // Use text filter
          colDef.cellEditor = 'agTextCellEditor'; // Use text editor
          colDef.cellEditorParams = {
            // Keep the value as is during editing
            useFormatter: false,
            maxLength: 20
          };
          // Use valueGetter/valueSetter instead of valueParser for better control
          colDef.valueGetter = (params) => {
            return params.data[field.name];
          };
          colDef.valueSetter = (params) => {
            console.log('Number setter - old:', params.oldValue, 'new:', params.newValue);
            
            // If clearing the cell
            if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
              params.data[field.name] = null;
              return true;
            }
            
            // Handle both direct input and pasted values
            const strValue = params.newValue.toString().trim();
            
            // If empty after trim, set to null
            if (strValue === '') {
              params.data[field.name] = null;
              return true;
            }
            
            // Remove common number formatting characters
            const cleanValue = strValue.replace(/[$,\s]/g, '');
            const numValue = parseFloat(cleanValue);
            
            // Only update if we have a valid number
            if (!isNaN(numValue)) {
              params.data[field.name] = numValue;
              console.log('Number setter result:', numValue);
              return true;
            }
            
            // Keep old value if parsing fails
            return false;
          };
          colDef.valueFormatter = (params) => {
            // Format number for display
            if (params.value === null || params.value === undefined) return '';
            return params.value.toString();
          };
          break;
        case 'DATE':
          colDef.cellDataType = 'text'; // Use text to allow flexible date input
          colDef.cellClass = 'date-cell';
          colDef.valueParser = (params) => {
            // Parse date from various formats
            if (!params.newValue || params.newValue === '') return null;
            const dateStr = params.newValue.toString().trim();
            
            // Try ISO format first
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
            
            // Try DD/MM/YYYY or DD-MM-YYYY
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              date = new Date(year, month, day);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            }
            return params.oldValue;
          };
          colDef.valueFormatter = (params) => {
            // Format date for display
            if (!params.value) return '';
            return params.value;
          };
          break;
        case 'BOOLEAN':
          colDef.cellDataType = 'text'; // Use text to allow flexible boolean input
          colDef.cellClass = 'boolean-cell';
          colDef.cellEditor = 'agTextCellEditor'; // Use text editor
          colDef.cellEditorParams = {
            useFormatter: false,
            maxLength: 5
          };
          // Use valueGetter/valueSetter for better control
          colDef.valueGetter = (params) => {
            return params.data[field.name];
          };
          colDef.valueSetter = (params) => {
            console.log('Boolean setter - field:', field.name, 'old:', params.oldValue, 'new:', params.newValue);

            // Clearing
            if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
              params.data[field.name] = null;
              return true;
            }

            // Already a boolean
            if (typeof params.newValue === 'boolean') {
              params.data[field.name] = params.newValue;
              console.log('Boolean setter result:', params.newValue);
              return true;
            }

            // Normalize string inputs
            const strValue = params.newValue.toString().toLowerCase().trim();
            if (strValue === '') {
              params.data[field.name] = null;
              return true;
            }

            if (['true', '1', 'yes', 'y'].includes(strValue)) {
              params.data[field.name] = true;
              console.log('Boolean setter result:', true);
              return true;
            }
            if (['false', '0', 'no', 'n'].includes(strValue)) {
              params.data[field.name] = false;
              console.log('Boolean setter result:', false);
              return true;
            }

            // Unrecognized input: do not change value
            console.log('Boolean setter - unrecognized input:', params.newValue);
            return false;
          };
          colDef.valueFormatter = (params) => {
            // Display boolean in a robust way (handles strings from editor)
            const value = params.value as any;
            if (value === null || value === undefined || value === '') return '';
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            const s = value.toString().toLowerCase().trim();
            if (['true', '1', 'yes', 'y'].includes(s)) return 'true';
            if (['false', '0', 'no', 'n'].includes(s)) return 'false';
            return '';
          };
          // Ensure display stays stable even after unrelated edits
          colDef.cellRenderer = (params: any) => {
            const v = params.value as any;
            if (v === null || v === undefined || v === '') return '';
            if (typeof v === 'boolean') return v ? 'true' : 'false';
            const s = v.toString().toLowerCase().trim();
            if (['true', '1', 'yes', 'y'].includes(s)) return 'true';
            if (['false', '0', 'no', 'n'].includes(s)) return 'false';
            return '';
          };
          break;
        case 'SELECT':
          colDef.cellEditor = 'agSelectCellEditor';
          colDef.cellEditorParams = {
            values: field.options || []
          };
          break;
        default:
          colDef.cellDataType = 'text';
      }
      
      this.columnDefs.push(colDef);
    });
    
    // Initialize with empty rows for immediate editing
    // Don't set default values - keep fields undefined until user enters data
    this.rowData = Array(20).fill(null).map(() => ({}));
    this.hasData.set(true); // Set to true to show the grid immediately
    this.updateDataStatus();
    
    // Force update the grid
    this.cdr.detectChanges();
  }
  
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    this.updateDataStatus();
  }
  
  onPasteEnd(event: PasteEndEvent): void {
    // Refresh the cells to apply validation styling
    setTimeout(() => {
      this.gridApi.refreshCells({
        force: true,
        suppressFlash: true
      });
      this.updateDataStatus();
    }, 100);
    this.message.success(this.translateService.instant('excel_import.data_pasted'));
  }
  
  updateDataStatus(): void {
    if (!this.gridApi) return;
    
    let validRows = 0;
    let invalidRows = 0;
    let hasAnyData = false;
    
    this.gridApi.forEachNode((node) => {
      const row = node.data;
      const hasContent = Object.keys(row).some(key => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      });
      
      if (hasContent) {
        hasAnyData = true;
        
        // Validate required fields
        let isValid = true;
        
        // Check title (always required)
        if (!row.title || row.title.trim() === '') {
          isValid = false;
        }
        
        // Check custom required fields
        const resourceType = this.selectedResourceType();
        if (resourceType) {
          resourceType.fields.forEach((field) => {
            if (field.required) {
              const value = row[field.name];
              if (value === null || value === undefined || 
                  (typeof value === 'string' && value.trim() === '')) {
                isValid = false;
              }
            }
          });
        }
        
        if (isValid) {
          validRows++;
        } else {
          invalidRows++;
        }
      }
    });
    
    this.hasData.set(hasAnyData);
    this.hasValidData.set(validRows > 0);
    this.validRowCount.set(validRows);
    this.invalidRowCount.set(invalidRows);
  }
  
  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON format with headers
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Map Excel data to our grid structure
        const resourceType = this.selectedResourceType();
        if (!resourceType) return;
        
        const mappedData = jsonData.map((row: any) => {
          const mappedRow: any = {
            title: row['Title'] || row['title'] || '',
            resourceCode: row['Resource Code'] || row['resourceCode'] || ''
          };
          
          // Map custom fields
          resourceType.fields.forEach(field => {
            const label = field.label || field.name;
            const value = row[label] || row[field.name] || '';
            mappedRow[field.name] = value;
          });
          
          return mappedRow;
        });
        
        // Update grid
        if (this.gridApi) {
          this.rowData = mappedData;
          this.gridApi.setGridOption('rowData', this.rowData);
          this.updateDataStatus();
          this.message.success(this.translateService.instant('excel_import.file_loaded'));
        }
        
      } catch (error) {
        console.error('Error reading file:', error);
        this.message.error(this.translateService.instant('excel_import.error_reading_file'));
      }
    };
    
    reader.readAsBinaryString(file);
    
    // Reset file input
    input.value = '';
  }
  
  clearGrid(): void {
    this.modal.confirm({
      nzTitle: this.translateService.instant('excel_import.confirm_clear_title'),
      nzContent: this.translateService.instant('excel_import.confirm_clear_content'),
      nzOkText: this.translateService.instant('common.confirm'),
      nzCancelText: this.translateService.instant('common.cancel'),
      nzOnOk: () => {
        if (this.gridApi) {
          // Clear grid with truly empty rows
          this.rowData = Array(20).fill(null).map(() => ({}));
          this.gridApi.setGridOption('rowData', this.rowData);
          this.updateDataStatus();
          this.importResult.set(null);
        }
      }
    });
  }
  
  exportData(): void {
    if (!this.gridApi) return;
    
    const data: any[] = [];
    this.gridApi.forEachNode((node) => {
      const row = node.data;
      const hasContent = Object.keys(row).some(key => {
        const value = row[key];
        // Check if the field has any meaningful value
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        // Any other value (including false for boolean, 0 for number) is content
        return true;
      });
      
      if (hasContent) {
        data.push(row);
      }
    });
    
    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Generate filename
    const resourceType = this.selectedResourceType();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${resourceType?.name || 'export'}_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    this.message.success(this.translateService.instant('excel_import.export_success'));
  }
  
  importData(): void {
    if (!this.gridApi) return;
    
    const resourceType = this.selectedResourceType();
    if (!resourceType) return;
    
    // Prepare documents for import
    const documents: any[] = [];
    let index = 0;
    
    this.gridApi.forEachNode((node) => {
      const row = node.data;
      const hasContent = Object.keys(row).some(key => {
        const value = row[key];
        // Check if the field has any meaningful value
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        // Any other value (including false for boolean, 0 for number) is content
        return true;
      });
      
      if (hasContent) {
        // Find company by name
        const companyName = row.company;
        const company = this.companies().find(c => c.name === companyName);
        
        // If no company specified or company not found, use default from form
        if (!company && companyName) {
          console.warn(`Company not found: ${companyName} (row ${index + 1}), using default company`);
        }
        
        const doc: any = {
          title: row.title || '',
          company: companyName || '', // Add company name for per-row processing
          resourceCode: row.resourceCode || `DOC-${Date.now()}-${index}`,
          resourceTypeId: resourceType.id,
          companyId: company?.id || this.selectionForm.get('companyId')?.value, // Fallback to form value
          fieldValues: {}
        };
        
        // Map custom fields
        resourceType.fields.forEach((field) => {
          const value = row[field.name];
          console.log(`Field ${field.name} (${field.kind}): value = ${value}`);
          
          // Only include fields that have actual values
          if (field.kind === 'BOOLEAN') {
            // Only include boolean if it has a defined value (true or false)
            if (value === true || value === false) {
              doc.fieldValues[field.name] = value;
            }
          } else if (value !== null && value !== undefined) {
            // For other fields, exclude empty strings
            if (typeof value === 'string' && value.trim() === '') {
              return;
            }
            doc.fieldValues[field.name] = value;
          }
        });
        
        documents.push(doc);
        index++;
      }
    });
    
    if (documents.length === 0) {
      this.message.warning(this.translateService.instant('excel_import.no_data_to_import'));
      return;
    }
    
    // Create bulk import request
    const importRequest: BulkImportRequestDto = {
      companyId: this.selectionForm.get('companyId')?.value!,
      resourceTypeId: resourceType.id,
      skipInvalidRows: this.importOptionsForm.get('skipInvalidRows')?.value || true,
      generateResourceCodes: this.importOptionsForm.get('generateResourceCodes')?.value || true,
      duplicateResourceTypesIfMissing: this.importOptionsForm.get('duplicateResourceTypesIfMissing')?.value || false,
      hasAttachments: this.importOptionsForm.get('hasAttachments')?.value || false,
      attachmentLinkingStrategy: this.importOptionsForm.get('attachmentLinkingStrategy')?.value || 'ROW_PREFIX'
    };
    
    // Convert documents to Excel file for backend processing
    const excelData = documents.map(doc => {
      const row: any = {
        'Title*': doc.title,
        'Company*': doc.company,
        'Resource Code*': doc.resourceCode
      };
      
      // Add custom fields with proper headers including asterisks for required fields
      resourceType.fields.forEach(field => {
        const value = doc.fieldValues[field.name];
        const columnName = field.label || field.name;
        const headerName = field.required ? `${columnName}*` : columnName;
        row[headerName] = value !== undefined ? value : '';
      });
      
      return row;
    });
    
    console.log('Excel data:', excelData);
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Convert to blob and file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const file = new File([blob], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    this.isImporting.set(true);
    
    const attachments = this.attachmentFiles();
    const hasAttachments = attachments.length > 0;
    
    // Choose the appropriate service method based on whether we have attachments
    const importObservable = hasAttachments 
      ? this.bulkImportService.processBulkImportWithAttachments(file, attachments, importRequest)
      : this.bulkImportService.processBulkImport(file, importRequest);
    
    importObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: BulkImportResultDto) => {
          this.importResult.set(result);
          this.isImporting.set(false);
          
          if (result.successfulRows > 0) {
            const message = this.translateService.instant('excel_import.import_success')
              .replace('{count}', result.successfulRows.toString());
            this.message.success(message);
          }
          
          if (result.failedRows > 0) {
            this.message.warning(
              this.translateService.instant('excel_import.import_partial', {
                success: result.successfulRows,
                failed: result.failedRows
              })
            );
          }
        },
        error: (error: any) => {
          console.error('Import error:', error);
          
          // Log more details about the error
          if (error.error) {
            console.error('Error details:', error.error);
            if (error.error.message) {
              this.message.error(error.error.message);
            } else if (typeof error.error === 'string') {
              this.message.error(error.error);
            } else {
              this.message.error(this.translateService.instant('excel_import.import_error'));
            }
          } else {
            this.message.error(this.translateService.instant('excel_import.import_error'));
          }
          
          this.isImporting.set(false);
        }
      });
  }
  
  getImportResultMessage(): string {
    const result = this.importResult();
    if (!result) return '';
    
    if (result.failedRows === 0) {
      return this.translateService.instant('excel_import.all_imported')
        .replace('{count}', result.successfulRows.toString());
    } else if (result.successfulRows === 0) {
      return this.translateService.instant('excel_import.none_imported')
        .replace('{count}', result.failedRows.toString());
    } else {
      return this.translateService.instant('excel_import.partial_imported')
        .replace('{success}', result.successfulRows.toString())
        .replace('{failed}', result.failedRows.toString());
    }
  }
  
  resetForNewImport(): void {
    this.importResult.set(null);
    this.attachmentFiles.set([]);
    this.clearGrid();
  }

  // Attachment handling methods
  onAttachmentToggle(enabled: boolean): void {
    if (!enabled) {
      this.attachmentFiles.set([]);
    }
  }

  onAttachmentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    this.attachmentFiles.set(files);
    
    this.message.success(
      this.translateService.instant('excel_import.attachments_selected', { count: files.length })
    );
    
    // Reset file input
    input.value = '';
  }

  removeAttachment(index: number): void {
    const currentFiles = this.attachmentFiles();
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    this.attachmentFiles.set(updatedFiles);
    
    this.message.success(this.translateService.instant('excel_import.attachment_removed'));
  }

  suggestRename(file: File, index: number): void {
    const strategy = this.importOptionsForm.get('attachmentLinkingStrategy')?.value || 'ROW_PREFIX';
    let suggestedName = '';
    
    if (strategy === 'ROW_PREFIX') {
      // Suggest ROW1_, ROW2_, etc. based on index
      const rowNumber = index + 1;
      const extension = file.name.split('.').pop();
      const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      suggestedName = `ROW${rowNumber}_${baseName}.${extension}`;
    } else if (strategy === 'RESOURCE_CODE') {
      // Suggest using a generic code
      const extension = file.name.split('.').pop();
      const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      suggestedName = `DOC${(index + 1).toString().padStart(3, '0')}_${baseName}.${extension}`;
    }
    
    this.modal.confirm({
      nzTitle: this.translateService.instant('excel_import.rename_suggestion_title'),
      nzContent: this.translateService.instant('excel_import.rename_suggestion_content', { 
        original: file.name, 
        suggested: suggestedName 
      }),
      nzOkText: this.translateService.instant('excel_import.use_suggested'),
      nzCancelText: this.translateService.instant('common.cancel'),
      nzOnOk: () => {
        // Create a new File object with the suggested name
        const newFile = new File([file], suggestedName, { type: file.type });
        const currentFiles = this.attachmentFiles();
        const updatedFiles = [...currentFiles];
        updatedFiles[index] = newFile;
        this.attachmentFiles.set(updatedFiles);
        
        this.message.success(
          this.translateService.instant('excel_import.file_renamed', { name: suggestedName })
        );
      }
    });
  }

  getAttachmentLinkInfo(filename: string): { valid: boolean; display: string } {
    const strategy = this.importOptionsForm.get('attachmentLinkingStrategy')?.value || 'ROW_PREFIX';
    
    if (strategy === 'ROW_PREFIX') {
      // Check if filename starts with ROW{number}_
      const match = filename.match(/^ROW(\d+)_/i);
      if (match) {
        const rowNumber = parseInt(match[1]);
        return {
          valid: rowNumber > 0,
          display: `Row ${rowNumber}`
        };
      }
      return {
        valid: false,
        display: 'Need ROW{number}_ prefix'
      };
    } else if (strategy === 'RESOURCE_CODE') {
      // Check if filename contains resource code prefix
      const parts = filename.split('_');
      if (parts.length >= 2 && parts[0].trim() !== '') {
        return {
          valid: true,
          display: `Code: ${parts[0]}`
        };
      }
      return {
        valid: false,
        display: 'Need {code}_ prefix'
      };
    }
    
    return { valid: false, display: 'Unknown strategy' };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // File management methods
  clearAllFiles(): void {
    this.modal.confirm({
      nzTitle: this.translateService.instant('excel_import.clear_all_files_title'),
      nzContent: this.translateService.instant('excel_import.clear_all_files_content'),
      nzOkText: this.translateService.instant('common.confirm'),
      nzCancelText: this.translateService.instant('common.cancel'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.attachmentFiles.set([]);
        this.message.success(this.translateService.instant('excel_import.all_files_cleared'));
      }
    });
  }

  fixAllNames(): void {
    const strategy = this.importOptionsForm.get('attachmentLinkingStrategy')?.value || 'ROW_PREFIX';
    const currentFiles = this.attachmentFiles();
    
    if (currentFiles.length === 0) return;

    this.modal.confirm({
      nzTitle: this.translateService.instant('excel_import.fix_all_names_title'),
      nzContent: this.translateService.instant('excel_import.fix_all_names_content', { 
        strategy: strategy === 'ROW_PREFIX' ? 'ROW1_, ROW2_, ROW3_...' : 'DOC001_, DOC002_, DOC003_...'
      }),
      nzOkText: this.translateService.instant('excel_import.fix_all'),
      nzCancelText: this.translateService.instant('common.cancel'),
      nzOnOk: () => {
        const renamedFiles = currentFiles.map((file, index) => {
          let newName = '';
          const extension = file.name.split('.').pop();
          const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/^(ROW\d+_|[A-Z0-9]+_)/, '');
          
          if (strategy === 'ROW_PREFIX') {
            newName = `ROW${index + 1}_${baseName}.${extension}`;
          } else if (strategy === 'RESOURCE_CODE') {
            newName = `DOC${(index + 1).toString().padStart(3, '0')}_${baseName}.${extension}`;
          }
          
          return new File([file], newName, { type: file.type });
        });
        
        this.attachmentFiles.set(renamedFiles);
        this.message.success(
          this.translateService.instant('excel_import.all_files_renamed', { count: renamedFiles.length })
        );
      }
    });
  }

  // File reordering methods
  moveFileUp(index: number): void {
    if (index === 0) return;
    
    const currentFiles = this.attachmentFiles();
    const newFiles = [...currentFiles];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    this.attachmentFiles.set(newFiles);
  }

  moveFileDown(index: number): void {
    const currentFiles = this.attachmentFiles();
    if (index === currentFiles.length - 1) return;
    
    const newFiles = [...currentFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    this.attachmentFiles.set(newFiles);
  }

  // Drag and drop methods
  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    
    if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
      this.draggedIndex = null;
      this.dragOverIndex = null;
      return;
    }

    const currentFiles = this.attachmentFiles();
    const newFiles = [...currentFiles];
    const draggedFile = newFiles[this.draggedIndex];
    
    // Remove the dragged file
    newFiles.splice(this.draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = this.draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newFiles.splice(insertIndex, 0, draggedFile);
    
    this.attachmentFiles.set(newFiles);
    this.draggedIndex = null;
    this.dragOverIndex = null;
    
    this.message.success(this.translateService.instant('excel_import.file_reordered'));
  }
}
