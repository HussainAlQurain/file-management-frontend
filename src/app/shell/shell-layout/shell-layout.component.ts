import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    TranslateModule,
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
            <h1 *ngIf="!isCollapsed">{{ 'app.title' | translate }}</h1>
          </a>
        </div>
        
        <ul nz-menu nzMode="inline" [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item nzMatchRouter routerLink="/dashboard">
            <span nz-icon nzType="dashboard" nzTheme="outline"></span>
            <span>{{ 'nav.dashboard' | translate }}</span>
          </li>
          
          <li nz-menu-item nzMatchRouter routerLink="/documents">
            <span nz-icon nzType="file-text" nzTheme="outline"></span>
            <span>{{ 'nav.documents' | translate }}</span>
          </li>
          
          <li nz-menu-item nzMatchRouter routerLink="/documents/browse">
            <span nz-icon nzType="apartment" nzTheme="outline"></span>
            <span>{{ 'nav.browse.company' | translate }}</span>
          </li>
          
          <!-- Admin Section -->
          <ng-container *appHasRole="'SYS_ADMIN'">
            <li nz-menu-divider></li>
                        <li nz-submenu [nzTitle]="'nav.admin.title' | translate" nzIcon="setting">
              <ul>
                <li nz-menu-item nzMatchRouter routerLink="/companies">
                  <span nz-icon nzType="bank" nzTheme="outline"></span>
                  <span>{{ 'nav.admin.companies' | translate }}</span>
                </li>
                <li nz-menu-item nzMatchRouter routerLink="/resource-types">
                  <span nz-icon nzType="folder" nzTheme="outline"></span>
                  <span>{{ 'nav.admin.resource_types' | translate }}</span>
                </li>
                <li nz-menu-item nzMatchRouter routerLink="/users">
                  <span nz-icon nzType="team" nzTheme="outline"></span>
                  <span>{{ 'nav.admin.users' | translate }}</span>
                </li>
                <li nz-menu-item nzMatchRouter routerLink="/email-settings">
                  <span nz-icon nzType="mail" nzTheme="outline"></span>
                  <span>{{ 'nav.admin.email_settings' | translate }}</span>
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
              <h2>{{ 'app.header.title' | translate }}</h2>
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
                    <span>{{ 'user.menu.profile' | translate }}</span>
                  </li>
                  <li nz-menu-item routerLink="/profile/change-password">
                    <span nz-icon nzType="lock" nzTheme="outline"></span>
                    <span>{{ 'user.menu.change_password' | translate }}</span>
                  </li>
                  <li nz-menu-divider></li>
                  <li nz-menu-item (click)="logout()">
                    <span nz-icon nzType="logout" nzTheme="outline"></span>
                    <span>{{ 'user.menu.logout' | translate }}</span>
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
            <span>{{ 'footer.copyright' | translate }}</span>
            <span class="version">{{ 'footer.version' | translate }}</span>
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
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .app-layout {
      height: 100%;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .app-layout.rtl {
      direction: rtl;
    }

    .app-layout.rtl .menu-sidebar {
      order: 2;
    }

    .app-layout.rtl .ant-layout {
      order: 1;
    }

    /* RTL specific styles */
    .app-layout.rtl .sidebar-logo {
      padding-left: 0;
      padding-right: 24px;
    }

    .app-layout.rtl .sidebar-logo .logo-icon {
      margin-right: 0;
      margin-left: 12px;
    }

    .app-layout.rtl .header-title {
      text-align: center;
    }

    .app-layout.rtl .header-title h2 {
      direction: rtl;
    }

    .menu-sidebar {
      position: relative;
      z-index: 10;
      min-height: 100%;
      box-shadow: 2px 0 8px rgba(0,0,0,0.03);
      width: 200px;
      max-width: 200px;
      min-width: 200px;
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
      font-size: 16px;
      vertical-align: middle;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      flex-shrink: 0;
    }

    .header-trigger:hover {
      color: #1890ff;
    }

    .header-title {
      flex: 1;
      text-align: center;
      min-width: 0;
      padding: 0 16px;
    }

    .header-title h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
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
      overflow-x: hidden;
      width: calc(100% - 48px);
      max-width: calc(100% - 48px);
      box-sizing: border-box;
    }

    .inner-content {
      background: transparent;
      min-height: calc(100vh - 64px - 24px - 24px - 64px);
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
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
  translateService = inject(TranslateService);
  translationService = inject(TranslationService);
  router = inject(Router);
  
  isCollapsed = false;
  
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
      return this.translateService.instant('user.role.admin');
    }
    return this.translateService.instant('user.role.user');
  }
  
  logout(): void {
    this.authService.logout();
  }
}
