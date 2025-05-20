import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTabsModule,
    FormsModule
  ],
  template: `
    <div class="file-viewer">
      <mat-card>
        <mat-card-header>
          <div class="flex justify-between items-center w-full">
            <mat-card-title>
              {{ fileName || 'Document Viewer' }}
            </mat-card-title>
            
            <div class="flex gap-2">
              <button mat-icon-button [matTooltip]="'Download ' + fileName" (click)="download()">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Close Viewer" (click)="close()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Loading indicator -->
          @if (isLoading) {
            <div class="flex justify-center items-center py-20">
              <mat-spinner diameter="50"></mat-spinner>
            </div>
          }
          
          <!-- Error message -->
          @if (error) {
            <div class="flex flex-col items-center justify-center py-20 text-center px-4">
              <mat-icon class="text-5xl text-red-500 mb-4">error_outline</mat-icon>
              <h3 class="text-xl font-medium mb-2">Error Loading File</h3>
              <p class="text-gray-600">{{ error }}</p>
              <button mat-stroked-button color="primary" class="mt-4" (click)="loadFile()">
                Try Again
              </button>
            </div>
          }
          
          <!-- PDF Viewer -->
          @if (!isLoading && !error && isPdf) {
            <div class="pdf-container" style="height: 80vh;">
              <ngx-extended-pdf-viewer 
                [src]="fileUrl || ''"
                height="100%"
                [showToolbar]="true"
                [showSecondaryToolbarButton]="true"
                [showOpenFileButton]="false"
                [showPrintButton]="true"
                [showDownloadButton]="true"
                [showPagingButtons]="true"
                [showZoomButtons]="true"
                [showFindButton]="true"
                [zoom]="'auto'"
                [filenameForDownload]="fileName || 'document.pdf'">
              </ngx-extended-pdf-viewer>
            </div>
          }
          
          <!-- Excel Viewer -->
          @if (!isLoading && !error && isExcel) {
            <div class="excel-container mt-4">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <span class="font-medium">Sheet: </span>
                  <select [(ngModel)]="activeSheet" (change)="changeSheet()" class="border rounded p-1 ml-2">
                    @for (sheet of sheetNames; track sheet) {
                      <option [value]="sheet">{{ sheet }}</option>
                    }
                  </select>
                </div>
                
                <div class="flex gap-2">
                  <button mat-stroked-button color="primary" *ngIf="hasChanges" (click)="saveExcel()">
                    <mat-icon>save</mat-icon> Save Changes
                  </button>
                  
                  <button mat-stroked-button (click)="exportExcel()">
                    <mat-icon>description</mat-icon> Export
                  </button>
                </div>
              </div>
              
              <div class="overflow-auto border rounded">
                <table class="w-full excel-table">
                  <thead>
                    <tr>
                      <th></th> <!-- Corner cell -->
                      @for (col of excelColumnHeaders; track col) {
                        <th class="excel-header">{{ col }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of excelData; track row.index; let rowIndex = $index) {
                      <tr>
                        <th class="excel-header">{{ rowIndex + 1 }}</th>
                        @for (cell of row.data; track cell.col; let colIndex = $index) {
                          <td 
                            class="excel-cell" 
                            [class.active]="activeCell.row === rowIndex && activeCell.col === colIndex"
                            (click)="selectCell(rowIndex, colIndex)">
                            @if (editingCell.row === rowIndex && editingCell.col === colIndex) {
                              <input 
                                #cellInput
                                type="text" 
                                class="cell-input" 
                                [value]="cell.value" 
                                (blur)="updateCell(rowIndex, colIndex, $event)"
                                (keydown.enter)="updateCellAndBlur(rowIndex, colIndex, $event)"
                                (keydown.escape)="cancelEditAndBlur($event)"
                                (click)="$event.stopPropagation()">
                            } @else {
                              {{ cell.value === null ? '' : cell.value }}
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
          
          <!-- Unsupported file type -->
          @if (!isLoading && !error && !isPdf && !isExcel) {
            <div class="flex flex-col items-center justify-center py-20 text-center px-4">
              <mat-icon class="text-5xl text-gray-500 mb-4">insert_drive_file</mat-icon>
              <h3 class="text-xl font-medium mb-2">Unsupported File Type</h3>
              <p class="text-gray-600">
                This file type ({{ fileType }}) cannot be previewed in the browser.
                You can download the file to view it.
              </p>
              <button mat-raised-button color="primary" class="mt-4" (click)="download()">
                <mat-icon>download</mat-icon> Download File
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .file-viewer {
      width: 100%;
      height: 100%;
    }

    .excel-table {
      border-collapse: collapse;
      min-width: 100%;
    }

    .excel-header {
      background-color: #f3f4f6;
      padding: 6px 10px;
      text-align: center;
      font-weight: 500;
      border: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .excel-cell {
      border: 1px solid #e5e7eb;
      padding: 4px 8px;
      min-width: 80px;
      height: 28px;
      position: relative;
    }

    .excel-cell.active {
      outline: 2px solid #2563eb;
      z-index: 5;
    }

    .cell-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      padding: 4px 8px;
      outline: 2px solid #2563eb;
      z-index: 10;
    }
  `
})
export class FileViewerComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);

  @Input() fileUrl: string | null = null;
  @Input() fileName: string | null = null;
  @Input() fileType: string | null = null;
  @Input() documentId: number | null = null;
  @Input() allowEdit: boolean = false;
  
  isLoading = true;
  error: string | null = null;
  
  // Excel viewer state
  workbook: XLSX.WorkBook | null = null;
  sheetNames: string[] = [];
  activeSheet: string = '';
  excelData: { index: number; data: { col: string; value: any }[] }[] = [];
  excelColumnHeaders: string[] = [];
  activeCell: { row: number; col: number } = { row: -1, col: -1 };
  editingCell: { row: number; col: number } = { row: -1, col: -1 };
  hasChanges: boolean = false;
  
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
    this.loadFile();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fileUrl'] || changes['fileType']) && !changes['fileUrl']?.firstChange) {
      this.loadFile();
    }
  }
  
  loadFile(): void {
    if (!this.fileUrl) {
      this.error = 'No file URL provided';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    // For Excel files, we need to fetch and process them
    if (this.isExcel) {
      this.loadExcelFile();
    } else {
      // For PDFs and other file types, the viewer components handle the loading
      this.isLoading = false;
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
            this.error = 'No sheets found in the Excel file';
          }
          
          this.isLoading = false;
        } catch (err) {
          this.error = 'Failed to parse Excel file';
          this.isLoading = false;
          console.error('Excel parsing error:', err);
        }
      },
      error: (err) => {
        this.error = 'Failed to load Excel file';
        this.isLoading = false;
        console.error('Excel file loading error:', err);
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
    // Emit an event or use a service to notify parent component
    // For now, this would be handled by the parent via routing
    window.history.back();
  }
}
