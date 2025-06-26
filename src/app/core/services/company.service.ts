import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Company, 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CompanyFolderDto,
  UserCompanyResourceTypeAccessDto,
  CreateUserCompanyResourceTypeAccessDto,
  UpdateUserCompanyResourceTypeAccessDto
} from '../models/company.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/companies`;
  
  list(params: Record<string, any> = {}): Observable<Page<Company>> {
    return this.http.get<Page<Company>>(this.baseUrl, { params: toParams(params) });
  }
  
  listAll(): Observable<Company[]> {
    return this.http.get<Company[]>(this.baseUrl);
  }
  
  get(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/${id}`);
  }
  
  create(company: CreateCompanyDto): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, company);
  }
  
  update(id: number, company: UpdateCompanyDto): Observable<Company> {
    return this.http.put<Company>(`${this.baseUrl}/${id}`, company);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  // Company folder structure
  getCompanyFolders(): Observable<CompanyFolderDto[]> {
    return this.http.get<CompanyFolderDto[]>(`${this.baseUrl}/my-folders`);
  }

  getCompanyFolder(companyId: number): Observable<CompanyFolderDto> {
    return this.http.get<CompanyFolderDto>(`${this.baseUrl}/${companyId}/folder`);
  }
  // User access management
  getUserAccess(params: Record<string, any> = {}): Observable<Page<UserCompanyResourceTypeAccessDto>> {
    return this.http.get<Page<UserCompanyResourceTypeAccessDto>>(`${this.baseUrl}/access`, { 
      params: toParams(params) 
    });
  }

  getUserAccessByUser(userId: number): Observable<UserCompanyResourceTypeAccessDto[]> {
    return this.http.get<UserCompanyResourceTypeAccessDto[]>(`${this.baseUrl}/access/user/${userId}`);
  }

  getUserAccessByCompany(companyId: number): Observable<UserCompanyResourceTypeAccessDto[]> {
    return this.http.get<UserCompanyResourceTypeAccessDto[]>(`${this.baseUrl}/access/company/${companyId}`);
  }

  createUserAccess(access: CreateUserCompanyResourceTypeAccessDto): Observable<UserCompanyResourceTypeAccessDto> {
    return this.http.post<UserCompanyResourceTypeAccessDto>(`${this.baseUrl}/access`, access);
  }

  updateUserAccess(id: number, access: UpdateUserCompanyResourceTypeAccessDto): Observable<UserCompanyResourceTypeAccessDto> {
    return this.http.put<UserCompanyResourceTypeAccessDto>(`${this.baseUrl}/access/${id}`, access);
  }

  deleteUserAccess(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/access/${id}`);
  }

  /**
   * Get companies accessible to the current user (for document creation)
   */
  getAccessibleCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/accessible`);
  }
}
