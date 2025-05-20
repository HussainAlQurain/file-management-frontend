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
      
      // Documents
      {
        path: 'documents',
        children: [
          { path: '', loadComponent: () => import('./documents/document-list-page/document-list-page.component').then(c => c.DocumentListPageComponent) },
          { path: 'new', loadComponent: () => import('./documents/document-create-page/document-create-page.component').then(c => c.DocumentCreatePageComponent) },
          { path: ':id', loadComponent: () => import('./documents/document-detail-page/document-detail-page.component').then(c => c.DocumentDetailPageComponent), canActivate: [canViewDocGuard] },
          { path: ':id/edit', loadComponent: () => import('./documents/document-edit-page/document-edit-page.component').then(c => c.DocumentEditPageComponent), canActivate: [canEditDocGuard] },
          { path: ':id/acl', loadComponent: () => import('./documents/document-acl-page/document-acl-page.component').then(c => c.DocumentAclPageComponent), canActivate: [canEditDocGuard] },
          { path: ':id/history', loadComponent: () => import('./documents/document-versions-page/document-versions-page.component').then(c => c.DocumentVersionsPageComponent), canActivate: [canViewDocGuard] },
          { path: ':id/view', loadComponent: () => import('./documents/document-viewer-page/document-viewer-page.component').then(c => c.DocumentViewerPageComponent), canActivate: [canViewDocGuard] },
          { path: ':id/versions/:version/view', loadComponent: () => import('./documents/document-viewer-page/document-viewer-page.component').then(c => c.DocumentViewerPageComponent), canActivate: [canViewDocGuard] }
        ]
      },
      
      // Resource Types (Admin only)
      {
        path: 'resource-types',
        children: [
          { path: '', loadComponent: () => import('./admin/resource-types/resource-type-list-page/resource-type-list-page.component').then(c => c.ResourceTypeListPageComponent), canActivate: [roleGuard('SYS_ADMIN')] },
          { path: 'new', loadComponent: () => import('./admin/resource-types/resource-type-create-page/resource-type-create-page.component').then(c => c.ResourceTypeCreatePageComponent), canActivate: [roleGuard('SYS_ADMIN')] },
          { path: ':id', loadComponent: () => import('./admin/resource-types/resource-type-edit-page/resource-type-edit-page.component').then(c => c.ResourceTypeEditPageComponent), canActivate: [roleGuard('SYS_ADMIN')] }
        ]
      },
      
      // Users (Admin only)
      {
        path: 'users',
        children: [
          { path: '', loadComponent: () => import('./admin/users/user-list-page/user-list-page.component').then(c => c.UserListPageComponent), canActivate: [roleGuard('SYS_ADMIN')] },
          { path: 'new', loadComponent: () => import('./admin/users/user-create-page/user-create-page.component').then(c => c.UserCreatePageComponent), canActivate: [roleGuard('SYS_ADMIN')] },
          { path: ':id', loadComponent: () => import('./admin/users/user-edit-page/user-edit-page.component').then(c => c.UserEditPageComponent), canActivate: [roleGuard('SYS_ADMIN')] }
        ]
      },
      
      // User profile
      {
        path: 'profile',
        children: [
          { path: '', redirectTo: 'me', pathMatch: 'full' },
          { path: 'me', loadComponent: () => import('./core/components/profile/my-profile.component').then(c => c.MyProfileComponent) },
          { path: 'change-password', loadComponent: () => import('./core/components/profile/change-password.component').then(c => c.ChangeMyPasswordComponent) }
        ]
      }
    ]
  },
  
  // Not found route
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
