import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">My Profile</h2>
        <button mat-stroked-button color="primary" routerLink="/profile/change-password">
          Change Password
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center h-64">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (user()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ user()?.fullName || user()?.username }}</mat-card-title>
            <mat-card-subtitle>{{ user()?.email }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Username:</strong> {{ user()?.username }}</p>
            <p><strong>Roles:</strong> {{ user()?.roles?.join(', ') }}</p>
            <p><strong>Joined:</strong> {{ user()?.createdAt | date:'medium' }}</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <p class="text-red-500">Could not load profile information.</p>
      }
    </div>
  `
})
export class MyProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);

  // Use the signal from AuthService for the current user, but fetch fresh data
  user = signal<User | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);
    // Fetch the full profile from the dedicated endpoint
    this.userService.getProfile().subscribe({
      next: (profileData) => {
        this.user.set(profileData);
        // Optionally update the authService's currentUserSignal if it makes sense for your app
        // this.authService.currentUserSignal.set(profileData); 
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error('Failed to load profile. ' + (err.error?.message || ''));
        // Fallback to user data from token if API fails, though it might be stale/incomplete
        if (this.authService.currentUserSignal()) {
          this.user.set(this.authService.currentUserSignal());
        }
      }
    });
  }
}
