import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// NG-ZORRO imports
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

import { ResourceTypeService } from '../../core/services/resource-type.service';
import { CompanyService } from '../../core/services/company.service';
import { DocumentService } from '../../core/services/document.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { TranslationService } from '../../core/services/translation.service';
import { ResourceType, FieldDefinitionDto, FieldType } from '../../core/models/resource-type.model';
import { Company } from '../../core/models/company.model';
import { Document, CreateDocumentDto } from '../../core/models/document.model';

@Component({
  selector: 'app-document-create-page',
  standalone: true,  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzStepsModule,
    NzCardModule,
    NzSpinModule,
    NzIconModule,
    NzUploadModule,
    NzAlertModule,
    NzDividerModule,
    NzCheckboxModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzAutocompleteModule,
    NzTagModule,
    NzSpaceModule,
    NzTypographyModule,
    NzEmptyModule,
    NzPageHeaderModule
  ],
  template: `
    <div class="create-document-container" [attr.dir]="translationService.isRTL() ? 'rtl' : 'ltr'">
      <!-- Page Header -->
      <div class="page-header-wrapper">
        <div class="page-header-content">
          <div class="header-top">
            <div class="header-title-section">
              <h1 class="page-title">{{ 'documents.create.title' | translate }}</h1>
              <p class="page-subtitle">{{ 'documents.create.subtitle' | translate }}</p>
            </div>
            <div class="header-actions">
              <button nz-button nzType="default" (click)="navigateBack()" class="action-button secondary">
                <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
                <span>{{ 'common.back' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <nz-card>
        <nz-steps [nzCurrent]="currentStep" nzSize="small">
          <nz-step [nzTitle]="'documents.create.steps.company' | translate"></nz-step>
          <nz-step [nzTitle]="'documents.create.steps.type' | translate"></nz-step>
          <nz-step [nzTitle]="'documents.create.steps.details' | translate"></nz-step>
          <nz-step [nzTitle]="'documents.create.steps.upload' | translate"></nz-step>
        </nz-steps>
        
        <div class="steps-content">
        <!-- Step 1: Select Company -->
          <div *ngIf="currentStep === 0" class="step-container">
            <form nz-form [formGroup]="companyForm" nzLayout="vertical">
              <h3 nz-typography>{{ 'documents.create.step1.title' | translate }}</h3>
              <p nz-typography nzType="secondary">{{ 'documents.create.step1.description' | translate }}</p>
              
              <nz-form-item>
                <nz-form-label nzRequired>{{ 'documents.create.step1.company' | translate }}</nz-form-label>
                <nz-form-control [nzErrorTip]="'documents.create.step1.company_required' | translate">
                  <nz-select 
                    formControlName="companyId" 
                    nzShowSearch
                    [nzPlaceHolder]="'documents.create.step1.company_placeholder' | translate"
                    nzSize="large"
                    (ngModelChange)="onCompanyChange($event)">
                    <nz-option 
                      *ngFor="let company of companies()" 
                      [nzValue]="company.id" 
                      [nzLabel]="company.name">
                      <span>{{ company.name }}</span>
                      <span *ngIf="company.description" class="option-desc">{{ company.description }}</span>
                    </nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </form>
            </div>

        <!-- Step 2: Select Resource Type -->
          <div *ngIf="currentStep === 1" class="step-container">
            <form nz-form [formGroup]="resourceTypeForm" nzLayout="vertical">
              <h3 nz-typography>{{ 'documents.create.step2.title' | translate }}</h3>
              <p nz-typography nzType="secondary">{{ 'documents.create.step2.description' | translate }}</p>
              
              <nz-spin *ngIf="loadingResourceTypes" [nzTip]="'documents.create.step2.loading' | translate">
                <div style="height: 200px;"></div>
              </nz-spin>
              
              <div *ngIf="!loadingResourceTypes">
                <nz-form-item>
                  <nz-form-label nzRequired>{{ 'documents.create.step2.type' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'documents.create.step2.type_required' | translate">
                    <nz-select 
                      formControlName="resourceTypeId" 
                      nzShowSearch
                      [nzPlaceHolder]="'documents.create.step2.type_placeholder' | translate"
                      nzSize="large"
                      (ngModelChange)="onResourceTypeChange($event)">
                      <nz-option 
                        *ngFor="let rt of resourceTypes()" 
                        [nzValue]="rt.id" 
                        [nzLabel]="rt.name">
                        <div class="resource-type-option">
                          <div class="option-title">{{ rt.name }}</div>
                          <div class="option-meta">
                            <nz-tag nzColor="blue">{{ rt.code }}</nz-tag>
                            <span *ngIf="rt.description" class="option-desc">{{ rt.description }}</span>
                          </div>
                        </div>
                      </nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
                
                <nz-empty 
                  *ngIf="resourceTypes().length === 0" 
                  [nzNotFoundContent]="'documents.create.step2.no_types' | translate">
                </nz-empty>
            </div>
          </form>
          </div>

          <!-- Step 3: Fill Metadata -->
          <div *ngIf="currentStep === 2" class="step-container">
            <form nz-form [formGroup]="metadataForm" nzLayout="vertical">
              <h3 nz-typography>{{ 'documents.create.step3.title' | translate }}</h3>
              <p nz-typography nzType="secondary">{{ 'documents.create.step3.description' | translate }}</p>
              
              <nz-divider></nz-divider>
              
              <!-- Basic Information -->
              <div class="form-section">
                <h4 nz-typography>{{ 'documents.create.step3.basic_info' | translate }}</h4>
                
                <nz-form-item>
                  <nz-form-label nzRequired>{{ 'documents.create.step3.doc_title' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'documents.create.step3.title_required' | translate">
                    <input nz-input formControlName="title" [placeholder]="'documents.create.step3.title_placeholder' | translate" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>{{ 'documents.create.step3.resource_code' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'documents.create.step3.resource_code_required' | translate" [nzExtra]="'documents.create.step3.resource_code_hint' | translate">
                    <input nz-input formControlName="resourceCode" [placeholder]="'documents.create.step3.resource_code_placeholder' | translate" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>{{ 'documents.create.step3.parent_document' | translate }}</nz-form-label>
                  <nz-form-control [nzExtra]="'documents.create.step3.parent_hint' | translate">
                    <input 
                      nz-input 
                      formControlName="parentSearch" 
                      [placeholder]="'documents.create.step3.parent_placeholder' | translate" 
                      [nzAutocomplete]="auto"
                      (focus)="onParentSearchFocus()"
                      (input)="onParentSearchInput($event)" />
                    <nz-autocomplete #auto (selectionChange)="onParentSelected($event)">
                      <nz-auto-option 
                        *ngIf="isSearchingParents()" 
                        nzDisabled 
                        nzCustomContent>
                        <span nz-icon nzType="loading" nzTheme="outline"></span>
                        {{ 'documents.create.step3.searching' | translate }}
                      </nz-auto-option>
                      <nz-auto-option 
                        *ngIf="!isSearchingParents() && parentSearchResults().length === 0 && (parentSearchQuery().length > 0 || hasSearchedOnFocus)" 
                        nzDisabled 
                        nzCustomContent>
                        <span *ngIf="!selectedResourceType()">{{ 'documents.create.step3.select_type_first' | translate }}</span>
                        <span *ngIf="selectedResourceType()">{{ 'documents.create.step3.no_documents_found' | translate }}</span>
                      </nz-auto-option>
                      <nz-auto-option 
                        *ngFor="let doc of parentSearchResults()" 
                        [nzValue]="getParentDisplayText(doc)" 
                        [nzLabel]="getParentDisplayText(doc)">
                        <div class="parent-option" (click)="selectParentDocument(doc)">
                          <div class="option-title">{{ doc.title }}</div>
                          <div class="option-meta">
                            <nz-tag nzColor="cyan">{{ doc.resourceCode }}</nz-tag>
                            <span *ngIf="doc.resourceTypeName" class="resource-type">{{ doc.resourceTypeName }}</span>
                          </div>
                        </div>
                      </nz-auto-option>
                    </nz-autocomplete>
                    <button 
                      *ngIf="metadataForm.get('parentId')?.value" 
                      nz-button 
                      nzType="text" 
                      nzSize="small"
                      (click)="clearParentSelection()"
                      style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); z-index: 10;">
                      <span nz-icon nzType="close" nzTheme="outline"></span>
                    </button>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>{{ 'documents.create.step3.tags' | translate }}</nz-form-label>
                  <nz-form-control [nzExtra]="'documents.create.step3.tags_hint' | translate">
                    <input nz-input formControlName="tags" [placeholder]="'documents.create.step3.tags_placeholder' | translate" />
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Custom Fields -->
              <div *ngIf="selectedResourceType()?.fields && selectedResourceType()!.fields!.length > 0" 
                   class="form-section custom-fields-section" 
                   [class.rtl-custom-fields]="translationService.isRTL()">
                <nz-divider></nz-divider>
                <h4 nz-typography>{{ 'documents.create.step3.custom_fields' | translate }}</h4>
                
                <ng-container *ngFor="let field of selectedResourceType()!.fields">
                  <!-- Boolean Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.BOOLEAN">
                    <nz-form-control>
                      <label nz-checkbox [formControlName]="field.name">
                        {{ field.label || field.name }}
                        <span *ngIf="field.required" class="required-marker">*</span>
                      </label>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Date Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.DATE">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="field.label + ' is required'">
                      <nz-date-picker 
                        [formControlName]="field.name"
                        nzFormat="yyyy-MM-dd"
                        style="width: 100%;">
                      </nz-date-picker>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Select Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.SELECT">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('documents.create.step3.field_required' | translate)">
                      <nz-select 
                        [formControlName]="field.name"
                        [nzPlaceHolder]="'documents.create.step3.select_option' | translate">
                        <nz-option 
                          *ngFor="let option of field.options" 
                          [nzValue]="option" 
                          [nzLabel]="option">
                        </nz-option>
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Textarea Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.TEXTAREA">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('documents.create.step3.field_required' | translate)">
                      <textarea 
                        nz-input 
                        [formControlName]="field.name" 
                        [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                        [placeholder]="('documents.create.step3.field_placeholder' | translate) + ' ' + (field.label || field.name)">
                      </textarea>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Number Field -->
                  <nz-form-item *ngIf="field.kind === FieldType.NUMBER">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('documents.create.step3.field_required' | translate)">
                      <nz-input-number 
                        [formControlName]="field.name"
                        [nzPlaceHolder]="('documents.create.step3.field_placeholder' | translate) + ' ' + (field.label || field.name)"
                        style="width: 100%;">
                      </nz-input-number>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Text Field (default) -->
                  <nz-form-item *ngIf="!field.kind || field.kind === FieldType.TEXT">
                    <nz-form-label [nzRequired]="field.required">{{ field.label || field.name }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="(field.label || field.name) + ' ' + ('documents.create.step3.field_required' | translate)">
                      <input 
                        nz-input 
                        [formControlName]="field.name"
                        [placeholder]="('documents.create.step3.field_placeholder' | translate) + ' ' + (field.label || field.name)" />
                    </nz-form-control>
                  </nz-form-item>
                </ng-container>
              </div>

              <nz-alert 
                *ngIf="selectedResourceType()?.fields && selectedResourceType()!.fields!.length === 0"
                nzType="info" 
                nzMessage="No custom fields"
                nzDescription="This document type doesn't have any custom fields defined."
                [nzShowIcon]="true">
              </nz-alert>
            </form>
          </div>

          <!-- Step 4: Upload Primary File -->
          <div *ngIf="currentStep === 3" class="step-container">
            <h3 nz-typography>{{ 'documents.create.step4.title' | translate }}</h3>
            <p nz-typography nzType="secondary">{{ 'documents.create.step4.description' | translate }}</p>
            
            <nz-divider></nz-divider>
            
            <div class="upload-section">
              <nz-upload
                nzType="drag"
                [nzMultiple]="false"
                [nzBeforeUpload]="beforeUpload"
                [nzShowUploadList]="false"
                [nzAccept]="acceptFileTypes()">
                <p class="ant-upload-drag-icon">
                  <span nz-icon nzType="cloud-upload" nzTheme="outline"></span>
                </p>
                <p class="ant-upload-text">{{ 'documents.create.step4.upload_text' | translate }}</p>
                <p class="ant-upload-hint">
                  {{ ('documents.create.step4.upload_hint' | translate).replace('{size}', (maxFileSize / (1024*1024)).toString()) }}
                </p>
              </nz-upload>
              
              <div *ngIf="primaryFile()" class="file-info-card">
                <nz-card>
                  <div class="file-info-content">
                    <span nz-icon nzType="file" nzTheme="outline" class="file-icon"></span>
                    <div class="file-details">
                      <div class="file-name">{{ primaryFile()!.name }}</div>
                      <div class="file-meta">
                        <span>{{ getFileSize(primaryFile()!.size) }}</span>
                        <nz-divider nzType="vertical"></nz-divider>
                        <span>{{ primaryFile()!.type || ('documents.create.step4.unknown_type' | translate) }}</span>
                      </div>
                    </div>
                    <button nz-button nzType="text" nzDanger (click)="removePrimaryFile()">
                      <span nz-icon nzType="delete" nzTheme="outline"></span>
                    </button>
                  </div>
                </nz-card>
              </div>
              
              <nz-alert 
                nzType="info" 
                [nzMessage]="('documents.create.step4.allowed_types' | translate).replace('{types}', allowedFileExtensions.join(', '))"
                [nzShowIcon]="true"
                style="margin-top: 16px;">
              </nz-alert>
            </div>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="steps-action" [class.rtl]="translationService.isRTL()">
          <!-- RTL Layout: Next on left, Previous on right -->
          <ng-container *ngIf="translationService.isRTL()">
            <button 
              nz-button 
              nzType="primary" 
              (click)="nextStep()"
              [disabled]="!canProceed()"
              *ngIf="currentStep < 3"
              class="next-button">
              {{ 'documents.create.navigation.next' | translate }}
              <span nz-icon nzType="left" nzTheme="outline"></span>
            </button>
            
            <button 
              nz-button 
              nzType="default" 
              (click)="previousStep()"
              *ngIf="currentStep > 0"
              class="previous-button">
              <span nz-icon nzType="right" nzTheme="outline"></span>
              {{ 'documents.create.navigation.previous' | translate }}
            </button>
            
            <button 
              nz-button 
              nzType="primary" 
              (click)="onSubmit()"
              [nzLoading]="isSubmitting()"
              [disabled]="!canSubmit()"
              *ngIf="currentStep === 3"
              class="submit-button">
              <span nz-icon nzType="check" nzTheme="outline"></span>
              {{ 'documents.create.navigation.create' | translate }}
            </button>
          </ng-container>

          <!-- LTR Layout: Previous on left, Next on right -->
          <ng-container *ngIf="!translationService.isRTL()">
            <button 
              nz-button 
              nzType="default" 
              (click)="previousStep()"
              *ngIf="currentStep > 0"
              class="previous-button">
              <span nz-icon nzType="left" nzTheme="outline"></span>
              {{ 'documents.create.navigation.previous' | translate }}
            </button>
            
            <button 
              nz-button 
              nzType="primary" 
              (click)="nextStep()"
              [disabled]="!canProceed()"
              *ngIf="currentStep < 3"
              class="next-button">
              {{ 'documents.create.navigation.next' | translate }}
              <span nz-icon nzType="right" nzTheme="outline"></span>
            </button>
            
            <button 
              nz-button 
              nzType="primary" 
              (click)="onSubmit()"
              [nzLoading]="isSubmitting()"
              [disabled]="!canSubmit()"
              *ngIf="currentStep === 3"
              class="submit-button">
              <span nz-icon nzType="check" nzTheme="outline"></span>
              {{ 'documents.create.navigation.create' | translate }}
            </button>
          </ng-container>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .create-document-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0;
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    .page-header-wrapper {
      background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
      margin: -24px -24px 24px -24px;
      padding: 40px 48px 32px 48px;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: relative;
    }

    .page-header-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%);
    }

    .page-header-content {
      max-width: 100%;
      overflow: visible;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      overflow: visible;
    }

    .header-title-section {
      flex: 1;
      padding-top: 8px;
    }

    .page-title {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1f1f1f;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      margin: 0;
      color: #666;
      font-size: 15px;
      line-height: 1.5;
      font-weight: 400;
    }

    .header-actions {
      flex-shrink: 0;
      margin-left: 24px;
      padding-top: 4px;
    }

    .action-button {
      height: 44px;
      padding: 0 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #d9d9d9;
      background: #fff;
      color: #262626;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .action-button:hover {
      border-color: #40a9ff;
      color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
      transform: translateY(-1px);
    }

    .steps-content {
      margin-top: 32px;
      min-height: 400px;
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    .step-container {
      padding: 24px 0;
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    .steps-action {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .steps-action.rtl {
      direction: rtl;
    }

    /* Ensure buttons have proper spacing */
    .steps-action .next-button,
    .steps-action .previous-button,
    .steps-action .submit-button {
      flex-shrink: 0;
    }

    .form-section {
      margin-bottom: 32px;
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    .form-section h4 {
      margin-bottom: 16px;
    }

    .resource-type-option {
      padding: 4px 0;
    }

    .option-title {
      font-weight: 500;
    }

    .option-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .option-desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .parent-option {
      padding: 4px 0;
    }

    .parent-option .option-title {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .parent-option .resource-type {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
      margin-left: 8px;
    }

    .upload-section {
      max-width: 500px;
      margin: 0 auto;
    }

    .file-info-card {
      margin-top: 24px;
    }

    .file-info-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-icon {
      font-size: 32px;
      color: #1890ff;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .file-meta {
      color: rgba(0, 0, 0, 0.45);
      font-size: 12px;
    }

    .required-marker {
      color: #ff4d4f;
      margin-left: 4px;
    }

    ::ng-deep .ant-upload.ant-upload-drag {
      border-color: #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
    }

    ::ng-deep .ant-upload.ant-upload-drag:hover {
      border-color: #1890ff;
    }

    ::ng-deep .ant-form-item {
      margin-bottom: 16px;
    }

    /* Global overflow fixes for all containers */
    ::ng-deep app-document-create-page,
    ::ng-deep .create-document-container,
    ::ng-deep .ant-card,
    ::ng-deep .ant-card-body,
    ::ng-deep .steps-content,
    ::ng-deep .step-container,
    ::ng-deep .form-section,
    ::ng-deep .custom-fields-section {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      height: auto !important;
      min-height: auto !important;
    }

    /* RTL Support */
    .rtl-custom-fields {
      direction: rtl;
    }

    .rtl-custom-fields ::ng-deep .ant-form-item-label {
      text-align: right;
    }

    .rtl-custom-fields ::ng-deep .ant-form-item-control {
      text-align: right;
    }

    .rtl-custom-fields ::ng-deep .ant-input {
      direction: rtl;
      text-align: right;
    }

    .rtl-custom-fields ::ng-deep .ant-select {
      direction: rtl;
    }

    .rtl-custom-fields ::ng-deep .ant-input-number {
      direction: rtl;
    }

    .rtl-custom-fields ::ng-deep textarea {
      direction: rtl;
      text-align: right;
    }

    /* Enhanced RTL Support - Fix scrollbar issues */
    [dir="rtl"] ::ng-deep .ant-form-item,
    [dir="rtl"] ::ng-deep .ant-form-item-control,
    [dir="rtl"] ::ng-deep .ant-form-item-control-input,
    [dir="rtl"] ::ng-deep .ant-form-item-control-input-content {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
    }

    /* Fix parent containers overflow in RTL */
    [dir="rtl"] ::ng-deep app-document-create-page,
    [dir="rtl"] ::ng-deep .create-document-container,
    [dir="rtl"] ::ng-deep .ant-card,
    [dir="rtl"] ::ng-deep .ant-card-body,
    [dir="rtl"] ::ng-deep .steps-content,
    [dir="rtl"] ::ng-deep .step-container,
    [dir="rtl"] ::ng-deep .form-section,
    [dir="rtl"] ::ng-deep .custom-fields-section,
    [dir="rtl"] ::ng-deep nz-card,
    [dir="rtl"] ::ng-deep form {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
    }

    /* Fix RTL text overflow and alignment */
    [dir="rtl"] ::ng-deep .ant-input {
      direction: rtl;
      text-align: right;
      overflow: visible !important;
      white-space: nowrap;
    }

    [dir="rtl"] ::ng-deep .ant-form-item-label label {
      white-space: nowrap;
      overflow: visible !important;
    }

    [dir="rtl"] ::ng-deep .ant-form-item-extra {
      text-align: right;
      direction: rtl;
      overflow: visible !important;
      white-space: normal;
      word-wrap: break-word;
    }

    [dir="rtl"] ::ng-deep .ant-select-selector {
      direction: rtl;
      text-align: right;
    }

    [dir="rtl"] ::ng-deep .ant-select-selection-search-input {
      direction: rtl;
      text-align: right;
    }

    /* Ensure proper spacing for RTL */
    [dir="rtl"] ::ng-deep .ant-col {
      overflow: visible !important;
    }

    [dir="rtl"] ::ng-deep .ant-row {
      overflow: visible !important;
    }

    /* Override shell layout constraints if they exist */
    ::ng-deep .inner-content {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      min-height: auto !important;
      height: auto !important;
      max-height: none !important;
    }

    /* Additional overflow fixes for potential parent containers */
    ::ng-deep .content-wrapper,
    ::ng-deep .page-wrapper,
    ::ng-deep .main-content {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .page-header-wrapper {
        padding: 32px 24px 24px 24px;
        margin: -24px -24px 24px -24px;
      }

      .header-top {
        flex-direction: column;
        gap: 20px;
        align-items: stretch;
      }

      .header-title-section {
        padding-top: 0;
      }

      .page-title {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .page-subtitle {
        font-size: 14px;
      }

      .header-actions {
        margin-left: 0;
        width: 100%;
        padding-top: 0;
      }

      .action-button {
        width: 100%;
        justify-content: center;
        height: 48px;
      }

      .create-document-container {
        max-width: 100%;
        margin: 0;
      }
    }
  `],
  providers: [NzMessageService]
})
export class DocumentCreatePageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private documentService = inject(DocumentService);
  private snackbar = inject(SnackbarService);
  private message = inject(NzMessageService);
  private translateService = inject(TranslateService);
  translationService = inject(TranslationService);

  FieldType = FieldType;

  companies = signal<Company[]>([]);
  resourceTypes = signal<ResourceType[]>([]);
  selectedCompany = signal<Company | undefined>(undefined);
  selectedResourceType = signal<ResourceType | undefined>(undefined);
  loadingResourceTypes = false;
  
  primaryFile = signal<File | null>(null);
  isSubmitting = signal(false);
  currentStep = 0;

  // Parent document search
  isSearchingParents = signal(false);
  parentSearchQuery = signal('');
  parentSearchResults = signal<Document[]>([]);
  hasSearchedOnFocus = false;
  private searchTimeout: any;

  // File upload options
  maxFileSize = 100 * 1024 * 1024; // 100MB
  allowedFileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
  
  companyForm: FormGroup = this.fb.group({
    companyId: ['', Validators.required]
  });

  resourceTypeForm: FormGroup = this.fb.group({
    resourceTypeId: ['', Validators.required]
  });

  metadataForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    resourceCode: ['', Validators.required],
    tags: [''],
    parentSearch: [''],
    parentId: [null]
  });

  // Getter for the accept string for file inputs
  acceptFileTypes = computed(() => this.allowedFileExtensions.map(ext => '.' + ext).join(','));

  // File upload handler
  beforeUpload = (file: any): boolean => {
    const isValidType = this.allowedFileExtensions.some(ext => 
      file.name.toLowerCase().endsWith('.' + ext)
    );
    
    if (!isValidType) {
      this.message.error(`File type not allowed. Allowed types: ${this.allowedFileExtensions.join(', ')}`);
      return false;
    }
    
    const isValidSize = file.size / 1024 / 1024 < (this.maxFileSize / 1024 / 1024);
    if (!isValidSize) {
      this.message.error(`File must be smaller than ${this.maxFileSize / (1024 * 1024)}MB!`);
      return false;
    }
    
    this.primaryFile.set(file);
    return false; // Prevent automatic upload
  };

  ngOnInit(): void {
    this.loadCompanies();
    this.setupParentDocumentSearch();
  }

  ngOnDestroy(): void {
    // Clean up search timeout to prevent memory leaks
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  setupParentDocumentSearch(): void {
    // Parent document search is now handled through direct input events
    // and focus events rather than FormControl valueChanges to avoid conflicts
  }

  searchDocuments(query: string): Observable<Document[]> {
    const searchParams: any = {
      page: 0,
      size: 10 // Limit to 10 results for autocomplete
    };

    // Add title search if query is not empty
    if (query && query.trim().length > 0) {
      searchParams.titleContains = query.trim();
    }

    // Filter by same resource type if available
    const selectedResourceTypeId = this.resourceTypeForm.get('resourceTypeId')?.value;
    if (selectedResourceTypeId) {
      searchParams.resourceTypeIdEquals = selectedResourceTypeId;
    }

    // Filter by company if available
    const selectedCompanyId = this.companyForm.get('companyId')?.value;
    if (selectedCompanyId) {
      searchParams.companyIdEquals = selectedCompanyId;
    }

    return this.documentService.list(searchParams).pipe(
      map(page => page.content)
    );
  }

  onParentSearchFocus(): void {
    // Trigger search with empty string to show initial results
    if (this.selectedResourceType()) {
      this.hasSearchedOnFocus = true;
      
      // Force trigger a search with empty string to show initial results
      this.isSearchingParents.set(true);
      this.searchDocuments('').subscribe({
        next: (results) => {
          this.parentSearchResults.set(results);
          this.isSearchingParents.set(false);
        },
        error: (error) => {
          this.isSearchingParents.set(false);
        }
      });
    }
  }

  onParentSearchInput(event: any): void {
    const value = event.target.value;
    
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (value.length >= 2) {
      this.isSearchingParents.set(true);
      
      // Debounce the search by 300ms
      this.searchTimeout = setTimeout(() => {
        this.searchDocuments(value).subscribe({
          next: (results) => {
            this.parentSearchResults.set(results);
            this.isSearchingParents.set(false);
          },
          error: (error) => {
            this.isSearchingParents.set(false);
          }
        });
      }, 300);
    } else if (value.length === 0) {
      // Clear results when input is empty
      this.parentSearchResults.set([]);
      this.isSearchingParents.set(false);
    } else {
      // For 1 character, just clear results
      this.parentSearchResults.set([]);
      this.isSearchingParents.set(false);
    }
  }

  selectParentDocument(doc: Document): void {
    this.metadataForm.patchValue({ 
      parentId: doc.id,
      parentSearch: this.getParentDisplayText(doc)
    });
    this.parentSearchResults.set([]); // Hide dropdown after selection
  }

  onParentSelected(event: any): void {
    // This method might not be needed anymore since we're using click events
  }

  getParentDisplayText(doc: Document): string {
    return `${doc.title} (${doc.resourceCode})`;
  }

  clearParentSelection(): void {
    this.metadataForm.patchValue({
      parentSearch: '',
      parentId: null
    });
    this.parentSearchResults.set([]);
    this.hasSearchedOnFocus = false;
  }

  loadCompanies(): void {
    this.companyService.getAccessibleCompanies().subscribe({
      next: companies => {
        this.companies.set(companies);
        if (companies.length === 0) {
          this.message.warning('No companies are accessible to you. Please contact your administrator.');
        }
      },
      error: err => {
        this.message.error('Failed to load companies');
      }
    });
  }

  onCompanyChange(companyId: number): void {
    const company = this.companies().find(c => c.id === companyId);
    this.selectedCompany.set(company);
    this.selectedResourceType.set(undefined);
    this.resourceTypeForm.patchValue({ resourceTypeId: '' });
    
    // Clear parent selection when company changes
    this.metadataForm.patchValue({
      parentSearch: '',
      parentId: null
    });
    this.parentSearchResults.set([]);
    this.hasSearchedOnFocus = false;
    
    if (company) {
      this.loadResourceTypesForCompany(companyId);
    }
  }

  loadResourceTypesForCompany(companyId: number): void {
    this.loadingResourceTypes = true;
    this.resourceTypeService.getAccessibleForCompany(companyId).subscribe({
      next: types => {
        this.resourceTypes.set(types);
        this.loadingResourceTypes = false;
        if (types.length === 0) {
          this.message.info('No document types are accessible in this company.');
        }
      },
      error: err => {
        this.loadingResourceTypes = false;
        this.message.error('Failed to load document types');
      }
    });
  }

  onResourceTypeChange(resourceTypeId: number): void {
    const resourceType = this.resourceTypes().find(rt => rt.id === resourceTypeId);
    
    if (resourceType) {
      // Clear parent selection when resource type changes
      this.metadataForm.patchValue({
        parentSearch: '',
        parentId: null
      });
      this.parentSearchResults.set([]);
      this.hasSearchedOnFocus = false;

      // Check if fields are already available
      if (resourceType.fields && resourceType.fields.length > 0) {
        this.selectedResourceType.set(resourceType);
        this.generateResourceCode(resourceType);
        this.buildMetadataForm(resourceType.fields);
      } else {
        // Fetch complete resource type with fields
        this.resourceTypeService.getWithFields(resourceTypeId).subscribe({
          next: (fullResourceType) => {
            this.selectedResourceType.set(fullResourceType);
            this.generateResourceCode(fullResourceType);
            this.buildMetadataForm(fullResourceType.fields || []);
          },
          error: () => {
            this.message.error('Failed to load document type details');
          }
        });
      }
    }
  }

  generateResourceCode(resourceType: ResourceType): void {
    const baseCode = resourceType.code;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${baseCode}-${timestamp}-${randomSuffix}`;
    
    this.metadataForm.patchValue({ resourceCode: generatedCode });
  }

  buildMetadataForm(fields: FieldDefinitionDto[]): void {
    // Reset form to base fields
    const currentValues = this.metadataForm.value;
    this.metadataForm = this.fb.group({
      title: [currentValues.title, Validators.required],
      resourceCode: [currentValues.resourceCode, Validators.required],
      tags: [currentValues.tags],
      parentSearch: [currentValues.parentSearch],
      parentId: [currentValues.parentId]
    });

    // Add dynamic fields
    fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      let defaultValue: any = '';
      
      switch (field.kind) {
        case FieldType.BOOLEAN:
          defaultValue = false;
          break;
        case FieldType.NUMBER:
          defaultValue = null;
          break;
        case FieldType.DATE:
          defaultValue = null;
          break;
        default:
          defaultValue = '';
      }
      
      this.metadataForm.addControl(field.name, this.fb.control(defaultValue, validators));
    });
  }

  removePrimaryFile(): void {
      this.primaryFile.set(null);
  }

  getFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.companyForm.valid;
      case 1:
        return this.resourceTypeForm.valid;
      case 2:
        return this.metadataForm.valid;
      case 3:
        return true;
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    return this.metadataForm.valid && this.primaryFile() !== null && !this.isSubmitting();
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/documents']);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);
    
    // Prepare field values
    const fieldValues = this.convertFieldValuesToStrings(
      Object.keys(this.metadataForm.value)
        .filter(key => !['title', 'resourceCode', 'tags', 'parentSearch', 'parentId'].includes(key))
        .reduce((acc, key) => {
          acc[key] = this.metadataForm.value[key];
          return acc;
        }, {} as Record<string, any>)
    );

    // Prepare tags
    const tags = this.metadataForm.value.tags 
      ? this.metadataForm.value.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const dto: CreateDocumentDto = {
      title: this.metadataForm.value.title,
      resourceCode: this.metadataForm.value.resourceCode,
      resourceTypeId: this.resourceTypeForm.value.resourceTypeId,
      parentId: this.metadataForm.value.parentId,
      fieldValues,
      tagNames: tags
    };

    const loading = this.message.loading('Creating document...', { nzDuration: 0 });
    
    this.documentService.create(dto, this.primaryFile()!).subscribe({
      next: (createdDoc: Document) => {
        this.message.remove(loading.messageId);
        this.message.success('Document created successfully');
        this.router.navigate(['/documents', createdDoc.id]);
      },
      error: (err: any) => {
        this.message.remove(loading.messageId);
        this.message.error('Failed to create document: ' + (err.error?.message || err.message));
        this.isSubmitting.set(false);
      }
    });
  }

  private convertFieldValuesToStrings(fieldValues: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(fieldValues)) {
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'boolean') {
        result[key] = value.toString();
      } else if (this.isDateValue(value)) {
        // Handle various date formats including NG-ZORRO date objects
        result[key] = this.formatDateForBackend(value);
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = String(value);
      }
    }
    
    return result;
  }

  private isDateValue(value: any): boolean {
    // Check for standard Date instance
    if (value instanceof Date) {
      return true;
    }
    
    // Check for NG-ZORRO date objects or moment-like objects
    if (value && typeof value === 'object') {
      // NG-ZORRO might return objects with toDate(), valueOf(), or getTime() methods
      if (typeof value.toDate === 'function' || 
          typeof value.valueOf === 'function' || 
          typeof value.getTime === 'function') {
        return true;
      }
    }
    
    return false;
  }

  private formatDateForBackend(dateValue: any): string {
    try {
      let date: Date;
      
      // Handle different date object types
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue.toDate === 'function') {
        // NG-ZORRO or moment.js objects
        date = dateValue.toDate();
      } else if (typeof dateValue.valueOf === 'function') {
        // Objects with valueOf method
        date = new Date(dateValue.valueOf());
      } else if (typeof dateValue.getTime === 'function') {
        // Objects with getTime method
        date = new Date(dateValue.getTime());
      } else {
        // Fallback: try to convert to Date
        date = new Date(dateValue);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return '';
      }
      
      // Format as YYYY-MM-DD for backend compatibility
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', dateValue, error);
      return '';
    }
  }
}
