import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, inject, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { HotTableModule } from '@handsontable/angular';
import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { FileDownloadService } from '../../../core/services/file-download.service';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    FormsModule,
    HotTableModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzResultModule,
    NzSpaceModule,
    NzSelectModule
  ],
  providers: [HotTableRegisterer],
  template: `
    <nz-card>
      <div nz-card-meta>
        <div nz-card-meta-title>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <nz-icon [nzType]="getFileIcon()" class="text-blue-500 mr-3 text-2xl"></nz-icon>
              <span class="text-lg font-medium">{{ fileName }}</span>
            </div>
            
            <nz-space>
              <button *nzSpaceItem nz-button nzType="primary" nzGhost (click)="download()">
                <nz-icon nzType="download"></nz-icon>
                Download
              </button>
              <button *nzSpaceItem nz-button nzType="default" (click)="close()">
                <nz-icon nzType="close"></nz-icon>
                Close
              </button>
            </nz-space>
          </div>
        </div>
      </div>

      <div nz-card-body class="mt-4">
        @if (isLoading()) {
          <div class="text-center py-12">
            <nz-spin nzSize="large" nzTip="Loading file..."></nz-spin>
          </div>
        } @else if (hasError()) {
          <nz-result 
            nzStatus="error" 
            nzTitle="Failed to load file" 
            [nzSubTitle]="errorMessage()">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="loadFile()">
                <nz-icon nzType="reload"></nz-icon>
                Retry
              </button>
            </div>
          </nz-result>
        } @else if (fileType === 'pdf') {
          <div class="pdf-container">
            <ngx-extended-pdf-viewer 
              [src]="fileUrl" 
              [zoom]="'page-fit'"
              [showToolbar]="true"
              [showSidebarButton]="true"
              [showFindButton]="true"
              [showPagingButtons]="true"
              [showZoomButtons]="true"
              [showPresentationModeButton]="true"
              [showOpenFileButton]="false"
              [showPrintButton]="true"
              [showDownloadButton]="false"
              [showSecondaryToolbarButton]="true"
              [showRotateButton]="true"
              [showHandToolButton]="true"
              [showSpreadButton]="true"
              [showPropertiesButton]="true"
              [height]="'70vh'"
              backgroundColor="white">
            </ngx-extended-pdf-viewer>
          </div>
        } @else if (fileType === 'excel') {
          <div class="excel-controls mb-4">
            <nz-space>
              @if (sheetNames.length > 1) {
                <div *nzSpaceItem class="sheet-selector">
                  <nz-select [(ngModel)]="activeSheet" (ngModelChange)="changeSheet()" style="width: 200px;">
                    <nz-option *ngFor="let sheet of sheetNames" [nzValue]="sheet" [nzLabel]="sheet"></nz-option>
                  </nz-select>
                </div>
              }
              <button *nzSpaceItem nz-button nzType="default" (click)="exportExcel()">
                <nz-icon nzType="file-excel"></nz-icon>
                Export
              </button>
              @if (allowEdit && hasChanges) {
                <button *nzSpaceItem nz-button nzType="primary" (click)="saveChanges()">
                  <nz-icon nzType="save"></nz-icon>
                  Save Changes
                </button>
              }
            </nz-space>
          </div>
          <div class="excel-container">
            <hot-table
              [hotId]="hotId"
              [data]="hotData"
              [colHeaders]="columnHeaders"
              [rowHeaders]="true"
              [contextMenu]="allowEdit"
              [readOnly]="!allowEdit"
              [manualColumnResize]="true"
              [manualRowResize]="true"
              [filters]="true"
              [dropdownMenu]="true"
              [licenseKey]="'non-commercial-and-evaluation'"
              [height]="500"
              [stretchH]="'all'"
              [afterChange]="onCellChange"
              className="htCenter">
            </hot-table>
          </div>
        } @else if (fileType === 'image') {
          <div class="text-center">
            <img [src]="fileUrl" [alt]="fileName" class="max-w-full h-auto rounded-lg shadow-md" />
          </div>
        } @else if (fileType === 'text') {
          <div class="bg-gray-50 p-4 rounded-lg">
            <pre class="whitespace-pre-wrap font-mono text-sm">{{ textContent }}</pre>
          </div>
        } @else {
          <!-- Generic file display -->
          <div class="text-center py-12">
            <nz-icon [nzType]="getFileIcon()" class="text-6xl text-gray-400 mb-4"></nz-icon>
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ fileName }}</h3>
            <p class="text-gray-500 mb-4">Preview not available for this file type</p>
            <button nz-button nzType="primary" (click)="download()">
              <nz-icon nzType="download"></nz-icon>
              Download File
            </button>
          </div>
        }
      </div>
    </nz-card>
  `,
  styles: [`
    .pdf-container {
      width: 100%;
      height: 70vh;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .excel-controls {
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    
    .excel-container {
      min-height: 400px;
      background: white;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .sheet-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
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
    
    pre {
      max-height: 60vh;
      overflow: auto;
    }
  `]
})
export class FileViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fileUrl: string = '';
  @Input() fileName: string = '';
  @Input() fileType: string = '';
  @Input() documentId: number | null = null;
  @Input() allowEdit: boolean = false;
  @Output() closeViewer = new EventEmitter<void>();

  private http = inject(HttpClient);
  private fileDownloadService = inject(FileDownloadService);
  private hotRegisterer = inject(HotTableRegisterer);

  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  textContent = '';
  hasChanges = false;
  
  // Excel viewer state
  hotId = 'file-viewer-excel';
  workbook: XLSX.WorkBook | null = null;
  sheetNames: string[] = [];
  activeSheet: string = '';
  hotData: any[][] = [];
  columnHeaders: string[] = [];
  excelData: { index: number; data: { col: string; value: any }[] }[] = [];
  excelColumnHeaders: string[] = [];
  
  get isPdf(): boolean {
    return this.fileType === 'application/pdf';
  }
  
  get isExcel(): boolean {
    return (
      this.fileType === 'application/vnd.ms-excel' || 
      this.fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }
  
  ngOnInit(): void {
    if (this.fileUrl) {
      this.loadFile();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fileUrl'] || changes['fileType']) && !changes['fileUrl']?.firstChange) {
      this.loadFile();
    }
  }
  
  ngOnDestroy(): void {
    // Clean up Handsontable instance
    const hotInstance = this.hotRegisterer.getInstance(this.hotId);
    if (hotInstance) {
      hotInstance.destroy();
    }
  }
  
  loadFile(): void {
    if (!this.fileUrl) {
      this.errorMessage.set('No file URL provided');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    
    // For Excel files, we need to fetch and process them
    if (this.isExcel) {
      this.loadExcelFile();
    } else if (this.fileType === 'text') {
      this.loadTextFile();
    } else {
      // For PDFs and other file types, the viewer components handle the loading
      this.isLoading.set(false);
    }
  }
  
  loadExcelFile(): void {
    if (!this.fileUrl) return;
    
    this.http.get(this.fileUrl, { responseType: 'arraybuffer' }).subscribe({
      next: (data) => {
        try {
          const arrayBuffer = data;
          this.workbook = XLSX.read(arrayBuffer, { type: 'array' });
          this.sheetNames = this.workbook.SheetNames;
          
          if (this.sheetNames.length > 0) {
            this.activeSheet = this.sheetNames[0];
            this.processExcelSheet();
          } else {
            this.errorMessage.set('No sheets found in the Excel file');
          }
          
          this.isLoading.set(false);
        } catch (err) {
          this.errorMessage.set('Failed to parse Excel file');
          this.isLoading.set(false);
          console.error('Excel parsing error:', err);
        }
      },
      error: (err) => {
        this.errorMessage.set('Failed to load Excel file');
        this.isLoading.set(false);
        console.error('Excel file loading error:', err);
      }
    });
  }
  
  private loadTextFile(): void {
    if (!this.fileUrl) return;
    
    this.http.get(this.fileUrl, { responseType: 'text' }).subscribe({
      next: (text) => {
        this.textContent = text;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load text file');
        this.isLoading.set(false);
        console.error('Text file loading error:', err);
      }
    });
  }
  
  processExcelSheet(): void {
    if (!this.workbook || !this.activeSheet) return;
    
    const worksheet = this.workbook.Sheets[this.activeSheet];
    
    // Convert sheet to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
    
    // If there's data, use the first row as headers if it looks like headers
    if (data.length > 0) {
      const firstRow = data[0];
      const hasHeaders = firstRow.some((cell: any) => 
        cell && typeof cell === 'string' && isNaN(Number(cell))
      );
      
      if (hasHeaders) {
        this.columnHeaders = firstRow.map((h: any) => h ? String(h) : '');
        this.hotData = data.slice(1);
      } else {
        // Generate column headers (A, B, C, etc.)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        this.columnHeaders = [];
        for (let c = 0; c <= range.e.c; c++) {
          this.columnHeaders.push(XLSX.utils.encode_col(c));
        }
        this.hotData = data;
      }
    } else {
      this.columnHeaders = [];
      this.hotData = [];
    }
    
    // Also keep the old format for compatibility
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    this.excelColumnHeaders = [];
    for (let c = 0; c <= range.e.c; c++) {
      this.excelColumnHeaders.push(XLSX.utils.encode_col(c));
    }
    
    // Update Handsontable instance if it exists
    setTimeout(() => {
      const hotInstance = this.hotRegisterer.getInstance(this.hotId);
      if (hotInstance) {
        hotInstance.loadData(this.hotData);
        hotInstance.updateSettings({
          colHeaders: this.columnHeaders
        });
      }
    }, 100);
  }
  
  changeSheet(): void {
    this.processExcelSheet();
    this.hasChanges = false;
  }
  
  onCellChange = (changes: any[] | null, source: string) => {
    if (changes && source !== 'loadData' && this.allowEdit) {
      this.hasChanges = true;
      
      // Update the workbook with changes
      if (this.workbook && this.activeSheet) {
        const worksheet = this.workbook.Sheets[this.activeSheet];
        
        changes.forEach(change => {
          const [row, col, oldValue, newValue] = change;
          if (oldValue !== newValue) {
            const cellRef = XLSX.utils.encode_cell({ 
              r: this.columnHeaders.length > 0 && this.hasHeaders() ? row + 1 : row, 
              c: col 
            });
            
            if (newValue === null || newValue === '') {
              delete worksheet[cellRef];
            } else {
              worksheet[cellRef] = { 
                t: typeof newValue === 'number' ? 'n' : 's', 
                v: newValue 
              };
            }
          }
        });
      }
    }
  }
  
  hasHeaders(): boolean {
    // Check if we determined the first row was headers during processing
    return this.hotData.length > 0 && 
           this.columnHeaders.length > 0 && 
           this.columnHeaders.some(h => h && !h.match(/^[A-Z]+$/));
  }
  
  saveChanges(): void {
    if (!this.workbook || !this.hasChanges || !this.documentId) return;
    
    // TODO: Implement saving changes back to server
    // For now, just export
    this.exportExcel();
    this.hasChanges = false;
  }
  
  exportExcel(): void {
    const hotInstance = this.hotRegisterer.getInstance(this.hotId);
    if (!hotInstance) return;
    
    // Get current data from Handsontable
    const data = hotInstance.getData();
    
    // Create new workbook with current data
    const ws = XLSX.utils.aoa_to_sheet([this.columnHeaders, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.activeSheet || 'Sheet1');
    
    // If we have multiple sheets, copy them from original workbook
    if (this.workbook && this.sheetNames.length > 1) {
      this.sheetNames.forEach(sheetName => {
        if (sheetName !== this.activeSheet) {
          wb.Sheets[sheetName] = this.workbook!.Sheets[sheetName];
          wb.SheetNames.push(sheetName);
        }
      });
    }
    
    // Export
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName || 'document.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  download(): void {
    if (!this.fileUrl) return;
    
    // If it's Excel and we have changes, export the modified workbook
    if (this.isExcel && this.hasChanges && this.workbook) {
      this.exportExcel();
      return;
    }
    
    // For other file types, just use the URL
    const a = document.createElement('a');
    a.href = this.fileUrl;
    a.download = this.fileName || 'document';
    a.click();
  }
  
  close(): void {
    this.closeViewer.emit();
  }

  getFileIcon(): string {
    const extension = this.fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      case 'ppt':
      case 'pptx':
        return 'file-ppt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'file-image';
      case 'txt':
      case 'md':
        return 'file-text';
      case 'zip':
      case 'rar':
      case '7z':
        return 'file-zip';
      default:
        return 'file';
    }
  }
}
