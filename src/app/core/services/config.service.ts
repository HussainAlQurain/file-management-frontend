import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private _config: any = null;

  get apiBase(): string {
    // Try to get from runtime config (env.js) first, then fallback to environment
    if (this._config?.apiUrl) {
      return this._config.apiUrl;
    }
    
    // Check window object for env.js config
    const windowEnv = (window as any)['env'];
    if (windowEnv?.apiUrl) {
      return windowEnv.apiUrl;
    }
    
    // Fallback to environment
    return environment.apiBase;
  }

  get appName(): string {
    if (this._config?.appName) {
      return this._config.appName;
    }
    
    const windowEnv = (window as any)['env'];
    if (windowEnv?.appName) {
      return windowEnv.appName;
    }
    
    return environment.appName;
  }

  get isProduction(): boolean {
    return environment.production;
  }

  // Load configuration at runtime
  loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      // Check if env.js is already loaded
      const windowEnv = (window as any)['env'];
      if (windowEnv) {
        this._config = windowEnv;
        console.log('Configuration loaded from env.js:', this._config);
        resolve();
        return;
      }

      // If not loaded, try to load it dynamically
      const script = document.createElement('script');
      script.src = '/env.js';
      script.onload = () => {
        this._config = (window as any)['env'] || {};
        console.log('Configuration loaded dynamically from env.js:', this._config);
        resolve();
      };
      script.onerror = () => {
        console.warn('Could not load env.js, using environment defaults');
        this._config = {};
        resolve();
      };
      document.head.appendChild(script);
    });
  }
}
