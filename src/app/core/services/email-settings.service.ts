import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface EmailSettings {
  id?: number;
  host: string;
  port: number;
  username: string;
  password: string;
  smtpAuth: boolean;
  startTlsEnable: boolean;
  startTlsRequired: boolean;
  sslProtocols: string;
  connectionTimeoutMs: number;
  readTimeoutMs: number;
  writeTimeoutMs: number;
  defaultEncoding: string;
  fromAddress: string;
}

@Injectable({ providedIn: 'root' })
export class EmailSettingsService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private get api(): string {
    return `${this.config.apiBase}/email-settings`;
  }

  get(): Observable<EmailSettings> {
    return this.http.get<EmailSettings>(this.api);
  }

  upsert(settings: EmailSettings): Observable<EmailSettings> {
    return this.http.put<EmailSettings>(this.api, settings);
  }

  sendTest(to: string, subject: string, body: string): Observable<void> {
    const params = { to, subject, body } as any;
    return this.http.post<void>(`${this.api}/test`, null, { params });
  }
}
