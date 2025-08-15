import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { BulkImportRequestDto, BulkImportResultDto, MultiCompanyImportResultDto, BulkAttachmentDto } from '../models/bulk-import.model';

@Injectable({
  providedIn: 'root'
})
export class BulkImportService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  private get baseUrl(): string {
    return `${this.configService.apiBase}/bulk-import`;
  }

  /**
   * Generate Excel template for bulk import based on resource type field definitions
   */
  generateExcelTemplate(resourceTypeId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template/${resourceTypeId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Process bulk import from Excel file
   */
  processBulkImport(file: File, request: BulkImportRequestDto): Observable<BulkImportResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    // Add request parameters as form data fields
    formData.append('resourceTypeId', request.resourceTypeId.toString());
    if (request.companyId) {
      formData.append('companyId', request.companyId.toString());
    }
    if (request.ownerUserId) {
      formData.append('ownerUserId', request.ownerUserId.toString());
    }
    formData.append('skipInvalidRows', (request.skipInvalidRows || false).toString());
    formData.append('generateResourceCodes', (request.generateResourceCodes || true).toString());
    formData.append('duplicateResourceTypesIfMissing', (request.duplicateResourceTypesIfMissing || false).toString());
    
    return this.http.post<BulkImportResultDto>(`${this.baseUrl}/process`, formData);
  }

  /**
   * Validate Excel file structure against resource type
   */
  validateExcelFile(file: File, resourceTypeId: number): Observable<BulkImportResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    return this.http.post<BulkImportResultDto>(`${this.baseUrl}/validate`, formData, {
      params: { resourceTypeId: resourceTypeId.toString() }
    });
  }

  /**
   * Process bulk import with attachments
   */
  processBulkImportWithAttachments(
    file: File, 
    attachments: File[], 
    request: BulkImportRequestDto
  ): Observable<BulkImportResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    // Add attachment files
    attachments.forEach((attachment, index) => {
      formData.append('attachments', attachment, attachment.name);
    });
    
    // Add request parameters
    formData.append('resourceTypeId', request.resourceTypeId.toString());
    if (request.companyId) {
      formData.append('companyId', request.companyId.toString());
    }
    if (request.ownerUserId) {
      formData.append('ownerUserId', request.ownerUserId.toString());
    }
    formData.append('skipInvalidRows', (request.skipInvalidRows || false).toString());
    formData.append('generateResourceCodes', (request.generateResourceCodes || true).toString());
    formData.append('attachmentLinkingStrategy', request.attachmentLinkingStrategy || 'ROW_PREFIX');
    
    return this.http.post<BulkImportResultDto>(`${this.baseUrl}/process-with-attachments`, formData);
  }

  /**
   * Process multi-company bulk import
   */
  processMultiCompanyImport(
    file: File,
    attachments: File[],
    request: BulkImportRequestDto
  ): Observable<MultiCompanyImportResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    // Add attachment files
    attachments.forEach((attachment, index) => {
      formData.append('attachments', attachment, attachment.name);
    });
    
    // Add request parameters
    formData.append('resourceTypeId', request.resourceTypeId.toString());
    
    // Add target company IDs
    if (request.targetCompanyIds) {
      request.targetCompanyIds.forEach(companyId => {
        formData.append('targetCompanyIds', companyId.toString());
      });
    }
    
    if (request.ownerUserId) {
      formData.append('ownerUserId', request.ownerUserId.toString());
    }
    formData.append('skipInvalidRows', (request.skipInvalidRows || false).toString());
    formData.append('generateResourceCodes', (request.generateResourceCodes || true).toString());
    formData.append('duplicateResourceTypesIfMissing', (request.duplicateResourceTypesIfMissing || false).toString());
    formData.append('attachmentLinkingStrategy', request.attachmentLinkingStrategy || 'ROW_PREFIX');
    
    return this.http.post<MultiCompanyImportResultDto>(`${this.baseUrl}/process-multi-company`, formData);
  }

  /**
   * Download a file blob with proper filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
} 