import { Injectable, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// NG-ZORRO i18n
import { NzI18nService, en_US, ar_EG } from 'ng-zorro-antd/i18n';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  nzLocale: any;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translateService = inject(TranslateService);
  private nzI18nService = inject(NzI18nService);
  private document = inject(DOCUMENT);

  // Available languages
  readonly languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      dir: 'ltr',
      nzLocale: en_US
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl',
      nzLocale: ar_EG
    }
  ];

  // Current language signal
  currentLanguage = signal<Language>(this.languages[0]);
  
  // BehaviorSubject for components that need to react to language changes
  languageChange$ = new BehaviorSubject<Language>(this.languages[0]);

  constructor() {
    // Set default language
    this.translateService.setDefaultLang('en');
    
    // Load saved language preference or default to 'en'
    const savedLang = localStorage.getItem('preferred-language') || 'en';
    
    // Initialize with default language first
    this.translateService.use('en').subscribe({
      next: () => {
        console.log('Default language (en) loaded successfully');
        // Then set the preferred language if different
        if (savedLang !== 'en') {
          this.setLanguage(savedLang);
        }
      },
      error: (error) => {
        console.error('Error loading default language:', error);
      }
    });

    // Effect to update document properties when language changes
    effect(() => {
      const currentLang = this.currentLanguage();
      this.updateDocumentProperties(currentLang);
    });
  }

  /**
   * Set the application language
   */
  setLanguage(langCode: string): void {
    const language = this.languages.find(lang => lang.code === langCode);
    if (!language) {
      console.warn(`Language '${langCode}' not found, falling back to English`);
      return;
    }

    // Update Angular translate service
    this.translateService.use(langCode).subscribe({
      next: () => {
        console.log(`Language changed to: ${language.name} (${language.nativeName})`);
        
        // Update ng-zorro locale
        this.nzI18nService.setLocale(language.nzLocale);
        
        // Update current language signal
        this.currentLanguage.set(language);
        
        // Emit language change
        this.languageChange$.next(language);
        
        // Save preference
        localStorage.setItem('preferred-language', langCode);
      },
      error: (error) => {
        console.error(`Error loading language ${langCode}:`, error);
      }
    });
  }

  /**
   * Get the current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguage().code;
  }

  /**
   * Get the current language object
   */
  getCurrentLanguageObj(): Language {
    return this.currentLanguage();
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.currentLanguage().dir === 'rtl';
  }

  /**
   * Get translation for a specific key
   */
  getTranslation(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Update document element properties based on language
   */
  private updateDocumentProperties(language: Language): void {
    // Set document direction
    this.document.documentElement.dir = language.dir;
    
    // Set document language
    this.document.documentElement.lang = language.code;
    
    // Update document title if needed
    const title = this.getTranslation('app.title');
    if (title && title !== 'app.title') {
      this.document.title = title;
    }
    
    // Add/remove RTL class for styling
    if (language.dir === 'rtl') {
      this.document.body.classList.add('rtl');
      this.document.body.classList.remove('ltr');
    } else {
      this.document.body.classList.add('ltr');
      this.document.body.classList.remove('rtl');
    }
  }
}
