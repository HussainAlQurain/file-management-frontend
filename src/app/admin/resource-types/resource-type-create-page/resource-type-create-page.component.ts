import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { FieldType, ResourceTypeField } from '../../../core/models/resource-type.model';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-resource-type-create-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-4 md:p-8">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="text-2xl font-semibold">Create New Resource Type</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="resourceTypeForm" (ngSubmit)="onSubmit()" class="space-y-6">            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Code</mat-label>
              <input matInput formControlName="code" required>
              @if (resourceTypeForm.get('code')?.hasError('required')) {
                <mat-error>Code is required.</mat-error>
              }
              @if (resourceTypeForm.get('code')?.hasError('pattern')) {
                <mat-error>Code must contain only uppercase letters, numbers, and underscores.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required>
              @if (resourceTypeForm.get('name')?.hasError('required')) {
                <mat-error>Name is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Description (Optional)</mat-label>
              <textarea matInput formControlName="description" cdkTextareaAutosize cdkAutosizeMinRows="2" cdkAutosizeMaxRows="5"></textarea>
            </mat-form-field>

            <div class="border-t pt-6">
              <h3 class="text-xl font-medium mb-4">Fields</h3>
              <div formArrayName="fields" class="space-y-4">
                @for (fieldGroup of fields.controls; track fieldGroup; let i = $index) {
                  <div [formGroupName]="i" class="p-4 border rounded-md shadow-sm bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Field Name</mat-label>
                        <input matInput formControlName="name" required>
                        @if (fields.controls[i].get('name')?.hasError('required')) {
                          <mat-error>Field name is required.</mat-error>
                        }
                         @if (fields.controls[i].get('name')?.hasError('pattern')) {
                          <mat-error>Field name must be alphanumeric and underscores only.</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Field Label</mat-label>
                        <input matInput formControlName="label" required>
                        @if (fields.controls[i].get('label')?.hasError('required')) {
                          <mat-error>Field label is required.</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Field Type</mat-label>
                        <mat-select formControlName="type" required>
                          @for (fieldType of fieldTypes; track fieldType) {
                            <mat-option [value]="fieldType">{{ fieldType }}</mat-option>
                          }
                        </mat-select>
                        @if (fields.controls[i].get('type')?.hasError('required')) {
                          <mat-error>Field type is required.</mat-error>
                        }
                      </mat-form-field>

                      @if (fields.controls[i].get('type')?.value === FieldType.SELECT) {
                        <mat-form-field appearance="outline" class="w-full md:col-span-2">
                          <mat-label>Options (comma-separated)</mat-label>
                          <input matInput formControlName="options">
                           @if (fields.controls[i].get('options')?.hasError('required')) {
                            <mat-error>Options are required for SELECT type.</mat-error>
                          }
                        </mat-form-field>
                      }
                      <div class="flex items-center space-x-2 pt-2 md:col-span-1">
                        <mat-checkbox formControlName="required">Required</mat-checkbox>
                        <button mat-icon-button color="warn" type="button" (click)="removeField(i)" matTooltip="Remove field">
                          <mat-icon>remove_circle_outline</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <button mat-stroked-button color="primary" type="button" (click)="addField()" class="mt-4">
                <mat-icon>add</mat-icon> Add Field
              </button>
            </div>

            <div class="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <button mat-stroked-button routerLink="../" type="button" [disabled]="isSubmitting()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="resourceTypeForm.invalid || isSubmitting()">
                @if(isSubmitting()){
                  <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                  <span>Creating...</span>
                } @else {
                  <span>Create Resource Type</span>
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ResourceTypeCreatePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceTypeService = inject(ResourceTypeService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  resourceTypeForm!: FormGroup;
  fieldTypes = Object.values(FieldType);
  FieldType = FieldType; // Make enum available in template
  isSubmitting = signal(false);
  ngOnInit(): void {
    this.resourceTypeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      name: ['', Validators.required],
      description: [''],
      fields: this.fb.array([])
    });
    this.addField(); // Add one field by default
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
      this.snackbar.error('Please fill all required fields correctly.');
      this.resourceTypeForm.markAllAsTouched(); // Mark all fields as touched to show errors
      return;
    }
    
    // Check for duplicate field names
    if (!this.validateFieldNames()) {
      return;
    }
    
    this.isSubmitting.set(true);

    // Step 1: Create the resource type first with just code and description
    const formValue = this.resourceTypeForm.value;
    const createResourceTypeDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description
    };

    // Step 2: Create the resource type first
    this.resourceTypeService.create(createResourceTypeDto).subscribe({
      next: (createdResourceType) => {
        // Step 3: Then add fields one by one
        const fieldsToAdd = formValue.fields;
        
        if (fieldsToAdd && fieldsToAdd.length > 0) {
          // Add fields sequentially using recursive function
          const addFieldsSequentially = (fields: any[], index = 0) => {
            if (index >= fields.length) {
              this.isSubmitting.set(false);
              this.snackbar.success(`Resource type "${createdResourceType.code}" created successfully with ${fields.length} fields.`);
              this.router.navigate(['/resource-types']);
              return;
            }

            const field = fields[index];
            const fieldDto = {
              name: field.name,
              kind: field.type,
              required: field.required,
              uniqueWithinType: false
            };
            
            this.resourceTypeService.addField(createdResourceType.id, fieldDto).subscribe({
              next: () => addFieldsSequentially(fields, index + 1),
              error: (err) => {
                this.snackbar.error(`Added ${index} fields but failed to add field "${field.name}": ${err.error?.message || err.message}`);
                // Continue with next field despite error
                addFieldsSequentially(fields, index + 1);
              }
            });
          };
          
          addFieldsSequentially(fieldsToAdd);
        } else {
          this.isSubmitting.set(false);
          this.snackbar.success(`Resource type "${createdResourceType.code}" created successfully.`);
          this.router.navigate(['/resource-types']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to create resource type: ' + (err.error?.message || err.message));
      }
    });
  }
}
