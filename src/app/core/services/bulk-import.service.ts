import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BulkImportRequestDto, BulkImportResultDto } from '../models/bulk-import.model';

@Injectable({
  providedIn: 'root'
})
export class BulkImportService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/bulk-import`;

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