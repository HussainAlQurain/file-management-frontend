import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceType, CreateResourceTypeDto, UpdateResourceTypeDto, FieldDefinitionDto, CreateFieldDto, UpdateFieldDto } from '../models/resource-type.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResourceTypeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/resource-types`;
  
  list(params: Record<string, any> = {}): Observable<Page<ResourceType>> {
    return this.http.get<Page<ResourceType>>(this.baseUrl, { params: toParams(params) });
  }
  
  listAllNonPaged(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(this.baseUrl);
  }

  getAll(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(`${this.baseUrl}`);
  }
  
  get(id: number): Observable<ResourceType> {
    console.log(`Fetching resource type with ID: ${id}`);
    return this.http.get<ResourceType>(`${this.baseUrl}/${id}`).pipe(
      tap(response => {
        console.log(`Raw resource type response:`, response);
        console.log(`Fields property in response:`, response.fields);
      })
    );
  }
  
  create(resourceTypeDto: CreateResourceTypeDto): Observable<ResourceType> {
    return this.http.post<ResourceType>(this.baseUrl, resourceTypeDto);
  }
  
  update(id: number, resourceTypeDto: UpdateResourceTypeDto): Observable<ResourceType> {
    return this.http.put<ResourceType>(`${this.baseUrl}/${id}`, resourceTypeDto);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addField(typeId: number, fieldDto: CreateFieldDto): Observable<FieldDefinitionDto> {
    return this.http.post<FieldDefinitionDto>(`${this.baseUrl}/${typeId}/fields`, fieldDto);
  }

  removeField(typeId: number, fieldId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${typeId}/fields/${fieldId}`);
  }

  getFieldDefinition(typeId: number, fieldId: number): Observable<FieldDefinitionDto> {
    return this.http.get<FieldDefinitionDto>(`${this.baseUrl}/${typeId}/fields/${fieldId}`);
  }

  updateField(typeId: number, fieldId: number, fieldDto: UpdateFieldDto): Observable<FieldDefinitionDto> {
    return this.http.put<FieldDefinitionDto>(`${this.baseUrl}/${typeId}/fields/${fieldId}`, fieldDto);
  }

  // Update field order within a resource type
  updateFieldsOrder(typeId: number, fieldOrderPayload: { id: number, order: number }[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${typeId}/fields/order`, fieldOrderPayload);
  }
}
