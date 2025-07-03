import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import ar from '@angular/common/locales/ar';

// NG-ZORRO imports
import { NZ_I18N, en_US, ar_EG } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { MatDatepickerModule } from '@angular/material/datepicker';

// Register locales
registerLocaleData(en);
registerLocaleData(ar);

// Get current locale from the HTML lang attribute or default to 'en'
const locale = document.documentElement.lang || 'en';

// Choose ng-zorro locale based on current locale
const getNzLocale = () => {
  switch (locale) {
    case 'ar':
      return ar_EG;
    default:
      return en_US;
  }
};

// Register all icons (in production, you should only import the icons you need)
const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};
const icons: IconDefinition[] = Object.keys(antDesignIcons).map(key => antDesignIcons[key]);

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js change detection
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router with component input binding enabled
    provideRouter(routes, withComponentInputBinding()),
    
    // HTTP client with interceptors
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    
    // Animations for Material
    provideAnimations(),
    
    // Locale configuration
    { provide: LOCALE_ID, useValue: locale },
    
    // NG-ZORRO providers
    { provide: NZ_I18N, useValue: getNzLocale() },
    { provide: NZ_ICONS, useValue: icons },
    importProvidersFrom(FormsModule, NzModalModule, NzMessageModule)
  ]
};
