import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceType } from '../models/resource-type.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';

@Injectable({
  providedIn: 'root'
})
export class ResourceTypeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/resource-types`;
  
  list(params: Record<string, any> = {}): Observable<Page<ResourceType>> {
    return this.http.get<Page<ResourceType>>(this.baseUrl, { params: toParams(params) });
  }
  
  getAll(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(`${this.baseUrl}/all`);
  }
  
  get(id: number): Observable<ResourceType> {
    return this.http.get<ResourceType>(`${this.baseUrl}/${id}`);
  }
  
  create(resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.http.post<ResourceType>(this.baseUrl, resourceType);
  }
  
  update(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.http.put<ResourceType>(`${this.baseUrl}/${id}`, resourceType);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
