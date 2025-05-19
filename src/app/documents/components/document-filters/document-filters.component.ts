import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
// No MatNativeDateModule needed if provideNativeDateAdapter is used in app.config
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import { DocQuery } from '../../../core/models/document.model';
import { ResourceType } from '../../../core/models/resource-type.model';

@Component({
  selector: 'app-document-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    // MatNativeDateModule, // Can be removed if provideNativeDateAdapter is in app.config
    MatChipsModule,
    MatCheckboxModule
  ],
  template: `
    <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filters-form">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title Contains</mat-label>
          <input matInput formControlName="titleContains" placeholder="Search by title...">
          <mat-icon matSuffix>title</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Resource Code</mat-label>
          <input matInput formControlName="resourceCodeEquals" placeholder="Exact resource code...">
          <mat-icon matSuffix>fingerprint</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Resource Type</mat-label>
          <mat-select formControlName="resourceTypeIdEquals">
            <mat-option [value]="null">All Types</mat-option>
            <mat-option *ngFor="let type of resourceTypes; trackBy: trackById" [value]="type.id">{{ type.code }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Owner ID</mat-label>
          <input matInput type="number" formControlName="ownerIdEquals" placeholder="Enter user ID...">
          <mat-icon matSuffix>person_search</mat-icon>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Parent ID</mat-label>
          <input matInput type="number" formControlName="parentIdEquals" placeholder="Enter parent document ID...">
          <mat-icon matSuffix>folder</mat-icon>
        </mat-form-field>

        <div class="flex items-center p-2">
          <mat-checkbox formControlName="topLevelOnly" color="primary">
            Show only top-level documents
          </mat-checkbox>
          <mat-icon class="ml-2 text-gray-500" matTooltip="Documents that don't have a parent">folder</mat-icon>
        </div>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>From Date</mat-label>
          <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" placeholder="Created from date">
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>To Date</mat-label>
          <input matInput [matDatepicker]="toPicker" formControlName="toDate" placeholder="Created up to date">
          <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Permission</mat-label>
          <mat-select formControlName="perm">
            <mat-option *ngFor="let option of permissionOptions" [value]="option.value">{{ option.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-full sm:col-span-2 md:col-span-3 lg:col-span-4">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid aria-label="Tag selection">
            <mat-chip-row *ngFor="let tag of tags" (removed)="removeTag(tag)">
              {{tag}}
              <button matChipRemove [attr.aria-label]="'remove ' + tag">
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip-row>
            <input 
              placeholder="Add tags... (e.g., important, draft)" 
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              [matChipInputAddOnBlur]="true"
              (matChipInputTokenEnd)="addTag($event)">
          </mat-chip-grid>
          <mat-icon matSuffix>label</mat-icon>
        </mat-form-field>
        
        <div class="flex justify-start items-center gap-2 w-full sm:col-span-2 md:col-span-3 lg:col-span-4 pt-2">
          <button mat-stroked-button type="button" (click)="resetFilters()" class="min-w-[100px]">
            <mat-icon>clear_all</mat-icon>
            Clear
          </button>
          <button mat-raised-button type="submit" color="primary" class="min-w-[120px]">
            <mat-icon>filter_list</mat-icon>
            Apply Filters
          </button>
        </div>
      </div>
    </form>
  `
})
export class DocumentFiltersComponent implements OnInit {
  @Input() resourceTypes: ResourceType[] = [];
  @Output() filtersChanged = new EventEmitter<Partial<DocQuery>>();
  
  private fb = inject(FormBuilder);
  
  filterForm!: FormGroup;
  tags: string[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  permissionOptions = [
    { value: 'VIEW', label: 'View' },
    { value: 'EDIT', label: 'Edit' },
    { value: 'DELETE', label: 'Delete' }
  ];
  
  ngOnInit(): void {
    this.initFilterForm();
  }
  
  initFilterForm(): void {
    this.filterForm = this.fb.group({
      titleContains: [''],
      resourceCodeEquals: [''],
      resourceTypeIdEquals: [null],
      ownerIdEquals: [null],
      fromDate: [null],
      toDate: [null],
      perm: ['VIEW'], // Default to VIEW
      parentIdEquals: [null],
      topLevelOnly: [false]
    });

    // Disable parentIdEquals when topLevelOnly is true and vice versa
    this.filterForm.get('topLevelOnly')?.valueChanges.subscribe(value => {
      if (value) {
        this.filterForm.get('parentIdEquals')?.disable();
      } else {
        this.filterForm.get('parentIdEquals')?.enable();
      }
    });

    this.filterForm.get('parentIdEquals')?.valueChanges.subscribe(value => {
      if (value) {
        this.filterForm.get('topLevelOnly')?.disable();
      } else {
        this.filterForm.get('topLevelOnly')?.enable();
      }
    });
  }
  
  applyFilters(): void {
    if (this.filterForm.invalid) {
      return;
    }
    
    const formValue = this.filterForm.getRawValue(); // Get all values including disabled controls
    const filters: Partial<DocQuery> = {
      titleContains: formValue.titleContains || undefined,
      resourceCodeEquals: formValue.resourceCodeEquals || undefined,
      resourceTypeIdEquals: formValue.resourceTypeIdEquals || undefined,
      ownerIdEquals: formValue.ownerIdEquals ? Number(formValue.ownerIdEquals) : undefined,
      tags: this.tags.length > 0 ? this.tags.join(',') as any : undefined,
      perm: formValue.perm || 'VIEW'
    };
    
    // Handle parent document filtering
    if (formValue.topLevelOnly) {
      filters.parentIdEquals = 0; // Backend uses 0 or null to indicate no parent
    } else if (formValue.parentIdEquals) {
      filters.parentIdEquals = Number(formValue.parentIdEquals);
    }
    
    if (formValue.fromDate) {
      filters.fromDate = this.formatDate(formValue.fromDate);
    }
    
    if (formValue.toDate) {
      filters.toDate = this.formatDate(formValue.toDate);
    }
    
    // Remove undefined properties to keep query clean
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof Partial<DocQuery>] === undefined) {
        delete filters[key as keyof Partial<DocQuery>];
      }
    });

    this.filtersChanged.emit(filters);
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      titleContains: '',
      resourceCodeEquals: '',
      resourceTypeIdEquals: null,
      ownerIdEquals: null,
      fromDate: null,
      toDate: null,
      perm: 'VIEW',
      parentIdEquals: null,
      topLevelOnly: false
    });
    this.tags = [];
    this.filtersChanged.emit({}); // Emit empty object to signal reset
  }
  
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    if (value) {
      this.tags.push(value);
    }
    
    event.chipInput!.clear();
  }
  
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }
  
  private formatDate(date: Date): string {
    // Ensure date is treated as local and not converted to UTC before formatting
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  trackById(index: number, item: ResourceType): number {
    return item.id;
  }
}
