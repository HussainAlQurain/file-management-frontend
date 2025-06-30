import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';

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
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzSpinModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzGridModule,
    NzDividerModule
  ],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <nz-page-header class="mb-6" [nzGhost]="false">
        <nz-breadcrumb nz-page-header-breadcrumb>
          <nz-breadcrumb-item>
            <a routerLink="../">Resource Types</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>Create Resource Type</nz-breadcrumb-item>
        </nz-breadcrumb>
        
        <nz-page-header-title>Create New Resource Type</nz-page-header-title>
        <nz-page-header-subtitle>Define document type and its custom fields</nz-page-header-subtitle>
        
        <nz-page-header-extra>
          <button nz-button nzType="default" routerLink="../">
            <nz-icon nzType="arrow-left"></nz-icon>
            Back to Resource Types
          </button>
        </nz-page-header-extra>
      </nz-page-header>

      <!-- Form Card -->
      <nz-card nzTitle="Resource Type Information">
        <form nz-form [formGroup]="resourceTypeForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <!-- Basic Information -->
          <div nz-row [nzGutter]="[16, 16]">
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Company</nz-form-label>
                <nz-form-control [nzErrorTip]="'Company is required'">
                  <nz-select formControlName="companyId" nzPlaceHolder="Select a company" [nzLoading]="isLoadingCompanies()">
                    @for (company of companies(); track company.id) {
                      <nz-option [nzValue]="company.id" [nzLabel]="company.name">
                        <nz-icon nzType="apartment" class="mr-2"></nz-icon>
                        {{ company.name }}
                      </nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Code</nz-form-label>
                <nz-form-control [nzErrorTip]="codeErrorTpl">
                  <input nz-input formControlName="code" placeholder="e.g. INVOICE_2024">
                  <ng-template #codeErrorTpl let-control>
                    @if (control.hasError('required')) {
                      <span>Code is required</span>
                    } @else if (control.hasError('pattern')) {
                      <span>Code must contain only uppercase letters, numbers, and underscores</span>
                    }
                  </ng-template>
                </nz-form-control>
              </nz-form-item>
            </div>
            
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">Name</nz-form-label>
                <nz-form-control [nzErrorTip]="'Name is required'">
                  <input nz-input formControlName="name" placeholder="e.g. Invoice Document">
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label>Description</nz-form-label>
            <nz-form-control>
              <textarea 
                nz-input 
                formControlName="description" 
                placeholder="Optional description of this resource type"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }">
              </textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="Custom Fields" nzOrientation="left"></nz-divider>

          <!-- Fields Section -->
          <div formArrayName="fields" class="space-y-4">
            @for (fieldGroup of fields.controls; track fieldGroup; let i = $index) {
              <nz-card 
                [nzTitle]="'Field ' + (i + 1)" 
                nzSize="small" 
                [nzExtra]="fieldActions"
                class="border border-gray-200">
                
                <ng-template #fieldActions>
                  <button 
                    nz-button 
                    nzType="text" 
                    nzSize="small" 
                    nzDanger 
                    (click)="removeField(i)"
                    nz-tooltip="Remove field">
                    <nz-icon nzType="delete"></nz-icon>
                  </button>
                </ng-template>

                <div [formGroupName]="i">
                  <div nz-row [nzGutter]="[16, 16]">
                    <div nz-col [nzSpan]="8">
                      <nz-form-item>
                        <nz-form-label [nzRequired]="true">Field Name</nz-form-label>
                        <nz-form-control [nzErrorTip]="fieldNameErrorTpl">
                          <input nz-input formControlName="name" placeholder="e.g. invoice_number">
                          <ng-template #fieldNameErrorTpl let-control>
                            @if (control.hasError('required')) {
                              <span>Field name is required</span>
                            } @else if (control.hasError('pattern')) {
                              <span>Field name must be alphanumeric and underscores only</span>
                            }
                          </ng-template>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                    
                    <div nz-col [nzSpan]="8">
                      <nz-form-item>
                        <nz-form-label [nzRequired]="true">Field Label</nz-form-label>
                        <nz-form-control [nzErrorTip]="'Field label is required'">
                          <input nz-input formControlName="label" placeholder="e.g. Invoice Number">
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                    
                    <div nz-col [nzSpan]="8">
                      <nz-form-item>
                        <nz-form-label [nzRequired]="true">Field Type</nz-form-label>
                        <nz-form-control [nzErrorTip]="'Field type is required'">
                          <nz-select formControlName="type" nzPlaceHolder="Select field type">
                            @for (fieldType of fieldTypes; track fieldType) {
                              <nz-option [nzValue]="fieldType" [nzLabel]="fieldType">
                                <nz-icon [nzType]="getFieldTypeIcon(fieldType)" class="mr-2"></nz-icon>
                                {{ fieldType }}
                              </nz-option>
                            }
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                    </div>
                  </div>

                  @if (fields.controls[i].get('type')?.value === FieldType.SELECT) {
                    <nz-form-item>
                      <nz-form-label [nzRequired]="true">Options</nz-form-label>
                      <nz-form-control [nzErrorTip]="'Options are required for SELECT type'">
                        <input 
                          nz-input 
                          formControlName="options" 
                          placeholder="Option 1, Option 2, Option 3">
                        <div class="text-xs text-gray-500 mt-1">Separate options with commas</div>
                      </nz-form-control>
                    </nz-form-item>
                  }

                  <nz-form-item>
                    <nz-form-control>
                      <div class="flex items-center gap-4">
                        <label nz-checkbox formControlName="required">
                          <nz-icon nzType="exclamation-circle" class="mr-1"></nz-icon>
                          Required field
                        </label>
                        <label nz-checkbox formControlName="uniqueWithinType">
                          <nz-icon nzType="safety-certificate" class="mr-1"></nz-icon>
                          Unique within type
                        </label>
                      </div>
                    </nz-form-control>
                  </nz-form-item>
                </div>
              </nz-card>
            }
          </div>

          <div class="text-center">
            <button nz-button nzType="dashed" (click)="addField()" class="w-full">
              <nz-icon nzType="plus"></nz-icon>
              Add Field
            </button>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end gap-3 pt-6 border-t">
            <button nz-button nzType="default" routerLink="../" [disabled]="isSubmitting()">
              <nz-icon nzType="close"></nz-icon>
              Cancel
            </button>
            <button 
              nz-button 
              nzType="primary" 
              type="submit" 
              [nzLoading]="isSubmitting()"
              [disabled]="resourceTypeForm.invalid">
              <nz-icon nzType="plus"></nz-icon>
              Create Resource Type
            </button>
          </div>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    nz-page-header {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
  `]
})
export class ResourceTypeCreatePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceTypeService = inject(ResourceTypeService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

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
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
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
        this.snackbar.error('Failed to load companies');
        this.isLoadingCompanies.set(false);
      }
    });
  }

  get fields(): FormArray {
    return this.resourceTypeForm.get('fields') as FormArray;
  }

  createFieldGroup(): FormGroup {
    const fieldGroup = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      label: ['', Validators.required],
      type: [null, Validators.required],
      required: [false],
      uniqueWithinType: [false],
      options: [''], // Comma-separated string
      order: [this.fields.length] // Set order based on current length
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
      this.snackbar.error('Duplicate field names found. Field names must be unique.');
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (this.resourceTypeForm.invalid) {
      this.snackbar.error('Please correct the errors in the form.');
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
        this.snackbar.success(
          `Resource type "${res.code}" created successfully with ${fields.length} field${fields.length !== 1 ? 's' : ''}!`
        );
        this.router.navigate(['../']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create resource type: ' + (err.error?.message || err.message));
      }
    });
  }
}
