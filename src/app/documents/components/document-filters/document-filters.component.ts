import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
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
    MatNativeDateModule,
    MatChipsModule
  ],
  template: `
    <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filters-form">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Search by title, content...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        
        <!-- Resource Type -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Resource Type</mat-label>
          <mat-select formControlName="resourceTypeId">
            <mat-option [value]="null">All</mat-option>
            @for (type of resourceTypes; track type.id) {
              <mat-option [value]="type.id">{{ type.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        
        <!-- Date Range -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>From Date</mat-label>
          <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" placeholder="From date">
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>To Date</mat-label>
          <input matInput [matDatepicker]="toPicker" formControlName="toDate" placeholder="To date">
          <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>
        
        <!-- Tags -->
        <mat-form-field appearance="outline" class="w-full md:col-span-3">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid aria-label="Tag selection">
            @for (tag of tags; track tag) {
              <mat-chip-row 
                (removed)="removeTag(tag)">
                {{tag}}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
            <input 
              placeholder="Add tags..." 
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              [matChipInputAddOnBlur]="true"
              (matChipInputTokenEnd)="addTag($event)">
          </mat-chip-grid>
        </mat-form-field>
        
        <!-- Buttons -->
        <div class="flex justify-end items-center gap-2">
          <button 
            mat-stroked-button 
            type="button" 
            color="warn" 
            (click)="resetFilters()">
            Clear
          </button>
          <button 
            mat-raised-button 
            type="submit" 
            color="primary">
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
  
  ngOnInit(): void {
    this.initFilterForm();
  }
  
  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      resourceTypeId: [null],
      fromDate: [null],
      toDate: [null]
    });
  }
  
  applyFilters(): void {
    if (this.filterForm.invalid) {
      return;
    }
    
    const formValue = this.filterForm.value;
    const filters: Partial<DocQuery> = {
      search: formValue.search || undefined,
      resourceTypeId: formValue.resourceTypeId || undefined,
      tags: this.tags.length > 0 ? this.tags : undefined
    };
    
    // Format dates if provided
    if (formValue.fromDate) {
      filters.fromDate = this.formatDate(formValue.fromDate);
    }
    
    if (formValue.toDate) {
      filters.toDate = this.formatDate(formValue.toDate);
    }
    
    this.filtersChanged.emit(filters);
  }
  
  resetFilters(): void {
    this.filterForm.reset();
    this.tags = [];
    this.filtersChanged.emit({});
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
    return date.toISOString().split('T')[0];
  }
}
