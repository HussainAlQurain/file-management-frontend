import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Document Management System';
  
  private translateService = inject(TranslateService);
  private translationService = inject(TranslationService);
  
  ngOnInit() {
    // Initialize translation service
    this.translateService.setDefaultLang('en');
    this.translateService.use('en');
    
    // Initialize our custom translation service (this will load saved language preference)
    // The service constructor already handles initialization
  }
}
