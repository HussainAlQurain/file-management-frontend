import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { ConfigService } from './config.service';
import { ResourceType, CreateResourceTypeDto, UpdateResourceTypeDto, FieldDefinitionDto, CreateFieldDto, UpdateFieldDto } from '../models/resource-type.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';
import { tap, switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResourceTypeService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  private get baseUrl(): string {
    return `${this.configService.apiBase}/resource-types`;
  }
  
  list(params: Record<string, any> = {}): Observable<Page<ResourceType>> {
    return this.http.get<Page<ResourceType>>(this.baseUrl, { params: toParams(params) });
  }
  
  listAllNonPaged(): Observable<ResourceType[]> {
    console.log('Fetching all resource types');
    return this.http.get<ResourceType[]>(`${this.baseUrl}/all`).pipe(
      tap(types => {
        console.log(`Received ${types.length} resource types`);
        // Since the list call might not include fields, we can check
        types.forEach(type => {
          console.log(`Resource type ${type.id}: fields length = ${type.fields?.length || 0}`);
        });
      })
    );
  }

  getAll(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(`${this.baseUrl}`);
  }
  
  /**
   * Get resource types accessible to current user for a specific company
   */
  getAccessibleForCompany(companyId: number): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(`${this.baseUrl}/company/${companyId}/accessible`);
  }
  
  get(id: number): Observable<ResourceType> {
    console.log(`Fetching resource type with ID: ${id}`);
    return this.http.get<ResourceType>(`${this.baseUrl}/${id}`).pipe(
      tap(response => {
        console.log('Resource type response:', response);
        console.log('Fields array length:', response.fields?.length || 0);
      })
    );
  }
  
  // Explicit method to get resource type with fields
  getWithFields(id: number): Observable<ResourceType> {
    console.log(`Fetching resource type with fields, ID: ${id}`);
    // Add a query parameter to explicitly request fields
    return this.http.get<ResourceType>(`${this.baseUrl}/${id}?includeFields=true`).pipe(
      tap(response => {
        console.log('Resource type with fields response:', response);
        console.log('Fields included:', response.fields?.length || 0);
      })
    );
  }
  
  create(resourceTypeDto: CreateResourceTypeDto): Observable<ResourceType> {
    // Extract fields if present in the DTO
    const { fields, ...basicResourceTypeDto } = resourceTypeDto as any;
    
    // First create the resource type
    return this.http.post<ResourceType>(this.baseUrl, basicResourceTypeDto).pipe(
      switchMap(newResourceType => {
        // If no fields, just return the new resource type
        if (!fields || fields.length === 0) {
          return of(newResourceType);
        }
        
        console.log(`Created resource type with ID: ${newResourceType.id}, now adding ${fields.length} fields`);
        
        // For each field, create a sequence of observables
        const addFieldRequests: Observable<any>[] = [];
        
        fields.forEach((field: CreateFieldDto & { options?: string[] }) => {
          // Extract options from field if present (for SELECT fields)
          const { options, ...baseFieldDto } = field;
          
          // Create an observable for adding this field
          const addFieldRequest = this.http.post<FieldDefinitionDto>(`${this.baseUrl}/${newResourceType.id}/fields`, baseFieldDto).pipe(
            switchMap(newField => {
              // If this is a SELECT field with options, add the options
              if (field.kind === 'SELECT' && options && options.length > 0) {
                console.log(`Adding ${options.length} options to field ${newField.id}`);
                
                // Create observables for each option
                const addOptionRequests = options.map((optionValue: string) => 
                  this.http.post<any>(`${this.baseUrl}/${newResourceType.id}/fields/${newField.id}/options`, { value: optionValue })
                );
                
                // Return field after all options are added
                return forkJoin(addOptionRequests).pipe(
                  map(() => newField)
                );
              }
              
              // For non-SELECT fields, just return the field
              return of(newField);
            })
          );
          
          addFieldRequests.push(addFieldRequest);
        });
        
        // After all fields are created, fetch the complete resource type
        return forkJoin(addFieldRequests).pipe(
          switchMap(() => this.getWithFields(newResourceType.id)),
          catchError(error => {
            console.error('Error adding fields to resource type:', error);
            // Even if adding fields fails, return the created resource type
            return of(newResourceType);
          })
        );
      })
    );
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
