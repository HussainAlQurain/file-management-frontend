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
    NzUploadModule
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
  
  // Form
  selectionForm: FormGroup;
  
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
        const doc: any = {
          title: row.title || '',
          resourceCode: row.resourceCode || `DOC-${Date.now()}-${index}`,
          resourceTypeId: resourceType.id,
          companyId: this.selectionForm.get('companyId')?.value,
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
      skipInvalidRows: true,
      generateResourceCodes: true
    };
    
    // Log documents for debugging
    console.log('Documents to import:', documents);
    
    // Convert documents to Excel file for backend processing
    const excelData = documents.map(doc => {
      const row: any = {
        'Title*': doc.title,
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
    
    this.bulkImportService.processBulkImport(file, importRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: BulkImportResultDto) => {
          this.importResult.set(result);
          this.isImporting.set(false);
          
          if (result.successfulRows > 0) {
            this.message.success(
              this.translateService.instant('excel_import.import_success', {
                count: result.successfulRows
              })
            );
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
      return this.translateService.instant('excel_import.all_imported', {
        count: result.successfulRows
      });
    } else if (result.successfulRows === 0) {
      return this.translateService.instant('excel_import.none_imported', {
        count: result.failedRows
      });
    } else {
      return this.translateService.instant('excel_import.partial_imported', {
        success: result.successfulRows,
        failed: result.failedRows
      });
    }
  }
  
  resetForNewImport(): void {
    this.importResult.set(null);
    this.clearGrid();
  }
}
