import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 class="text-6xl font-bold text-gray-800">404</h1>
      <h2 class="mt-4 text-2xl font-semibold text-gray-600">Page Not Found</h2>
      <p class="mt-2 text-gray-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button mat-raised-button color="primary" [routerLink]="['/']" class="mt-8">
        Return to Dashboard
      </button>
    </div>
  `
})
export class NotFoundComponent {}
