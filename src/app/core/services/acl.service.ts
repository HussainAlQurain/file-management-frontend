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
  id?: number;
  principalType?: string;
  principalId?: number;
  username?: string;
  permission: string;
}

export interface AclGrantDto {
  action: 'grant' | 'revoke';
  userId: number;
  permission: string; // 'VIEW', 'EDIT', or 'DELETE'
}

@Injectable({
  providedIn: 'root'
})
export class AclService {
  private baseUrl = `${environment.apiBase}/documents`;

  constructor(private http: HttpClient) {}

  getAcls(documentId: number): Observable<AclEntryResponse[]> {
    return this.http.get<AclEntryResponse[]>(`${this.baseUrl}/${documentId}/acl`);
  }

  updateAcl(documentId: number, aclGrant: AclGrantDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/${documentId}/acl`, aclGrant);
  }
  
  // For backward compatibility
  grant(documentId: number, userId: number, permission: string): Observable<any> {
    const aclGrant: AclGrantDto = { action: 'grant', userId, permission };
    return this.updateAcl(documentId, aclGrant);
  }
  
  revoke(documentId: number, userId: number, permission: string): Observable<any> {
    const aclGrant: AclGrantDto = { action: 'revoke', userId, permission };
    return this.updateAcl(documentId, aclGrant);
  }
}
