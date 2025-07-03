import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// NG-ZORRO imports
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzAvatarModule,
    NzDropDownModule,
    NzBreadCrumbModule,
    NzSpinModule,
    NzBadgeModule,
    NzButtonModule,
    NzDividerModule,
    HasRoleDirective,
    LanguageSwitcherComponent
  ],
  template: `
    <nz-layout class="app-layout">
      <!-- Sider -->
      <nz-sider 
        class="menu-sidebar"
        nzCollapsible
        nzBreakpoint="lg"
        [nzCollapsed]="isCollapsed"
        (nzCollapsedChange)="isCollapsed = $event"
        [nzTrigger]="null">
        
        <div class="sidebar-logo">
          <a routerLink="/dashboard">
            <span nz-icon nzType="file-text" nzTheme="outline" class="logo-icon"></span>
            <h1 *ngIf="!isCollapsed" i18n="@@app.title">DMS</h1>
          </a>
        </div>
        
        <ul nz-menu nzMode="inline" [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item nzMatchRouter routerLink="/dashboard">
            <span nz-icon nzType="dashboard" nzTheme="outline"></span>
            <span i18n="@@nav.dashboard">Dashboard</span>
          </li>
          
          <li nz-menu-item nzMatchRouter routerLink="/documents">
            <span nz-icon nzType="file-text" nzTheme="outline"></span>
            <span i18n="@@nav.documents">Documents</span>
          </li>
          
          <li nz-menu-item nzMatchRouter routerLink="/documents/browse">
            <span nz-icon nzType="apartment" nzTheme="outline"></span>
            <span i18n="@@nav.browse.company">Browse by Company</span>
          </li>
          
          <!-- Admin Section -->
          <ng-container *appHasRole="'SYS_ADMIN'">
            <li nz-menu-divider></li>
            <li nz-submenu nzIcon="setting" [nzTitle]="adminTitle">
              <ul>
                <li nz-menu-item nzMatchRouter routerLink="/companies">
                  <span nz-icon nzType="bank" nzTheme="outline"></span>
                  <span i18n="@@nav.admin.companies">Companies</span>
                </li>
                <li nz-menu-item nzMatchRouter routerLink="/resource-types">
                  <span nz-icon nzType="folder" nzTheme="outline"></span>
                  <span i18n="@@nav.admin.resource-types">Resource Types</span>
                </li>
                <li nz-menu-item nzMatchRouter routerLink="/users">
                  <span nz-icon nzType="team" nzTheme="outline"></span>
                  <span i18n="@@nav.admin.users">Users</span>
                </li>
              </ul>
            </li>
          </ng-container>
        </ul>
      </nz-sider>
      
      <nz-layout>
        <!-- Header -->
        <nz-header>
          <div class="app-header">
            <span class="header-trigger" (click)="isCollapsed = !isCollapsed">
              <span nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" nzTheme="outline"></span>
            </span>
            
            <div class="header-title">
              <h2 i18n="@@app.header.title">Document Management System</h2>
            </div>
            
            <div class="header-actions">
              <!-- Loading indicator -->
              <div *ngIf="loadingService.loading()" class="loading-indicator">
                <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
              </div>
              
              <!-- Language Switcher -->
              <app-language-switcher></app-language-switcher>
              
              <!-- User dropdown -->
              <div nz-dropdown [nzDropdownMenu]="userMenu" nzTrigger="click" class="user-dropdown">
                  <nz-avatar 
                    [nzText]="getUserInitial()" 
                    nzSize="default"
                    style="background-color: #1890ff;">
                  </nz-avatar>
                  <span class="username">{{ authService.currentUserSignal()?.username }}</span>
                  <span nz-icon nzType="down" nzTheme="outline"></span>
              </div>
                
              <nz-dropdown-menu #userMenu="nzDropdownMenu">
                <ul nz-menu nzSelectable>
                  <li nz-menu-item disabled>
                    <div class="user-info">
                      <div class="user-name">{{ authService.currentUserSignal()?.username }}</div>
                      <div class="user-email">{{ authService.currentUserSignal()?.email }}</div>
                      <div class="user-role">
                        <nz-badge 
                          [nzStatus]="'success'" 
                          [nzText]="getUserRole()">
                        </nz-badge>
                      </div>
                    </div>
                  </li>
                  <li nz-menu-divider></li>
                  <li nz-menu-item routerLink="/profile">
                    <span nz-icon nzType="user" nzTheme="outline"></span>
                    <span i18n="@@user.menu.profile">My Profile</span>
                  </li>
                  <li nz-menu-item routerLink="/profile/change-password">
                    <span nz-icon nzType="lock" nzTheme="outline"></span>
                    <span i18n="@@user.menu.change-password">Change Password</span>
                  </li>
                  <li nz-menu-divider></li>
                  <li nz-menu-item (click)="logout()">
                    <span nz-icon nzType="logout" nzTheme="outline"></span>
                    <span i18n="@@user.menu.logout">Logout</span>
                  </li>
                </ul>
              </nz-dropdown-menu>
            </div>
          </div>
        </nz-header>
        
        <!-- Content -->
        <nz-content>
          <div class="inner-content">
            <router-outlet></router-outlet>
          </div>
        </nz-content>
        
        <!-- Footer -->
        <nz-footer>
          <div class="footer-content">
            <span i18n="@@footer.copyright">Document Management System © 2025</span>
            <span class="version" i18n="@@footer.version">v1.0.0</span>
          </div>
        </nz-footer>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    :host {
      display: flex;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .app-layout {
      height: 100%;
    }

    .menu-sidebar {
      position: relative;
      z-index: 10;
      min-height: 100%;
      box-shadow: 2px 0 8px rgba(0,0,0,0.03);
    }

    .sidebar-logo {
      position: relative;
      height: 64px;
      padding-left: 24px;
      overflow: hidden;
      line-height: 64px;
      background: #001529;
      transition: all .3s;
    }

    .sidebar-logo a {
      display: flex;
      align-items: center;
      height: 100%;
      color: #fff;
      text-decoration: none;
    }

    .sidebar-logo .logo-icon {
      font-size: 28px;
      margin-right: 12px;
    }

    .sidebar-logo h1 {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      font-size: 18px;
      vertical-align: middle;
    }

    .app-header {
      display: flex;
      align-items: center;
      padding: 0 24px;
      height: 64px;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,21,41,0.08);
      position: relative;
      z-index: 1;
    }

    .header-trigger {
      font-size: 20px;
      cursor: pointer;
      transition: color 0.3s;
      padding: 0 24px 0 0;
    }

    .header-trigger:hover {
      color: #1890ff;
    }

    .header-title {
      flex: 1;
    }

    .header-title h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
    }

    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .user-dropdown:hover {
      background-color: rgba(0, 0, 0, 0.025);
    }

    .username {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-info {
      padding: 8px 0;
    }

    .user-name {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }

    .user-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin: 4px 0;
    }

    .user-role {
      margin-top: 8px;
    }

    nz-header {
      padding: 0;
      width: 100%;
      z-index: 2;
    }

    nz-content {
      margin: 24px;
      min-height: 280px;
    }

    .inner-content {
      background: transparent;
      min-height: calc(100vh - 64px - 24px - 24px - 64px);
    }

    nz-footer {
      text-align: center;
      background: #f0f2f5;
      padding: 16px 50px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      color: rgba(0, 0, 0, 0.45);
      font-size: 14px;
    }

    .version {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.25);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-title h2 {
        font-size: 16px;
      }
      
      .username {
        display: none;
      }
      
      nz-content {
        margin: 16px;
      }
    }

    /* Custom scrollbar for the sidebar */
    ::ng-deep .ant-layout-sider-children::-webkit-scrollbar {
      width: 6px;
    }

    ::ng-deep .ant-layout-sider-children::-webkit-scrollbar-track {
      background: #001529;
    }

    ::ng-deep .ant-layout-sider-children::-webkit-scrollbar-thumb {
      background: #1890ff;
      border-radius: 3px;
    }

    ::ng-deep .ant-menu-dark .ant-menu-inline.ant-menu-sub {
      background: #000c17;
    }
  `]
})
export class ShellLayoutComponent {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  
  isCollapsed = false;
  
  // i18n strings
  adminTitle = $localize`:@@nav.admin.title:Admin`;
  
  getUserInitial(): string {
    const user = this.authService.currentUserSignal();
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  }
  
  getUserRole(): string {
    const user = this.authService.currentUserSignal();
    if (user?.roles?.includes('SYS_ADMIN')) {
      return $localize`:@@user.role.admin:System Admin`;
    }
    return $localize`:@@user.role.user:User`;
  }
  
  logout(): void {
    this.authService.logout();
  }
}
