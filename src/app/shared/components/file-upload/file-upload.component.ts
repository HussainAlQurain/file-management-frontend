import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Ensure FileUploadProgress interface is defined
export interface FileUploadProgress {
  file: File;
  progress: number;
  uploaded?: boolean;
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressBarModule],
  template: `
    <div class="file-upload">
      <input
        type="file"
        #fileInput
        [multiple]="multiple"
        [accept]="accept"
        (change)="onFileSelected($event)"
        class="hidden"
      />
      
      <div class="upload-container border-2 border-dashed rounded-md p-6" 
           [class.border-primary]="isDragover"
           [class.bg-primary-50]="isDragover"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)">
        
        <div class="flex flex-col items-center justify-center text-center">
          <mat-icon class="text-5xl text-gray-400">cloud_upload</mat-icon>
          <h3 class="mt-2 text-lg font-medium">
            {{ title }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ subtitle }}
          </p>
          
          <div class="mt-4">
            <button 
              mat-raised-button 
              color="primary"
              type="button" 
              (click)="fileInput.click()">
              Select Files
            </button>
          </div>
          
          <p *ngIf="maxFileSize" class="mt-2 text-xs text-gray-500">
            Max file size: {{ formatFileSize(maxFileSize) }}
          </p>
          
          <p *ngIf="allowedExtensions && allowedExtensions.length > 0" class="mt-1 text-xs text-gray-500">
            Allowed file types: {{ allowedExtensions.join(', ') }}
          </p>
        </div>
      </div>
      
      <div *ngIf="selectedFiles.length" class="mt-4">
        <h4 class="text-lg font-medium mb-2">Selected Files</h4>
        <ul class="space-y-2">
          <li *ngFor="let file of selectedFiles; trackBy: trackByFileName" class="flex flex-col p-2 bg-gray-50 rounded">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <mat-icon class="text-gray-400 mr-2">insert_drive_file</mat-icon>
                <span class="truncate max-w-xs">{{ file.name }}</span>
                <span class="ml-2 text-xs text-gray-500">({{ formatFileSize(file.size) }})</span>
              </div>
              <button 
                mat-icon-button 
                color="warn" 
                matTooltip="Remove file"
                (click)="removeFile(file)">
                <mat-icon>clear</mat-icon>
              </button>
            </div>
            
            <div *ngIf="getFileProgress(file)" class="mt-2 w-full">
              <mat-progress-bar 
                [value]="getFileProgress(file)?.progress || 0" 
                [color]="getFileProgress(file)?.error ? 'warn' : 'primary'">
              </mat-progress-bar>
              
              <p *ngIf="getFileProgress(file)?.error" class="text-xs text-warn mt-1">{{ getFileProgress(file)?.error }}</p>
              
              <p *ngIf="getFileProgress(file)?.uploaded" class="text-xs text-success mt-1">Upload complete</p>
            </div>
            
            <p *ngIf="getFileValidationError(file)" class="text-xs text-warn mt-1">{{ getFileValidationError(file) }}</p>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      transition: all 0.2s ease;
    }
    .text-warn {
      color: #f44336;
    }
    .text-success {
      color: #4caf50;
    }
  `]
})
export class FileUploadComponent {
  @Input() multiple = true;
  @Input() accept = '';
  @Input() title = 'Drag and drop files here';
  @Input() subtitle = 'or click to select files';
  @Input() maxFileSize?: number; // Maximum file size in bytes
  @Input() allowedExtensions?: string[]; // Array of allowed file extensions
  @Input() uploadProgress: FileUploadProgress[] = [];

  @Output() filesChanged = new EventEmitter<File[]>();
  @Output() fileChanged = new EventEmitter<File | null>(); // For single file mode
  @Output() fileValidationFailed = new EventEmitter<{file: File, reason: string}>();

  selectedFiles: File[] = [];
  isDragover = false;
  fileValidationErrors = new Map<string, string>();
  
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files) {
      this.handleFiles(fileInput.files);
    }
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
    
    if (event.dataTransfer && event.dataTransfer.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }
  
  handleFiles(fileList: FileList): void {
    // Convert FileList to Array for easier manipulation
    const newFiles = Array.from(fileList).filter(file => this.validateFile(file));
    
    if (this.multiple) {
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      this.filesChanged.emit(this.selectedFiles);
    } else if (newFiles.length > 0) {
      // Single file mode - replace existing selection
      this.selectedFiles = [newFiles[0]];
      this.fileChanged.emit(newFiles[0]);
    }
  }
  
  validateFile(file: File): boolean {
    // Check file size if maxFileSize is specified
    if (this.maxFileSize && file.size > this.maxFileSize) {
      const error = `File too large. Maximum allowed size is ${this.formatFileSize(this.maxFileSize)}.`;
      this.fileValidationErrors.set(file.name, error);
      this.fileValidationFailed.emit({file, reason: error});
      return false;
    }
    
    // Check file extension if allowedExtensions is specified
    if (this.allowedExtensions && this.allowedExtensions.length > 0) {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      if (!this.allowedExtensions.includes(fileExt)) {
        const error = `File type not allowed. Allowed types: ${this.allowedExtensions.join(', ')}.`;
        this.fileValidationErrors.set(file.name, error);
        this.fileValidationFailed.emit({file, reason: error});
        return false;
      }
    }
    
    // File passed validation
    this.fileValidationErrors.delete(file.name);
    return true;
  }
  
  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    this.fileValidationErrors.delete(file.name);
    
    if (this.multiple) {
      this.filesChanged.emit(this.selectedFiles);
    } else {
      this.fileChanged.emit(this.selectedFiles[0] || null);
    }
  }
  
  formatFileSize(size: number): string {
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1048576) {
      return (size / 1024).toFixed(1) + ' KB';
    } else if (size < 1073741824) {
      return (size / 1048576).toFixed(1) + ' MB';
    } else {
      return (size / 1073741824).toFixed(1) + ' GB';
    }
  }
  
  getFileProgress(file: File): FileUploadProgress | undefined {
    return this.uploadProgress.find(p => p.file.name === file.name);
  }
  
  getFileValidationError(file: File): string | undefined {
    return this.fileValidationErrors.get(file.name);
  }

  // Add this method for the template's trackBy
  public trackByFileName(index: number, item: File): string {
    return item.name;
  }
}
