import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { TranslationService, Language } from '../../../core/services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    NzSelectModule,
    NzIconModule,
    FormsModule,
    TranslateModule
  ],
  template: `
    <nz-select 
      [ngModel]="currentLanguage()"
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
  private translationService = inject(TranslationService);

  // Get languages from the translation service
  languages = this.translationService.languages;
  
  // Get current language as a signal
  currentLanguage = signal<string>(this.translationService.getCurrentLanguage());

  constructor() {
    // Subscribe to language changes to update the current language signal
    this.translationService.languageChange$.subscribe(language => {
      this.currentLanguage.set(language.code);
    });
  }

  onLanguageChange(langCode: string): void {
    this.translationService.setLanguage(langCode);
  }
} 