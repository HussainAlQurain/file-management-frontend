import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    HasRoleDirective
  ],
  template: `
    <div class="shell-container h-full flex flex-col">
      <!-- Top toolbar -->
      <mat-toolbar color="primary" class="z-10">
        <button 
          mat-icon-button 
          (click)="sidenav.toggle()" 
          class="mr-2">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="flex-grow">Document Management System</span>
        
        <!-- Loading bar -->
        @if (loadingService.loading()) {
          <div class="loading-bar-container absolute top-0 left-0 right-0">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          </div>
        }
        
        <!-- User menu -->
        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="ml-2">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <span mat-menu-item disabled>
            <span>{{ authService.currentUserSignal()?.username }}</span>
          </span>
          <a mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </a>
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>
      
      <!-- Main content container -->
      <mat-sidenav-container class="flex-grow">
        <!-- Side navigation -->
        <mat-sidenav 
          #sidenav 
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="!(isHandset$ | async)"
          class="w-64">
          <div class="p-4">
            <nav class="flex flex-col">
              <a mat-button class="text-left" routerLink="/dashboard" routerLinkActive="bg-gray-200">
                <mat-icon class="mr-2">dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a mat-button class="text-left" routerLink="/documents" routerLinkActive="bg-gray-200">
                <mat-icon class="mr-2">description</mat-icon>
                <span>Documents</span>
              </a>
                <!-- Admin section -->
              <div *appHasRole="'SYS_ADMIN'" class="mt-4 flex flex-col">
                <div class="text-xs text-gray-500 mb-2 pl-4">Admin</div>
                <a mat-button class="text-left mb-1" routerLink="/resource-types" routerLinkActive="bg-gray-200">
                  <mat-icon class="mr-2">category</mat-icon>
                  <span>Resource Types</span>
                </a>
                <a mat-button class="text-left mb-1" routerLink="/users" routerLinkActive="bg-gray-200">
                  <mat-icon class="mr-2">people</mat-icon>
                  <span>Users</span>
                </a>
              </div>
            </nav>
          </div>
        </mat-sidenav>
        
        <!-- Main content -->
        <mat-sidenav-content class="p-4">
          <!-- Breadcrumbs would go here, will implement separately -->
          
          <main>
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .shell-container {
      display: flex;
      flex-direction: column;
    }
    
    .loading-bar-container {
      z-index: 1000;
    }
    
    mat-sidenav {
      width: 250px;
    }
  `]
})
export class ShellLayoutComponent {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  breakpointObserver = inject(BreakpointObserver);
  
  @ViewChild('sidenav') sidenav: any;
  
  isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
    .pipe(
      map(result => result.matches)
    );
}
