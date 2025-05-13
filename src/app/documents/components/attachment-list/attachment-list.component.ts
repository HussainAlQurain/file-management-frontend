import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';
import { Attachment } from '../../../core/models/document.model';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-attachment-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule, FileSizePipe],
  template: `
    <div class="attachment-list">
      @if (attachments.length) {
        <mat-nav-list>
          @for (attachment of attachments; track attachment.id) {
            <a mat-list-item (click)="downloadAttachment(attachment)">
              <mat-icon matListItemIcon>attach_file</mat-icon>
              <span matListItemTitle>{{ attachment.fileName }}</span>
              <span matListItemLine>{{ attachment.fileSize | fileSize }}</span>
              <button 
                mat-icon-button 
                matListItemMeta 
                (click)="downloadAttachment(attachment, $event)"
                matTooltip="Download">
                <mat-icon>download</mat-icon>
              </button>
            </a>
          }
        </mat-nav-list>
      } @else {
        <div class="text-center py-4 text-gray-500">
          <mat-icon class="text-5xl">folder_open</mat-icon>
          <p class="mt-2">No attachments</p>
        </div>
      }
    </div>
  `
})
export class AttachmentListComponent {
  @Input() attachments: Attachment[] = [];
  
  downloadAttachment(attachment: Attachment, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Create a download URL based on the attachment key
    const downloadUrl = `${environment.apiBase}/files/${attachment.key}`;
    
    // Create a temporary anchor and trigger download
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = attachment.fileName; // This will suggest the filename to the browser
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
