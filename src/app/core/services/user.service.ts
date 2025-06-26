import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import { Page } from '../models/document.model';
import { toParams } from '../utils/api-utils';
import { map } from 'rxjs/operators';

// Add these interfaces to match backend expectations
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  roleCodes: string[];
  fullName?: string;
}

export interface UpdateUserDTO {
  email?: string;
  roleCodes?: string[];
  username?: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly usersApiUrl = `${environment.apiBase}/users`;
  private readonly profileApiUrl = `${environment.apiBase}/profile`;
  
  list(params: Record<string, any> = {}): Observable<Page<User>> {
    return this.http.get<Page<User>>(this.usersApiUrl, { params: toParams(params) });
  }
  
  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/${id}`);
  }
  
  create(user: CreateUserDTO): Observable<User> {
    return this.http.post<User>(this.usersApiUrl, user);
  }
  
  update(id: number, user: UpdateUserDTO): Observable<User> {
    return this.http.put<User>(`${this.usersApiUrl}/${id}`, user);
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersApiUrl}/${id}`);
  }
  
  resetPassword(id: number): Observable<{resetToken: string}> {
    return this.http.post<{resetToken: string}>(`${this.usersApiUrl}/${id}/reset-password`, {});
  }
  
  // For backward compatibility
  getProfile(): Observable<User> {
    return this.getMyProfile();
  }
  
  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.profileApiUrl}/me`);
  }
  
  // Overloaded method for changePassword
  changePassword(dto: ChangePasswordDTO): Observable<void>;
  changePassword(oldPassword: string, newPassword: string): Observable<void>;
  changePassword(oldPasswordOrDto: string | ChangePasswordDTO, newPassword?: string): Observable<void> {
    if (typeof oldPasswordOrDto === 'string' && newPassword) {
      const dto: ChangePasswordDTO = {
        oldPassword: oldPasswordOrDto,
        newPassword: newPassword,
        confirmPassword: newPassword
      };
      return this.http.post<void>(`${this.profileApiUrl}/password`, dto);
    } else {
      return this.http.post<void>(`${this.profileApiUrl}/password`, oldPasswordOrDto);
    }
  }

  // For SYS_ADMIN: fetch all users (paged, but for dropdown we can fetch first 100)
  getAllUsers(): Observable<UserDTO[]> {
    // Use the new /users/all endpoint that returns a simple array
    return this.http.get<UserDTO[]>(`${this.usersApiUrl}/all`);
  }

  patch(id: number, user: UpdateUserDTO): Observable<User> {
    return this.http.patch<User>(`${this.usersApiUrl}/${id}`, user);
  }
}
