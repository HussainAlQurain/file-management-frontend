import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Document, DocQuery, Page, DocumentVersionInfo } from '../models/document.model';
import { toParams } from '../utils/api-utils';

// Define interfaces for DTOs to match backend expectations (simplified)
interface CreateDocumentDto {
  title: string;
  resourceTypeId: number;
  fieldValues: Record<string, any>; // Changed from metadata
  // Add other fields from your backend DocumentCreateDTO as needed
}

// UpdateDocumentDto is no longer strictly needed here if FormData is built in component
// interface UpdateDocumentDto {
//   title?: string;
//   fieldValues?: Record<string, any>; 
// }

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private readonly documentsApiUrl = `${environment.apiBase}/documents`; // Renamed from baseUrl

  list(query: DocQuery): Observable<Page<Document>> {
    return this.http.get<Page<Document>>(`${this.documentsApiUrl}/search`, { params: toParams(query) }); // Changed to /search endpoint
  }
  
  get(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.documentsApiUrl}/${id}`);
  }

  getVersions(id: number): Observable<DocumentVersionInfo[]> {
    return this.http.get<DocumentVersionInfo[]>(`${this.documentsApiUrl}/${id}/versions`);
  }
  
  create(documentDto: CreateDocumentDto, primaryFile: File, attachments?: File[]): Observable<Document> {
    const formData = new FormData();
    // Ensure the 'dto' part contains the CreateDocumentDto structure
    formData.append('dto', new Blob([JSON.stringify(documentDto)], { type: 'application/json' }));
    formData.append('primaryFile', primaryFile, primaryFile.name);
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        formData.append('attachments', file, file.name);
      });
    }
    
    return this.http.post<Document>(this.documentsApiUrl, formData);
    // Note: If backend expects progress, add { reportProgress: true, observe: 'events' }
  }
  
  // Update method now accepts FormData directly
  update(id: number, formData: FormData): Observable<Document> {
    return this.http.put<Document>(`${this.documentsApiUrl}/${id}`, formData);
    // Note: If backend expects progress, add { reportProgress: true, observe: 'events' }
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documentsApiUrl}/${id}`);
  }
  
  checkPermission(id: number, permission: string): Observable<boolean> {
    return this.http.head<any>(`${this.documentsApiUrl}/${id}?perm=${permission}`, { observe: 'response' })
      .pipe(
        map(() => true)
      );
  }
}
