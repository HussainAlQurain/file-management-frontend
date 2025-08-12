import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, GridOptions, ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import * as XLSX from 'xlsx';

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
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { DocumentService } from '../../core/services/document.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { TranslationService } from '../../core/services/translation.service';
import { Company } from '../../core/models/company.model';
import { ResourceType } from '../../core/models/resource-type.model';
import { Document, DocQuery } from '../../core/models/document.model';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-data-grid-view',
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
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzStatisticModule,
    NzEmptyModule
  ],
  template: `
    <div class="data-grid-container" [class.rtl]="translationService.isRTL()">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <div class="header-top">
            <div class="header-title-section" [class.rtl-header]="translationService.isRTL()">
              <h1 class="page-title">{{ 'data_grid.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'data_grid.subtitle' | translate }}</p>
            </div>
            <div class="header-actions" [class.rtl-actions]="translationService.isRTL()">
              <nz-space nzSize="middle">
                <button *nzSpaceItem nz-button nzType="default" routerLink="/documents" class="action-button">
                  <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                  <span>{{ 'data_grid.back_to_documents' | translate }}</span>
                </button>
              </nz-space>
            </div>
          </div>
          
          <div class="breadcrumb-section" [class.rtl-breadcrumb]="translationService.isRTL()">
            <nz-breadcrumb>
              <nz-breadcrumb-item>
                <a routerLink="/documents">{{ 'nav.documents' | translate }}</a>
              </nz-breadcrumb-item>
              <nz-breadcrumb-item>{{ 'data_grid.breadcrumb' | translate }}</nz-breadcrumb-item>
            </nz-breadcrumb>
          </div>
        </div>
      </div>

      <!-- Resource Type Selection -->
      <nz-card [nzTitle]="'data_grid.select_type' | translate" class="selection-card">
        <form nz-form [formGroup]="selectionForm" nzLayout="vertical">
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label>{{ 'data_grid.company' | translate }}</nz-form-label>
                <nz-form-control>
                  <nz-select 
                    formControlName="companyId" 
                    [nzPlaceHolder]="'data_grid.company_placeholder' | translate"
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
                <nz-form-label>{{ 'data_grid.document_type' | translate }}</nz-form-label>
                <nz-form-control>
                  <nz-select 
                    formControlName="resourceTypeId" 
                    [nzPlaceHolder]="'data_grid.document_type_placeholder' | translate"
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
                  <button 
                    nz-button 
                    nzType="primary"
                    [disabled]="!selectedResourceType()"
                    [nzLoading]="isLoadingData()"
                    (click)="loadDocuments()">
                    <nz-icon nzType="reload"></nz-icon>
                    <span>{{ 'data_grid.load_data' | translate }}</span>
                  </button>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
        </form>
      </nz-card>

      <!-- Statistics -->
      <div *ngIf="selectedResourceType() && documents().length > 0" class="stats-row">
        <nz-card>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="6">
              <nz-statistic 
                [nzTitle]="'data_grid.stats.total_documents' | translate" 
                [nzValue]="totalDocuments()">
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic 
                [nzTitle]="'data_grid.stats.displayed_documents' | translate" 
                [nzValue]="displayedDocuments()">
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic 
                [nzTitle]="'data_grid.stats.filtered_documents' | translate" 
                [nzValue]="filteredDocuments()">
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic 
                [nzTitle]="'data_grid.stats.last_updated' | translate" 
                [nzValue]="lastUpdated().toLocaleString()">
              </nz-statistic>
            </div>
          </div>
        </nz-card>
      </div>

      <!-- Data Grid -->
      <nz-card 
        *ngIf="selectedResourceType()" 
        [nzTitle]="gridTitle"
        [nzExtra]="gridActionsTemplate"
        class="grid-card">
        
        <ng-template #gridTitle>
          <span>{{ selectedResourceType()?.name || '' }} {{ 'data_grid.documents' | translate }}</span>
        </ng-template>
        
        <ng-template #gridActionsTemplate>
          <nz-space>
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default"
              [disabled]="documents().length === 0"
              (click)="exportToExcel()">
              <nz-icon nzType="file-excel"></nz-icon>
              <span>{{ 'data_grid.export_excel' | translate }}</span>
            </button>
            
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default"
              [disabled]="documents().length === 0"
              (click)="exportToCsv()">
              <nz-icon nzType="file-text"></nz-icon>
              <span>{{ 'data_grid.export_csv' | translate }}</span>
            </button>
            
            <button 
              *nzSpaceItem
              nz-button 
              nzType="default"
              [disabled]="!hasFilters"
              (click)="clearFilters()">
              <nz-icon nzType="clear"></nz-icon>
              <span>{{ 'data_grid.clear_filters' | translate }}</span>
            </button>
          </nz-space>
        </ng-template>

        <div class="grid-wrapper" *ngIf="documents().length > 0">
          <ag-grid-angular
            [class]="'ag-theme-quartz' + (translationService.isRTL() ? ' rtl' : '')"
            [style.height]="'600px'"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [enableRangeSelection]="true"
            [enableCellTextSelection]="true"
            [suppressMenuHide]="true"
            [animateRows]="true"
            [gridOptions]="gridOptions"
            (gridReady)="onGridReady($event)">
          </ag-grid-angular>
        </div>

        <nz-empty 
          *ngIf="documents().length === 0 && !isLoadingData()" 
          [nzNotFoundContent]="'data_grid.no_data' | translate"
          [nzNotFoundFooter]="noDataFooter">
          <ng-template #noDataFooter>
            <button nz-button nzType="primary" routerLink="/documents/new">
              <nz-icon nzType="plus"></nz-icon>
              <span>{{ 'data_grid.create_document' | translate }}</span>
            </button>
          </ng-template>
        </nz-empty>
      </nz-card>
    </div>
  `,
  styles: [`
    .data-grid-container {
      padding: 0;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .data-grid-container.rtl {
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
    .grid-card {
      margin: 0 24px 24px 24px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .stats-row {
      margin: 0 24px 24px 24px;
    }

    .grid-wrapper {
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      overflow: hidden;
    }

    /* Handsontable styling */
    ::ng-deep .htCore {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
    }

    ::ng-deep .ht_master tr:first-child th {
      background-color: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      border-bottom: 2px solid #e8e8e8;
    }

    ::ng-deep .htCenter {
      text-align: center;
    }

    ::ng-deep .htLeft {
      text-align: left;
    }

    ::ng-deep .htRight {
      text-align: right;
    }

    /* RTL Support */
    .data-grid-container.rtl ::ng-deep .htCore {
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
      .stats-row {
        margin: 0 12px 16px 12px;
      }

      .page-header-content {
        padding: 16px;
      }
    }
  `],
  providers: [NzMessageService]
})
export class DataGridViewComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentService);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  public translationService = inject(TranslationService);
  private translateService = inject(TranslateService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  
  private destroy$ = new Subject<void>();
  
  // AG-Grid
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  
  // Component state
  companies = signal<Company[]>([]);
  allResourceTypes = signal<ResourceType[]>([]);
  selectedResourceType = signal<ResourceType | null>(null);
  documents = signal<Document[]>([]);
  
  // Loading states
  isLoadingCompanies = signal(false);
  isLoadingResourceTypes = signal(false);
  isLoadingData = signal(false);
  
  // Grid data
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100
  };
  gridOptions: GridOptions = {
    enableRangeSelection: true,
    suppressRowClickSelection: true,
    animateRows: true,
    rowSelection: 'multiple'
  };
  
  // Statistics
  totalDocuments = signal(0);
  displayedDocuments = signal(0);
  filteredDocuments = signal(0);
  lastUpdated = signal<Date>(new Date());
  hasFilters = false;
  
  // Form
  selectionForm: FormGroup;
  
  get filteredResourceTypes(): ResourceType[] {
    const companyId = this.selectionForm.get('companyId')?.value;
    if (!companyId) return [];
    
    return this.allResourceTypes().filter(rt => rt.companyId === companyId);
  }
  
  constructor() {
    this.selectionForm = this.fb.group({
      companyId: [null],
      resourceTypeId: [null]
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
        // Auto-load if both parameters are present
        if (params['companyId'] && params['resourceTypeId']) {
          setTimeout(() => this.loadDocuments(), 500);
        }
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
          this.message.error(this.translateService.instant('data_grid.error_loading_companies'));
          this.isLoadingCompanies.set(false);
        }
      });
  }
  
  loadResourceTypes(): void {
    this.isLoadingResourceTypes.set(true);
    this.resourceTypeService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.allResourceTypes.set(types);
          this.isLoadingResourceTypes.set(false);
        },
        error: (error: any) => {
          console.error('Error loading resource types:', error);
          this.message.error(this.translateService.instant('data_grid.error_loading_types'));
          this.isLoadingResourceTypes.set(false);
        }
      });
  }
  
  onResourceTypeChange(resourceTypeId: number): void {
    const resourceType = this.allResourceTypes().find(rt => rt.id === resourceTypeId);
    if (resourceType) {
      this.selectedResourceType.set(resourceType);
      this.setupGrid(resourceType);
    }
  }
  
  setupGrid(resourceType: ResourceType): void {
    // Set up column definitions based on resource type fields
    this.columnDefs = [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'title', headerName: 'Title' },
      { field: 'resourceCode', headerName: 'Resource Code' },
      { field: 'status', headerName: 'Status', width: 100 },
      { 
        field: 'createdAt', 
        headerName: 'Created',
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ''
      },
      { 
        field: 'updatedAt', 
        headerName: 'Updated',
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ''
      }
    ];
    
    // Add custom fields
    resourceType.fields.forEach((field) => {
      const colDef: ColDef = {
        field: `fieldValues.${field.name}`,
        headerName: field.label || field.name,
        valueGetter: (params) => params.data.fieldValues?.[field.name]
      };
      
      // Set column type based on field type
      switch (field.kind) {
        case 'NUMBER':
          colDef.cellDataType = 'number';
          break;
        case 'DATE':
          colDef.cellDataType = 'date';
          colDef.valueFormatter = (params) => params.value ? new Date(params.value).toLocaleDateString() : '';
          break;
        case 'BOOLEAN':
          colDef.cellDataType = 'boolean';
          colDef.cellRenderer = 'agCheckboxCellRenderer';
          break;
        default:
          colDef.cellDataType = 'text';
      }
      
      this.columnDefs.push(colDef);
    });
  }
  
  loadDocuments(): void {
    const companyId = this.selectionForm.get('companyId')?.value;
    const resourceTypeId = this.selectionForm.get('resourceTypeId')?.value;
    
    if (!companyId || !resourceTypeId) {
      this.message.warning(this.translateService.instant('data_grid.select_both'));
      return;
    }
    
    this.isLoadingData.set(true);
    
    const query: DocQuery = {
      companyIdEquals: companyId,
      resourceTypeIdEquals: resourceTypeId,
      size: 1000, // Load up to 1000 documents
      page: 0,
      sort: 'createdAt,desc'
    };
    
    this.documentService.list(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.documents.set(page.content);
          this.totalDocuments.set(page.totalElements);
          this.displayedDocuments.set(page.content.length);
          this.filteredDocuments.set(page.content.length);
          this.lastUpdated.set(new Date());
          
          // Transform documents to grid data
          this.rowData = page.content.map(doc => ({
            id: doc.id,
            title: doc.title,
            resourceCode: doc.resourceCode,
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            fieldValues: doc.fieldValues || {}
          }));
          
          // Update grid
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.rowData);
          }
          
          // Trigger change detection
          this.cdr.detectChanges();
          
          this.isLoadingData.set(false);
          
          // If no documents, show empty state
          if (page.content.length === 0) {
            this.message.info(this.translateService.instant('data_grid.no_data'));
          } else if (page.totalElements > page.content.length) {
            this.message.info(
              this.translateService.instant('data_grid.showing_limited', {
                shown: page.content.length,
                total: page.totalElements
              })
            );
          }
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.message.error(this.translateService.instant('data_grid.error_loading_data'));
          this.isLoadingData.set(false);
          
          // Initialize empty grid
          this.rowData = [];
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.rowData);
          }
        }
      });
  }
  
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    
    // Set up filter change listener
    this.gridApi.addEventListener('filterChanged', () => {
      const filterModel = this.gridApi.getFilterModel();
      this.hasFilters = Object.keys(filterModel).length > 0;
      
      // Update filtered count
      let filteredCount = 0;
      this.gridApi.forEachNodeAfterFilter(node => filteredCount++);
      this.filteredDocuments.set(filteredCount);
    });
  }
  
  clearFilters(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.hasFilters = false;
    }
  }
  
  exportToExcel(): void {
    if (!this.gridApi) return;
    
    const data: any[] = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      data.push(node.data);
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Generate filename
    const resourceType = this.selectedResourceType();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${resourceType?.name || 'data'}_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    this.message.success(this.translateService.instant('data_grid.export_success'));
  }
  
  exportToCsv(): void {
    if (!this.gridApi) return;
    
    // Generate filename
    const resourceType = this.selectedResourceType();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${resourceType?.name || 'data'}_${timestamp}.csv`;
    
    // Export using AG-Grid's built-in CSV export
    this.gridApi.exportDataAsCsv({
      fileName: filename,
      suppressQuotes: false,
      allColumns: true
    });
    
    this.message.success(this.translateService.instant('data_grid.export_success'));
  }
}
