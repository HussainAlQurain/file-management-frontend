import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-debug-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <mat-card class="mt-4 p-4 bg-gray-100">
      <mat-card-header>
        <mat-card-title>Debug Information</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="mt-2">
          <p><strong>Is Authenticated:</strong> {{ authService.isAuthenticated() }}</p>
          <p><strong>Token Available:</strong> {{ !!authService.getToken() }}</p>
          <p><strong>Current User:</strong> {{ authService.currentUserSignal() | json }}</p>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button color="primary" (click)="reloadToken()">Reload Token from Storage</button>
      </mat-card-actions>
    </mat-card>
  `
})
export class DebugInfoComponent {
  authService = inject(AuthService);
  
  reloadToken(): void {
    // Attempt to reload the token from storage (helpful to debug if localStorage is properly set up)
    const authJson = localStorage.getItem('auth_token');
    console.log('Token in localStorage:', authJson);
    
    if (authJson) {
      try {
        const auth = JSON.parse(authJson);
        console.log('Parsed auth object:', auth);
        // Update the auth signal directly for testing
        this.authService.authSignal.set(auth);
        this.authService.currentUserSignal.set(auth.user);
        console.log('Auth signals updated');
      } catch (e) {
        console.error('Error parsing auth token:', e);
      }
    } else {
      console.log('No auth token found in localStorage');
    }
  }
}
