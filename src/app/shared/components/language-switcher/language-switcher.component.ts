import { Component, LOCALE_ID, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    NzSelectModule,
    NzIconModule,
    FormsModule
  ],
  template: `
    <nz-select 
      [ngModel]="currentLanguage"
      (ngModelChange)="onLanguageChange($event)"
      [nzSize]="'default'"
      style="width: 120px;">
      
      <nz-option 
        *ngFor="let lang of languages" 
        [nzValue]="lang.code"
        [nzLabel]="lang.nativeName">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ lang.flag }}</span>
          <span>{{ lang.nativeName }}</span>
        </div>
      </nz-option>
    </nz-select>
  `,
  styles: [`
    ::ng-deep .ant-select-selection-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class LanguageSwitcherComponent {
  languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      dir: 'ltr'
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl'
    }
  ];

  currentLanguage: string;

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.currentLanguage = this.locale;
  }

  onLanguageChange(langCode: string): void {
    const selectedLang = this.languages.find(lang => lang.code === langCode);
    if (!selectedLang) return;

    // Set document direction and lang attribute
    this.document.documentElement.dir = selectedLang.dir;
    this.document.documentElement.lang = langCode;
    
    // For production apps, you would navigate to the localized version
    // For now, we'll reload the page to apply the new locale
    const baseHref = langCode === 'en' ? '/' : `/${langCode}/`;
    
    // In a real implementation, you would have different routes for each language
    // For development, we can show a message about language switching
    console.log(`Language changed to: ${selectedLang.name} (${selectedLang.nativeName})`);
    console.log(`Direction: ${selectedLang.dir}`);
    console.log(`Base href would be: ${baseHref}`);
    
    // For now, just update the document attributes
    // In production, you would redirect to the appropriate language URL
    this.currentLanguage = langCode;
  }
} 