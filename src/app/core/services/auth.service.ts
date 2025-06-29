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
    // Navigate to login page after logout
    this.router.navigate(['/login']);
  }
  
  /**
   * Logout without automatic navigation (for use in interceptors, etc.)
   */
  logoutWithoutRedirect(): void {
    localStorage.removeItem(this.tokenKey);
    this.authSignal.set(null);
    this.currentUserSignal.set(null);
  }
  
  isAuthenticated(): boolean {
    const auth = this.authSignal();
    return auth !== null && !this.isTokenExpired(auth.token);
  }
  
  getToken(): string | null {
    const auth = this.authSignal();
    if (!auth) return null;
    
    // Check if token is expired
    if (this.isTokenExpired(auth.token)) {
      console.warn('Token is expired, logging out...');
      this.logoutWithoutRedirect();
      return null;
    }
    
    return auth.token;
  }
  
  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Treat invalid tokens as expired
    }
  }
  
  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.roles?.includes(role) ?? false;
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
      
      // Check if token is expired before setting it
      if (this.isTokenExpired(auth.token)) {
        console.warn('Stored token is expired, removing...');
        localStorage.removeItem(this.tokenKey);
        return;
      }
      
      this.authSignal.set(auth);

      const payload = jwtDecode<JwtPayload>(auth.token);
      const user: User = {
        username: payload.sub,
        roles: payload.roles?.map(r => r.replace('ROLE_', '')) ?? [],
        id: -1,
        email: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.currentUserSignal.set(user);
    } catch (e) {
      console.error('Error loading token from storage:', e);
      localStorage.removeItem(this.tokenKey);
    }
  }

  
  // Public method to force reload the token (useful for debugging)
  reloadTokenFromStorage(): void {
    this.loadTokenFromStorage();
  }
}
