import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { ResourceTypeDuplicationResultDto, ResourceTypeDuplicationRequestDto } from '../models/bulk-import.model';

@Injectable({
  providedIn: 'root'
})
export class ResourceTypeDuplicationService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  private get baseUrl(): string {
    return `${this.configService.apiBase}/resource-types`;
  }

  /**
   * Duplicate a resource type to a single company
   */
  duplicateToCompany(resourceTypeId: number, targetCompanyId: number): Observable<ResourceTypeDuplicationResultDto> {
    return this.http.post<ResourceTypeDuplicationResultDto>(
      `${this.baseUrl}/${resourceTypeId}/duplicate`,
      null,
      { params: { targetCompanyId: targetCompanyId.toString() } }
    );
  }

  /**
   * Duplicate a resource type to multiple companies
   */
    duplicateToMultipleCompanies(
    resourceTypeId: number,
    targetCompanyIds: number[]
  ): Observable<ResourceTypeDuplicationResultDto[]> {
    let params = new HttpParams();
    targetCompanyIds.forEach(id => {
      params = params.append('targetCompanyIds', id.toString());
    });
    
    return this.http.post<ResourceTypeDuplicationResultDto[]>(
      `${this.baseUrl}/${resourceTypeId}/duplicate-multiple`,
      null,
      { params }
    );
  }

  /**
   * Bulk duplicate multiple resource types
   */
  bulkDuplicate(requests: ResourceTypeDuplicationRequestDto[]): Observable<ResourceTypeDuplicationResultDto[]> {
    return this.http.post<ResourceTypeDuplicationResultDto[]>(`${this.baseUrl}/bulk-duplicate`, requests);
  }

  /**
   * Check if a resource type can be duplicated to a company
   */
  canDuplicateToCompany(resourceTypeId: number, targetCompanyId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/${resourceTypeId}/can-duplicate`,
      { params: { targetCompanyId: targetCompanyId.toString() } }
    );
  }

  /**
   * Check if a resource type exists in a company
   */
  resourceTypeExistsInCompany(resourceTypeCode: string, companyId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists`, {
      params: { 
        resourceTypeCode: resourceTypeCode,
        companyId: companyId.toString()
      }
    });
  }
}
