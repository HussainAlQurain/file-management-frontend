import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Auth, LoginRequest, User } from '../models/auth.model';
import { jwtDecode } from "jwt-decode";

interface JwtPayload { 
  sub: string; 
  roles: string[]; 
  exp: number; 
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Signal based state for auth
  readonly authSignal = signal<Auth | null>(null);
  readonly currentUserSignal = signal<User | null>(null);
  readonly loadingSignal = signal<boolean>(false);
  
  private readonly tokenKey = 'auth_token';
  private readonly baseUrl = `${environment.apiBase}/auth`;
  
  constructor() {
    this.loadTokenFromStorage();
  }
  
  login(credentials: LoginRequest): Observable<Auth> {
    this.loadingSignal.set(true);
    
    return this.http.post<Auth>(`${this.baseUrl}/login`, credentials).pipe(
      tap(auth => {
        this.setSession(auth);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
      tap(() => this.loadingSignal.set(false))
    );
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.authSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
  
  isAuthenticated(): boolean {
    return !!this.authSignal();
  }
  
  getToken(): string | null {
    return this.authSignal()?.token ?? null;
  }
    hasRole(role: string): boolean {
    const userRoles = this.currentUserSignal()?.roles ?? [];
    return userRoles.includes(role);
  }
  
  requireRole(role: string): boolean {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (!this.hasRole(role)) {
      this.router.navigate(['/']);
      return false;
    }
    
    return true;
  }
  
private setSession(auth: Auth): void {
  localStorage.setItem(this.tokenKey, JSON.stringify(auth));
  this.authSignal.set(auth);

  const payload = jwtDecode<JwtPayload>(auth.token);
  const user: User = {
      username: payload.sub,
      roles:    payload.roles.map(r => r.replace('ROLE_', '')),  // strip prefix for UI
      id:       1, // Provide a default or meaningful value
      email:    '', // Provide a default or meaningful value
      createdAt: new Date().toISOString(), // Example value
      updatedAt: new Date().toISOString()  // Example value
  };
  this.currentUserSignal.set(user);
}
    private loadTokenFromStorage(): void {
  const authJson = localStorage.getItem(this.tokenKey);
  if (!authJson) return;

  try {
    const auth: Auth = JSON.parse(authJson);
    this.authSignal.set(auth);

    const payload = jwtDecode<JwtPayload>(auth.token);
    const user: User = {
      username: payload.sub,
      roles: payload.roles?.map(r => r.replace('ROLE_', '')) ?? [],
      id: -1, // Provide a default or meaningful value
      email: '', // Provide a default or meaningful value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.currentUserSignal.set(user);
  } catch (e) {
    localStorage.removeItem(this.tokenKey);
  }
}

  
  // Public method to force reload the token (useful for debugging)
  reloadTokenFromStorage(): void {
    this.loadTokenFromStorage();
  }
}
