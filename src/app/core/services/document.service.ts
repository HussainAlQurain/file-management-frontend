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
  private readonly baseUrl = `${environment.apiBase}/documents`;
  
  list(query: DocQuery): Observable<Page<Document>> {
    return this.http.get<Page<Document>>(this.baseUrl, { params: toParams(query) });
  }
  
  get(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/${id}`);
  }
  
  create(document: Partial<Document>, files?: File[]): Observable<Document> {
    if (files && files.length > 0) {
      return this.multipartRequest(this.baseUrl, document, files);
    }
    return this.http.post<Document>(this.baseUrl, document);
  }
  
  update(id: number, document: Partial<Document>, files?: File[]): Observable<Document> {
    if (files && files.length > 0) {
      return this.multipartRequest(`${this.baseUrl}/${id}`, document, files, 'PUT');
    }
    return this.http.put<Document>(`${this.baseUrl}/${id}`, document);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  
  checkPermission(id: number, permission: string): Observable<boolean> {
    return this.http.head<any>(`${this.baseUrl}/${id}?perm=${permission}`, { observe: 'response' })
      .pipe(
        // If we get a 200, the user has permission
        // Otherwise, a 403 will be thrown
        // Converting response to boolean
        map(() => true)
      );
  }
  
  private multipartRequest(url: string, data: any, files: File[], method = 'POST'): Observable<Document> {
    const formData = new FormData();
    
    // Add document data as JSON
    formData.append('document', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    // Add files
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    
    return this.http.request<Document>(method, url, { body: formData });
  }
}
