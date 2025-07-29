import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { CompanyService } from '../../../core/services/company.service';
import { FieldType, ResourceTypeField } from '../../../core/models/resource-type.model';
import { Company } from '../../../core/models/company.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-resource-type-create-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule,
    NzDividerModule,
    NzToolTipModule
  ],
  template: `
    <!-- Custom Header Structure -->
    <div class="page-header-wrapper">
      <div class="page-header-content">
        <div class="header-top">
          <div class="header-title-section">
            <h1 class="page-title">{{ 'admin.resource_types.create.title' | translate }}</h1>
            <p class="page-subtitle">{{ 'admin.resource_types.create.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <button nz-button nzType="default" routerLink="../">
              <nz-icon nzType="arrow-left"></nz-icon>
              {{ 'admin.resource_types.create.back' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Card -->
    <div class="content-card">
      <div class="form-card">
        <form nz-form [formGroup]="resourceTypeForm" (ngSubmit)="onSubmit()" class="resource-type-form">
          
          <!-- Basic Information -->
          <div class="form-section">
            <h3 class="section-title">{{ 'admin.resource_types.create.form.title' | translate }}</h3>
            
            <div nz-row [nzGutter]="[16, 16]">
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.company' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.company_required' | translate">
                    <nz-select 
                      formControlName="companyId" 
                      [nzPlaceHolder]="'admin.resource_types.create.form.company_placeholder' | translate" 
                      [nzLoading]="isLoadingCompanies()"
                      class="rtl-select">
                      @for (company of companies(); track company.id) {
                        <nz-option [nzValue]="company.id" [nzLabel]="company.name">
                          <nz-icon nzType="apartment" class="option-icon"></nz-icon>
                          {{ company.name }}
                        </nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.code' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.code_required' | translate">
                    <input 
                      nz-input 
                      formControlName="code" 
                      [placeholder]="'admin.resource_types.create.form.code_placeholder' | translate"
                      class="rtl-input">
                  </nz-form-control>
                </nz-form-item>
              </div>
              
              <div nz-col [nzSpan]="8">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.name' | translate }}</nz-form-label>
                  <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.name_required' | translate">
                    <input 
                      nz-input 
                      formControlName="name" 
                      [placeholder]="'admin.resource_types.create.form.name_placeholder' | translate"
                      class="rtl-input">
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <nz-form-item>
              <nz-form-label>{{ 'admin.resource_types.create.form.description' | translate }}</nz-form-label>
              <nz-form-control>
                <textarea 
                  nz-input 
                  formControlName="description" 
                  [placeholder]="'admin.resource_types.create.form.description_placeholder' | translate"
                  [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                  class="rtl-input">
                </textarea>
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-divider [nzText]="'admin.resource_types.create.form.custom_fields' | translate" nzOrientation="left"></nz-divider>

          <!-- Fields Section -->
          <div class="form-section">
            <div formArrayName="fields" class="fields-container">
              @for (fieldGroup of fields.controls; track fieldGroup; let i = $index) {
                <div class="field-card">
                  <div class="field-header">
                    <h4 class="field-title">
                      {{ 'admin.resource_types.create.form.field' | translate }} {{ i + 1 }}
                    </h4>
                    <button 
                      nz-button 
                      nzType="text" 
                      nzSize="small" 
                      nzDanger 
                      (click)="removeField(i)"
                      nz-tooltip
                      [nzTooltipTitle]="'admin.resource_types.create.form.remove_field' | translate">
                      <nz-icon nzType="delete"></nz-icon>
                    </button>
                  </div>

                  <div [formGroupName]="i" class="field-content">
                    <div nz-row [nzGutter]="[16, 16]">
                      <div nz-col [nzSpan]="12">
                        <nz-form-item>
                          <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.field_label' | translate }}</nz-form-label>
                          <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.field_label_required' | translate">
                            <input 
                              nz-input 
                              formControlName="label" 
                              [placeholder]="'admin.resource_types.create.form.field_label_placeholder' | translate"
                              class="rtl-input">
                          </nz-form-control>
                        </nz-form-item>
                      </div>
                      
                      <div nz-col [nzSpan]="12">
                        <nz-form-item>
                          <nz-form-label>{{ 'admin.resource_types.create.form.field_name' | translate }}</nz-form-label>
                          <nz-form-control>
                            <input 
                              nz-input 
                              formControlName="name" 
                              readonly 
                              [placeholder]="'admin.resource_types.create.form.field_name_placeholder' | translate" 
                              class="readonly-input rtl-input">
                          </nz-form-control>
                        </nz-form-item>
                      </div>
                    </div>

                    <div nz-row [nzGutter]="[16, 16]">
                      <div nz-col [nzSpan]="24">
                        <nz-form-item>
                          <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.field_type' | translate }}</nz-form-label>
                          <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.field_type_required' | translate">
                            <nz-select 
                              formControlName="type" 
                              [nzPlaceHolder]="'admin.resource_types.create.form.field_type_placeholder' | translate"
                              class="rtl-select">
                              @for (fieldType of fieldTypes; track fieldType) {
                                <nz-option [nzValue]="fieldType" [nzLabel]="getFieldTypeLabel(fieldType)">
                                  <nz-icon [nzType]="getFieldTypeIcon(fieldType)" class="option-icon"></nz-icon>
                                  {{ getFieldTypeLabel(fieldType) }}
                                </nz-option>
                              }
                            </nz-select>
                          </nz-form-control>
                        </nz-form-item>
                      </div>
                    </div>

                    @if (fields.controls[i].get('type')?.value === FieldType.SELECT) {
                      <nz-form-item>
                        <nz-form-label [nzRequired]="true">{{ 'admin.resource_types.create.form.options' | translate }}</nz-form-label>
                        <nz-form-control [nzErrorTip]="'admin.resource_types.create.form.options_required' | translate">
                          <input 
                            nz-input 
                            formControlName="options" 
                            [placeholder]="'admin.resource_types.create.form.options_placeholder' | translate"
                            class="rtl-input">
                          <div class="form-help-text">{{ 'admin.resource_types.create.form.options_help' | translate }}</div>
                        </nz-form-control>
                      </nz-form-item>
                    }

                    <nz-form-item>
                      <nz-form-control>
                        <div class="checkbox-group">
                          <label nz-checkbox formControlName="required">
                            <nz-icon nzType="exclamation-circle" class="checkbox-icon"></nz-icon>
                            {{ 'admin.resource_types.create.form.required_field' | translate }}
                          </label>
                          <label nz-checkbox formControlName="uniqueWithinType">
                            <nz-icon nzType="safety-certificate" class="checkbox-icon"></nz-icon>
                            {{ 'admin.resource_types.create.form.unique_within_type' | translate }}
                          </label>
                        </div>
                      </nz-form-control>
                    </nz-form-item>
                  </div>
                </div>
              }
            </div>

            <div class="add-field-container">
              <button nz-button nzType="dashed" (click)="addField()" class="add-field-button">
                <nz-icon nzType="plus"></nz-icon>
                {{ 'admin.resource_types.create.form.add_field' | translate }}
              </button>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button nz-button nzType="default" routerLink="../" [disabled]="isSubmitting()" class="cancel-button">
              <nz-icon nzType="close"></nz-icon>
              {{ 'admin.resource_types.create.form.cancel' | translate }}
            </button>
            <button 
              nz-button 
              nzType="primary" 
              type="submit" 
              [nzLoading]="isSubmitting()"
              [disabled]="resourceTypeForm.invalid"
              class="submit-button">
              <nz-icon nzType="plus"></nz-icon>
              {{ 'admin.resource_types.create.form.create' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Custom Header Pattern */
    .page-header-wrapper {
      margin-bottom: 24px;
    }
    
    .page-header-content {
      background: #fff;
      padding: 16px 24px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    
    .header-title-section {
      flex: 1;
    }
    
    .page-title {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 600;
      color: #262626;
      line-height: 28px;
    }
    
    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: #8c8c8c;
      line-height: 22px;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    /* Content Cards */
    .content-card {
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
    }
    
    .form-card {
      padding: 24px;
    }
    
    /* Form Styling */
    .resource-type-form {
      width: 100%;
    }
    
    .form-section {
      margin-bottom: 32px;
    }
    
    .section-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }
    
    /* Field Cards */
    .fields-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .field-card {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      padding: 16px;
      background: #fafafa;
    }
    
    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .field-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #262626;
    }
    
    .field-content {
      background: #fff;
      padding: 16px;
      border-radius: 4px;
    }
    
    /* Form Elements */
    .readonly-input {
      background-color: #f5f5f5 !important;
      cursor: not-allowed;
    }
    
    .form-help-text {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 4px;
    }
    
    .checkbox-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .checkbox-icon {
      margin-inline-end: 4px;
    }
    
    .option-icon {
      margin-inline-end: 8px;
    }
    
    /* RTL Select Component */
    .rtl-select {
      width: 100%;
    }
    
    [dir="rtl"] .rtl-select .ant-select-selector {
      text-align: right;
    }
    
    [dir="rtl"] .rtl-select .ant-select-selection-item {
      text-align: right;
    }
    
    /* RTL Input Component */
    .rtl-input {
      width: 100%;
    }
    
    [dir="rtl"] .rtl-input {
      text-align: right;
      direction: rtl;
    }
    
    /* Add Field Button */
    .add-field-container {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
    
    .add-field-button {
      width: 100%;
      max-width: 300px;
    }
    
    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
      margin-top: 32px;
    }
    
    .cancel-button,
    .submit-button {
      min-width: 120px;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header-content {
        padding: 12px 16px;
      }
      
      .header-top {
        flex-direction: column;
        gap: 12px;
      }
      
      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
      
      .form-card {
        padding: 16px;
      }
      
      .checkbox-group {
        flex-direction: column;
        gap: 8px;
      }
      
      .form-actions {
        flex-direction: column-reverse;
      }
      
      .cancel-button,
      .submit-button {
        width: 100%;
      }
    }
    
    /* RTL Support */
    [dir="rtl"] .option-icon,
    [dir="rtl"] .checkbox-icon {
      margin-inline-end: 0;
      margin-inline-start: 4px;
    }
    
    /* RTL Input Support */
    [dir="rtl"] .rtl-input,
    [dir="rtl"] input.rtl-input,
    [dir="rtl"] textarea.rtl-input {
      text-align: right !important;
    }
    
    /* Global RTL for Ant Design Form Components */
    [dir="rtl"] .ant-input,
    [dir="rtl"] .ant-input-affix-wrapper {
      text-align: right !important;
    }
    
    /* RTL Select - Force Override with ::ng-deep approach */
    :host ::ng-deep [dir="rtl"] .ant-select-selector,
    :host ::ng-deep [dir="rtl"] .ant-select-selection-item,
    :host ::ng-deep [dir="rtl"] .ant-select-selection-placeholder {
      text-align: right !important;
      direction: rtl !important;
    }
    
    /* RTL Dropdown Support */
    [dir="rtl"] .ant-select-dropdown .ant-select-item,
    [dir="rtl"] .ant-select-dropdown .ant-select-item-option,
    [dir="rtl"] .ant-select-dropdown .ant-select-item-option-content {
      text-align: right !important;
      direction: rtl !important;
    }
  `]
})
export class ResourceTypeCreatePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private translateService = inject(TranslateService);

  resourceTypeForm!: FormGroup;
  fieldTypes = Object.values(FieldType);
  FieldType = FieldType; // Make enum available in template
  isSubmitting = signal(false);
  companies = signal<Company[]>([]);
  isLoadingCompanies = signal(false);

  ngOnInit(): void {
    this.loadCompanies();
    this.resourceTypeForm = this.fb.group({
      companyId: [null, Validators.required],
                    code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      fields: this.fb.array([])
    });
    this.addField(); // Add one field by default
  }

  loadCompanies(): void {
    this.isLoadingCompanies.set(true);
    this.companyService.listAll().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.isLoadingCompanies.set(false);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.snackbar.error(this.translateService.instant('admin.resource_types.create.messages.loading_companies'));
        this.isLoadingCompanies.set(false);
      }
    });
  }

  get fields(): FormArray {
    return this.resourceTypeForm.get('fields') as FormArray;
  }

  createFieldGroup(): FormGroup {
    const fieldGroup = this.fb.group({
      name: [''], // Auto-generated, no validation needed
      label: ['', Validators.required],
      type: [null, Validators.required],
      required: [false],
      uniqueWithinType: [false],
      options: [''], // Comma-separated string
      order: [this.fields.length] // Set order based on current length
    });

    // Auto-generate field name when label changes
    fieldGroup.get('label')?.valueChanges.subscribe(label => {
      if (label) {
        const generatedName = this.generateFieldName(label);
        fieldGroup.get('name')?.setValue(generatedName);
      }
    });

    // Add validator for options if type is SELECT
    fieldGroup.get('type')?.valueChanges.subscribe(type => {
      const optionsControl = fieldGroup.get('options');
      if (type === FieldType.SELECT) {
        optionsControl?.setValidators(Validators.required);
      } else {
        optionsControl?.clearValidators();
      }
      optionsControl?.updateValueAndValidity();
    });

    return fieldGroup;
  }

  addField(): void {
    this.fields.push(this.createFieldGroup());
  }

  removeField(index: number): void {
    this.fields.removeAt(index);
    // Update order for remaining fields
    this.fields.controls.forEach((control, idx) => {
      control.get('order')?.setValue(idx);
    });
  }

  getFieldTypeIcon(fieldType: string): string {
    switch (fieldType) {
      case 'TEXT':
        return 'font-colors';
      case 'TEXTAREA':
        return 'align-left';
      case 'NUMBER':
        return 'calculator';
      case 'DATE':
        return 'calendar';
      case 'BOOLEAN':
      case 'CHECKBOX':
        return 'check-square';
      case 'SELECT':
        return 'down-square';
      default:
        return 'question-circle';
    }
  }

  getFieldTypeLabel(fieldType: string): string {
    return this.translateService.instant(`admin.resource_types.create.field_types.${fieldType}`);
  }

  generateFieldName(label: string): string {
    if (!label) return '';
    
    return label
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters (including Arabic), numbers, spaces, hyphens
      .replace(/[\s-]+/g, '_')  // Replace spaces and hyphens with underscores
      .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
      .substring(0, 50);        // Limit length to 50 chars to match database
  }

  // Check for duplicate field names/codes when adding a new field
  private checkDuplicateFieldName(fieldName: string): boolean {
    const fieldsArray = this.fields.value;
    return fieldsArray.filter((field: any) => field.name.toLowerCase() === fieldName.toLowerCase()).length > 1;
  }

  // Validate the entire form for duplicate fields before submission
  private validateFieldNames(): boolean {
    const fieldsArray = this.fields.value;
    const fieldNames = fieldsArray.map((field: any) => field.name.toLowerCase());
    
    // Check for duplicates by comparing the original array length with the Set length
    const uniqueFieldNames = new Set(fieldNames);
    if (uniqueFieldNames.size !== fieldNames.length) {
      this.snackbar.error(this.translateService.instant('admin.resource_types.create.messages.duplicate_fields'));
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (this.resourceTypeForm.invalid) {
      this.snackbar.error(this.translateService.instant('admin.resource_types.create.messages.form_invalid'));
      this.resourceTypeForm.markAllAsTouched();
      return;
    }
    if (!this.validateFieldNames()) {
      return;
    }
    this.isSubmitting.set(true);
    const formValue = this.resourceTypeForm.value;
    const fields = formValue.fields.map((f: any) => {
      // Map 'Checkbox' type to 'BOOLEAN' for backend
      let kind = f.type;
      if (kind === 'CHECKBOX') kind = 'BOOLEAN';
      // For SELECT, split options by comma and trim
      let options: string[] | undefined = undefined;
      if (kind === 'SELECT' && f.options) {
        options = f.options.split(',').map((opt: string) => opt.trim()).filter((opt: string) => !!opt);
      }
      return {
        name: f.name,
        label: f.label,
        kind,
        required: f.required,
        uniqueWithinType: f.uniqueWithinType || false,
        options
      };
    });

    const resourceTypeDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description,
      companyId: formValue.companyId,
      fields
    };

    this.resourceTypeService.create(resourceTypeDto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const fieldWord = this.translateService.instant('admin.resource_types.create.messages.field');
        const plural = fields.length !== 1 ? this.translateService.instant('admin.resource_types.create.messages.plural_suffix') : '';
        const successMessage = this.translateService.instant('admin.resource_types.create.messages.success_template')
          .replace('{code}', res.code)
          .replace('{count}', fields.length.toString())
          .replace('{field}', fieldWord)
          .replace('{plural}', plural);
        this.snackbar.success(successMessage);
        this.router.navigate(['../']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMessage = this.translateService.instant('admin.resource_types.create.messages.error');
        this.snackbar.error(`${errorMessage}: ${err.error?.message || err.message}`);
      }
    });
  }
}
