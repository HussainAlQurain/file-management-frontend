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
  
  private translationService = inject(TranslationService);
  
  ngOnInit() {
    // The TranslationService constructor already handles all initialization
    // including setting default language and loading saved preferences
    console.log('App component initialized');
  }
}
