import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

import { FieldType, FieldDefinitionDto, CreateFieldDto } from '../../../../core/models/resource-type.model';

export interface FieldDialogData {
  field?: FieldDefinitionDto;
  action: 'add' | 'edit' | 'delete';
  resourceTypeId: number;
  title: string;
}

@Component({
  selector: 'app-field-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  template: `
    <div class="field-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <form [formGroup]="fieldForm" *ngIf="data.action !== 'delete'" class="field-form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Field Name</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="fieldForm.get('name')?.hasError('required')">
              Field name is required
            </mat-error>
            <mat-error *ngIf="fieldForm.get('name')?.hasError('pattern')">
              Field name must be alphanumeric and underscores only
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Field Type</mat-label>
            <mat-select formControlName="kind" required>
              <mat-option *ngFor="let type of fieldTypes" [value]="type">{{ type }}</mat-option>
            </mat-select>
            <mat-error *ngIf="fieldForm.get('kind')?.hasError('required')">
              Field type is required
            </mat-error>
          </mat-form-field>

          <div class="flex items-center mb-4">
            <mat-checkbox formControlName="required" class="mr-4">Required</mat-checkbox>
            <mat-checkbox formControlName="uniqueWithinType">Unique within type</mat-checkbox>
          </div>
        </form>

        <p *ngIf="data.action === 'delete'" class="mb-4 text-warn">
          Are you sure you want to delete this field? This action cannot be undone.
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        
        <button 
          *ngIf="data.action !== 'delete'"
          mat-raised-button 
          color="primary" 
          [disabled]="fieldForm.invalid" 
          (click)="submit()">
          {{ data.action === 'add' ? 'Add' : 'Update' }}
        </button>
        
        <button 
          *ngIf="data.action === 'delete'"
          mat-raised-button 
          color="warn" 
          (click)="submit()">
          Delete
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .field-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class FieldDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  fieldForm: FormGroup;
  fieldTypes = Object.values(FieldType);
  
  constructor(
    public dialogRef: MatDialogRef<FieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FieldDialogData
  ) {
    this.fieldForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      kind: [null, Validators.required],
      required: [false],
      uniqueWithinType: [false]
    });
  }
  
  ngOnInit(): void {
    if (this.data.action === 'edit' && this.data.field) {
      this.fieldForm.patchValue({
        name: this.data.field.name,
        kind: this.data.field.kind,
        required: this.data.field.required,
        uniqueWithinType: this.data.field.uniqueWithinType
      });
    }
  }
  
  submit(): void {
    if (this.data.action !== 'delete' && this.fieldForm.invalid) {
      return;
    }
    
    if (this.data.action === 'delete') {
      this.dialogRef.close(true);
      return;
    }
    
    const fieldData: CreateFieldDto = this.fieldForm.value;
    this.dialogRef.close(fieldData);
  }
}
