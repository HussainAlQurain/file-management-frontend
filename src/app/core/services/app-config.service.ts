import { Injectable } from '@angular/core';

declare global {
  interface Window {
    env: {
      apiUrl: string;
      appName: string;
      version: string;
      maxFileSize: string;
      enableFeatures: any;
      [key: string]: any;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  
  /**
   * Get API base URL from runtime configuration
   * Always reads from window.env (loaded from env.js)
   */
  get apiBase(): string {
    return window?.env?.apiUrl || 'http://localhost:8080/api';
  }
  
  /**
   * Get app name from runtime configuration
   */
  get appName(): string {
    return window?.env?.appName || 'Document Management System';
  }
  
  /**
   * Get app version from runtime configuration
   */
  get version(): string {
    return window?.env?.version || '1.0.0';
  }
  
  /**
   * Get max file size from runtime configuration
   */
  get maxFileSize(): string {
    return window?.env?.maxFileSize || '100MB';
  }
  
  /**
   * Get feature flags from runtime configuration
   */
  get enableFeatures(): any {
    return window?.env?.enableFeatures || {};
  }
  
  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.enableFeatures[featureName] || false;
  }
  
  /**
   * Get any configuration value by key
   */
  getConfig(key: string): any {
    return window?.env?.[key];
  }
  
  /**
   * Debug method to log current configuration
   */
  debugConfig(): void {
    console.log('🔧 Runtime Configuration:', {
      apiBase: this.apiBase,
      appName: this.appName,
      version: this.version,
      maxFileSize: this.maxFileSize,
      enableFeatures: this.enableFeatures,
      fullEnv: window.env
    });
  }
} 