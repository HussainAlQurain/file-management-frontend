import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AclRequest {
  action: 'grant' | 'revoke';
  userId: number;
  permission: string;
}

export interface AclEntryResponse {
  id?: number; // This might not be provided by all backend GET /acl responses
  principalType: string; // e.g., 'USER', 'GROUP'
  principalId: number;
  principalName?: string; // Display name, helpful if backend provides it
  permission: string;
}

@Injectable({
  providedIn: 'root'
})
export class AclService {
  private baseUrl = `${environment.apiBase}/documents`;

  constructor(private http: HttpClient) {}

  getAcls(documentId: number): Observable<AclEntryResponse[]> {
    const url = `${this.baseUrl}/${documentId}/acl`;
    return this.http.get<AclEntryResponse[]>(url);
  }

  grant(documentId: number, userId: number, permission: string): Observable<any> {
    const url = `${this.baseUrl}/${documentId}/acl`;
    const body: AclRequest = { action: 'grant', userId, permission };
    return this.http.post(url, body);
  }

  revoke(documentId: number, userId: number, permission: string): Observable<any> {
    const url = `${this.baseUrl}/${documentId}/acl`;
    const body: AclRequest = { action: 'revoke', userId, permission };
    return this.http.post(url, body);
  }
}
