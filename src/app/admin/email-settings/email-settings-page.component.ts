import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EmailSettings, EmailSettingsService } from '../../core/services/email-settings.service';

@Component({
  selector: 'app-email-settings-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    TranslateModule, 
    NzFormModule, 
    NzInputModule, 
    NzButtonModule, 
    NzCardModule, 
    NzInputNumberModule, 
    NzSwitchModule,
    NzGridModule
  ],
  template: `
    <nz-card>
      <h2>{{ 'admin.email_settings.title' | translate }}</h2>
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>{{ 'admin.email_settings.host' | translate }}</nz-form-label>
              <nz-form-control><input nz-input formControlName="host" /></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>{{ 'admin.email_settings.port' | translate }}</nz-form-label>
              <nz-form-control><nz-input-number formControlName="port" [nzMin]="1" [nzMax]="65535"></nz-input-number></nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>{{ 'admin.email_settings.username' | translate }}</nz-form-label>
              <nz-form-control><input nz-input formControlName="username" /></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>{{ 'admin.email_settings.password' | translate }}</nz-form-label>
              <nz-form-control><input nz-input type="password" formControlName="password" /></nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>{{ 'admin.email_settings.from' | translate }}</nz-form-label>
              <nz-form-control><input nz-input formControlName="fromAddress" /></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.ssl_protocols' | translate }}</nz-form-label>
              <nz-form-control><input nz-input formControlName="sslProtocols" /></nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.smtp_auth' | translate }}</nz-form-label>
              <nz-form-control><nz-switch formControlName="smtpAuth"></nz-switch></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.starttls' | translate }}</nz-form-label>
              <nz-form-control><nz-switch formControlName="startTlsEnable"></nz-switch></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.starttls_required' | translate }}</nz-form-label>
              <nz-form-control><nz-switch formControlName="startTlsRequired"></nz-switch></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.encoding' | translate }}</nz-form-label>
              <nz-form-control><input nz-input formControlName="defaultEncoding" /></nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.conn_timeout' | translate }}</nz-form-label>
              <nz-form-control><nz-input-number formControlName="connectionTimeoutMs" [nzMin]="0"></nz-input-number></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.read_timeout' | translate }}</nz-form-label>
              <nz-form-control><nz-input-number formControlName="readTimeoutMs" [nzMin]="0"></nz-input-number></nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>{{ 'admin.email_settings.write_timeout' | translate }}</nz-form-label>
              <nz-form-control><nz-input-number formControlName="writeTimeoutMs" [nzMin]="0"></nz-input-number></nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div class="actions" style="margin-top: 24px;">
          <button nz-button nzType="primary" [disabled]="form.invalid" (click)="save()" style="margin-right: 8px;">
            {{ 'common.save' | translate }}
          </button>
          <button nz-button nzType="default" [disabled]="form.invalid" (click)="sendTest()">
            {{ 'admin.email_settings.send_test' | translate }}
          </button>
        </div>
      </form>
    </nz-card>
  `
})
export class EmailSettingsPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(EmailSettingsService);
  private message = inject(NzMessageService);

  form = this.fb.group({
    host: ['', Validators.required],
    port: [587, Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    smtpAuth: [true],
    startTlsEnable: [true],
    startTlsRequired: [true],
    sslProtocols: ['TLSv1.2'],
    connectionTimeoutMs: [30000],
    readTimeoutMs: [30000],
    writeTimeoutMs: [30000],
    defaultEncoding: ['UTF-8'],
    fromAddress: ['', Validators.required]
  });

  ngOnInit(): void {
    this.svc.get().subscribe({
      next: (s) => { if (s) this.form.patchValue(s); },
      error: () => {}
    });
  }

  save(): void {
    const settings = this.form.value as unknown as EmailSettings;
    this.svc.upsert(settings).subscribe({
      next: () => this.message.success('Saved'),
      error: () => this.message.error('Failed to save')
    });
  }

  sendTest(): void {
    const to = this.form.value.username || '';
    this.svc.sendTest(to as string, 'Test Email', 'This is a test email.').subscribe({
      next: () => this.message.success('Test email sent'),
      error: () => this.message.error('Failed to send test email')
    });
  }
}
