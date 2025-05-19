import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Document, DocQuery, Page, DocumentVersionInfo, CreateDocumentDto, UpdateDocumentDto, RelatedDocuments, DocumentVersion } from '../models/document.model';
import { toParams } from '../utils/api-utils';

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

  getVersions(id: number): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(`${this.documentsApiUrl}/${id}/versions`);
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
  
  update(id: number, formData: FormData): Observable<Document> {
    return this.http.put<Document>(`${this.documentsApiUrl}/${id}`, formData);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documentsApiUrl}/${id}`);
  }
  
  getFileUrl(documentId: number, storageKey: string): string {
    return `${this.documentsApiUrl}/${documentId}/files/${storageKey}`;
  }

  downloadVersionFile(docId: number, versionNo: number): Observable<Blob> {
    return this.http.get(
      `${this.documentsApiUrl}/${docId}/versions/${versionNo}/file`,
      { responseType: 'blob' }
    );
  }

  downloadLatestPrimaryFile(documentId: number, storageKey: string): Observable<Blob> {
    return this.http.get(
      `${this.documentsApiUrl}/${documentId}/files/${storageKey}`,
      { responseType: 'blob' }
    );
  }

  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(
      `${this.documentsApiUrl}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
  }

  uploadNewPrimaryVersion(documentId: number, primaryFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('primaryFile', primaryFile, primaryFile.name);
    return this.http.post(
      `${this.documentsApiUrl}/${documentId}/head`,
      formData
    );
  }

  // New method for getting related documents
  getRelatedDocuments(id: number): Observable<RelatedDocuments> {
    return this.http.get<RelatedDocuments>(`${this.documentsApiUrl}/${id}/related`);
  }
}
