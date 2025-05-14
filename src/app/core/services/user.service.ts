import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/users`;
  
  list(params: Record<string, any> = {}): Observable<Page<User>> {
    return this.http.get<Page<User>>(this.baseUrl, { params: toParams(params) });
  }
  
  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
  
  create(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }
  
  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  
  resetPassword(id: number): Observable<{resetToken: string}> {
    return this.http.post<{resetToken: string}>(`${this.baseUrl}/${id}/reset-password`, {});
  }
  
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`);
  }
  
  updateProfile(profile: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, profile);
  }
  
  /**
   * Change current user's password via /profile/password
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiBase}/profile/password`, { oldPassword, newPassword });
  }
}
