import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Document, DocQuery, Page } from '../models/document.model';
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
  
  create(document: Partial<Document>, files?: File[]): Observable<Document> {
    if (files && files.length > 0) {
      return this.multipartRequest(this.documentsApiUrl, document, files);
    }
    return this.http.post<Document>(this.documentsApiUrl, document);
  }
  
  update(id: number, document: Partial<Document>, files?: File[]): Observable<Document> {
    if (files && files.length > 0) {
      return this.multipartRequest(`${this.documentsApiUrl}/${id}`, document, files, 'PUT');
    }
    return this.http.put<Document>(`${this.documentsApiUrl}/${id}`, document);
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
  
  private multipartRequest(url: string, data: any, files: File[], method = 'POST'): Observable<Document> {
    const formData = new FormData();
    
    // Add document data as JSON, ensuring the part name is 'dto'
    formData.append('dto', new Blob([JSON.stringify(data)], { type: 'application/json' })); // Changed 'document' to 'dto'
    
    // Add files
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    
    return this.http.request<Document>(method, url, { body: formData });
  }
}
