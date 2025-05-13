import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
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
        </div>
      </div>
      
      @if (selectedFiles?.length) {
        <div class="mt-4">
          <h4 class="text-lg font-medium mb-2">Selected Files</h4>
          <ul class="space-y-2">
            @for (file of selectedFiles; track file.name) {
              <li class="flex items-center justify-between p-2 bg-gray-50 rounded">
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
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      transition: all 0.2s ease;
    }
  `]
})
export class FileUploadComponent {
  @Input() multiple = true;
  @Input() accept = '';
  @Input() title = 'Drag and drop files here';
  @Input() subtitle = 'or click to select files';
  
  @Output() filesChanged = new EventEmitter<File[]>();
  
  selectedFiles: File[] = [];
  isDragover = false;
  
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
    
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }
  
  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    this.filesChanged.emit(this.selectedFiles);
  }
  
  private handleFiles(files: FileList): void {
    if (this.multiple) {
      // Append files to existing selection
      this.selectedFiles = [...this.selectedFiles, ...Array.from(files)];
    } else {
      // Replace with single file
      this.selectedFiles = Array.from(files).slice(0, 1);
    }
    
    this.filesChanged.emit(this.selectedFiles);
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
