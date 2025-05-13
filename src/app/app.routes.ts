import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { canEditDocGuard, canViewDocGuard } from './core/guards/document.guard';

export const routes: Routes = [
  // Auth routes
  {
    path: 'login',
    loadComponent: () => import('./auth/login-page/login-page.component').then(c => c.LoginPageComponent),
    canActivate: [guestGuard]
  },
  
  // Main application (shell layout)
  {
    path: '',
    loadComponent: () => import('./shell/shell-layout/shell-layout.component').then(c => c.ShellLayoutComponent),
    canActivate: [authGuard],
    children: [      // Dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard-page/dashboard-page.component').then(c => c.DashboardPageComponent)
      },
      
      // Documents - temporarily using NotFoundComponent
      {
        path: 'documents',
        loadChildren: () => [
          { path: '', loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent) }
        ]
      },
      {
        path: 'documents/new',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
      },
      {
        path: 'documents/:id',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [canViewDocGuard]
      },
      {
        path: 'documents/:id/edit',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [canEditDocGuard]
      },
      
      // Resource Types (Admin only) - temporarily using NotFoundComponent
      {
        path: 'resource-types',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [roleGuard('SYS_ADMIN')]
      },
      {
        path: 'resource-types/:id',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [roleGuard('SYS_ADMIN')]
      },
      
      // Users (Admin only) - temporarily using NotFoundComponent
      {
        path: 'users',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [roleGuard('SYS_ADMIN')]
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        canActivate: [roleGuard('SYS_ADMIN')]
      },
      
      // User profile - temporarily using NotFoundComponent
      {
        path: 'profile',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
      }
    ]
  },
  
  // Not found route
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
