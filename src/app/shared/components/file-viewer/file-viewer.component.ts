import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';

import { FileDownloadService } from '../../../core/services/file-download.service';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzResultModule,
    NzSpaceModule
  ],
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
              [showScrollingButton]="true"
              [showSpreadButton]="true"
              [showPropertiesButton]="true"
              [height]="'70vh'"
              [useBrowserLocale]="true"
              backgroundColor="white">
            </ngx-extended-pdf-viewer>
          </div>
        } @else if (fileType === 'excel') {
          <div class="excel-controls mb-4">
            <nz-space>
              @if (hasChanges) {
                <button *nzSpaceItem nz-button nzType="primary" (click)="saveExcel()">
                  <nz-icon nzType="save"></nz-icon>
                  Save Changes
                </button>
              }
              <button *nzSpaceItem nz-button nzType="default" (click)="exportExcel()">
                <nz-icon nzType="file-excel"></nz-icon>
                Export
              </button>
            </nz-space>
          </div>
          <div id="excel-container" class="border rounded-lg"></div>
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
    
    #excel-container {
      min-height: 400px;
      background: white;
    }
    
    pre {
      max-height: 60vh;
      overflow: auto;
    }
  `]
})
export class FileViewerComponent implements OnInit, OnChanges {
  @Input() fileUrl: string = '';
  @Input() fileName: string = '';
  @Input() fileType: string = '';
  @Input() documentId: number | null = null;
  @Input() allowEdit: boolean = false;
  @Output() closeViewer = new EventEmitter<void>();

  private http = inject(HttpClient);
  private fileDownloadService = inject(FileDownloadService);

  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  textContent = '';
  hasChanges = false;
  
  // Excel viewer state
  workbook: XLSX.WorkBook | null = null;
  sheetNames: string[] = [];
  activeSheet: string = '';
  excelData: { index: number; data: { col: string; value: any }[] }[] = [];
  excelColumnHeaders: string[] = [];
  activeCell: { row: number; col: number } = { row: -1, col: -1 };
  editingCell: { row: number; col: number } = { row: -1, col: -1 };
  
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
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Generate column headers (A, B, C, etc.)
    this.excelColumnHeaders = [];
    for (let c = 0; c <= range.e.c; c++) {
      this.excelColumnHeaders.push(XLSX.utils.encode_col(c));
    }
    
    // Process the data
    this.excelData = [];
    for (let r = 0; r <= range.e.r; r++) {
      const rowData: { col: string; value: any }[] = [];
      
      for (let c = 0; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellRef];
        const value = cell ? cell.v : null;
        
        rowData.push({
          col: XLSX.utils.encode_col(c),
          value
        });
      }
      
      this.excelData.push({
        index: r,
        data: rowData
      });
    }
  }
  
  changeSheet(): void {
    this.processExcelSheet();
    this.activeCell = { row: -1, col: -1 };
    this.editingCell = { row: -1, col: -1 };
  }
  
  selectCell(row: number, col: number): void {
    this.activeCell = { row, col };
    
    if (this.allowEdit) {
      this.editingCell = { row, col };
      setTimeout(() => {
        const input = document.querySelector('.cell-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  }
  
  cancelEdit(): void {
    this.editingCell = { row: -1, col: -1 };
  }
  
  updateCell(row: number, col: number, event: any): void {
    const newValue = event.target.value;
    
    // Update the cell in excelData
    if (this.excelData[row] && this.excelData[row].data[col]) {
      const currentValue = this.excelData[row].data[col].value;
      
      if (currentValue !== newValue) {
        this.excelData[row].data[col].value = newValue;
        this.hasChanges = true;
        
        // Update the workbook
        if (this.workbook && this.activeSheet) {
          const worksheet = this.workbook.Sheets[this.activeSheet];
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          
          worksheet[cellRef] = { t: 's', v: newValue };
        }
      }
    }
    
    this.editingCell = { row: -1, col: -1 };
  }
  
  updateCellAndBlur(row: number, col: number, event: any): void {
    this.updateCell(row, col, event);
    if (event.target) {
      event.target.blur();
    }
  }
  
  cancelEditAndBlur(event: any): void {
    this.cancelEdit();
    if (event.target) {
      event.target.blur();
    }
  }
  
  saveExcel(): void {
    if (!this.workbook || !this.hasChanges) return;
    
    // Logic to save Excel file to server would go here
    // For now, just export and download
    this.exportExcel();
    
    this.hasChanges = false;
  }
  
  exportExcel(): void {
    if (!this.workbook) return;
    
    // Convert workbook to binary string
    const wbout = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create blob and download
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
