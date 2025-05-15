import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

import { ResourceTypeService } from '../../../core/services/resource-type.service';
import { ResourceType, FieldType, FieldDefinitionDto, CreateFieldDto, UpdateFieldDto, UpdateResourceTypeDto } from '../../../core/models/resource-type.model';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FieldDialogComponent, FieldDialogData } from '../components/field-dialog/field-dialog.component';


@Component({
  selector: 'app-resource-type-edit-page',
  standalone: true,  imports: [
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    DragDropModule
  ],
  template: `
    <div class="p-4 md:p-8">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="text-2xl font-semibold">
            @if (isLoadingDetails()) {
              <span>Loading Resource Type...</span>
            } @else if (resourceType()) {
              <span>Edit Resource Type: {{ resourceType()?.code }}</span>
            } @else {
              <span>Resource Type Not Found</span>
            }
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (isLoadingDetails()) {
            <div class="flex justify-center items-center py-12">
              <mat-spinner diameter="60"></mat-spinner>
            </div>
          } @else if (resourceTypeForm && resourceType()) {
            <form [formGroup]="resourceTypeForm" (ngSubmit)="onUpdateResourceTypeDetails()" class="space-y-6">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Code</mat-label>
                <input matInput formControlName="code" required readonly [matTooltip]="'Code cannot be changed after creation.'">
                @if (resourceTypeForm.get('code')?.hasError('required')) {
                  <mat-error>Code is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description (Optional)</mat-label>
                <textarea matInput formControlName="description" cdkTextareaAutosize cdkAutosizeMinRows="2" cdkAutosizeMaxRows="5"></textarea>
              </mat-form-field>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button mat-stroked-button routerLink="/admin/resource-types" type="button" [disabled]="isSubmittingDetails()">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="resourceTypeForm.invalid || isSubmittingDetails()">
                  @if(isSubmittingDetails()){
                    <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                    <span>Saving Details...</span>
                  } @else {
                    <span>Save Details</span>
                  }
                </button>
              </div>
            </form>

            <div class="border-t pt-6 mt-8">
              <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-medium">Fields</h3>
                  <button mat-stroked-button color="primary" type="button" (click)="openAddFieldDialog()">
                      <mat-icon>add</mat-icon> Add Field
                  </button>
              </div>
              @if(isLoadingFields()){
                <div class="flex justify-center items-center py-6">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              } @else {
                <div cdkDropList (cdkDropListDropped)="dropField($event)" class="space-y-4">
                  @for (field of currentFields(); track field.id; let i = $index) {
                    <div cdkDrag class="p-4 border rounded-md shadow-sm bg-gray-50 flex justify-between items-center">
                      <div class="flex-grow">
                        <p class="font-medium">{{field.label || field.name}} ({{field.kind}})</p>
                        <p class="text-sm text-gray-600">
                          Required: {{field.required ? 'Yes' : 'No'}}, 
                          Unique: {{field.uniqueWithinType ? 'Yes' : 'No'}}
                        </p>
                      </div>
                      <div>
                        <button mat-icon-button (click)="openEditFieldDialog(field)" matTooltip="Edit Field">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="removeField(field.id, field.label || field.name)" matTooltip="Remove Field">
                          <mat-icon>delete</mat-icon>
                        </button>
                         <button mat-icon-button cdkDragHandle matTooltip="Reorder Field">
                            <mat-icon>drag_indicator</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                  @if (!currentFields().length) {
                    <p class="text-gray-500 text-center py-4">No fields defined. Click "Add Field" to create one.</p>
                  }
                </div>
              }
            </div>

          } @else if (!isLoadingDetails() && !resourceType()) {
             <div class="text-center py-12">
                <mat-icon class="text-6xl text-gray-400">error_outline</mat-icon>
                <p class="text-xl text-gray-600 mt-4">Resource Type not found.</p>
                <p class="mt-2">The requested resource type could not be loaded or does not exist.</p>
                <button mat-stroked-button routerLink="/admin/resource-types" class="mt-6">Back to List</button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Placeholder for Add/Edit Field Dialog -->
    <!-- You would typically create a separate component for this dialog -->
    <!-- For simplicity, a basic structure might be handled here or in a template ref -->
  `
})
export class ResourceTypeEditPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceTypeService = inject(ResourceTypeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  public dialog = inject(MatDialog); // Public for template access if needed

  resourceTypeForm!: FormGroup;
  fieldTypes = Object.values(FieldType);
  FieldType = FieldType; // Make enum available in template
  
  resourceTypeId: WritableSignal<number | null> = signal(null);
  resourceType: WritableSignal<ResourceType | null> = signal(null);
  currentFields: WritableSignal<FieldDefinitionDto[]> = signal([]);
  
  isLoadingDetails = signal(true);
  isSubmittingDetails = signal(false);
  isLoadingFields = signal(false); // Separate loading for fields

  ngOnInit(): void {
    this.initResourceTypeForm();
    
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.resourceTypeId.set(+id);
          this.isLoadingDetails.set(true);
          return this.resourceTypeService.get(+id).pipe(
            catchError(err => {
              this.isLoadingDetails.set(false);
              this.resourceType.set(null);
              this.snackbar.error('Failed to load resource type details: ' + (err.error?.message || err.message));
              this.router.navigate(['/resource-types']);
              return of(null);
            })
          );
        } else {
          this.snackbar.error('No Resource Type ID provided.');
          this.router.navigate(['/resource-types']);
          return of(null);
        }
      })
    ).subscribe(data => {
      if (data) {
        this.resourceType.set(data);
        this.patchResourceTypeForm(data);
        this.currentFields.set([...data.fields]); // Initialize currentFields
        // Sort fields by order if 'order' property exists, otherwise use backend order
        // this.sortFields(); 
      }
      this.isLoadingDetails.set(false);
    });
  }

  initResourceTypeForm(): void {
    this.resourceTypeForm = this.fb.group({
      code: [{ value: '', disabled: true }, Validators.required], // Code is usually not editable
      description: [''],
    });
  }

  patchResourceTypeForm(resourceTypeData: ResourceType): void {
    this.resourceTypeForm.patchValue({
      code: resourceTypeData.code,
      description: resourceTypeData.description
    });
  }

  onUpdateResourceTypeDetails(): void {
    if (this.resourceTypeForm.invalid) {
      this.snackbar.error('Please fill all required fields correctly.');
      this.resourceTypeForm.markAllAsTouched();
      return;
    }
    const currentId = this.resourceTypeId();
    if (!currentId) {
        this.snackbar.error('Resource Type ID is missing. Cannot update.');
        return;
    }

    this.isSubmittingDetails.set(true);
    const formValue = this.resourceTypeForm.getRawValue(); // getRawValue for disabled fields like code
    
    const payload: UpdateResourceTypeDto = {
      description: formValue.description,
    };

    this.resourceTypeService.update(currentId, payload).pipe(
      finalize(() => this.isSubmittingDetails.set(false))
    ).subscribe({
      next: (updatedResourceType) => {
        this.resourceType.set(updatedResourceType);
        this.patchResourceTypeForm(updatedResourceType);
        this.snackbar.success(`Resource type "${updatedResourceType.code}" details updated successfully.`);
        // No navigation, user stays on page to manage fields
      },
      error: (err) => {
        this.snackbar.error('Failed to update resource type details: ' + (err.error?.message || err.message));
      }
    });
  }

  // Field Management Methods

  loadFieldsForCurrentType(): void { // Optional: if fields are not part of the main GET /resource-types/{id}
    const typeId = this.resourceTypeId();
    if (!typeId) return;
    this.isLoadingFields.set(true);
    // Assuming resourceType.fields is the source of truth after initial load.
    // If fields need to be fetched separately:
    // this.resourceTypeService.get(typeId).pipe( // or a specific getFields endpoint
    //   finalize(() => this.isLoadingFields.set(false))
    // ).subscribe(rt => {
    //   this.currentFields.set(rt.fields);
    //   this.sortFields();
    // });
    // For now, assume fields are part of this.resourceType()
    this.currentFields.set(this.resourceType()?.fields || []);
    // this.sortFields(); 
    this.isLoadingFields.set(false); 
  }
  
  // sortFields(): void {
  //   // Add sorting logic if an 'order' property is available on FieldDefinitionDto
  //   // this.currentFields.update(fields => [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  // }

  openAddFieldDialog(): void {
    const typeId = this.resourceTypeId();
    if (!typeId) return;

    const dialogRef = this.dialog.open(FieldDialogComponent, {
      width: '500px',
      data: { 
        action: 'add',
        resourceTypeId: typeId,
        title: 'Add New Field'
      } as FieldDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && typeof result !== 'boolean') {
        const newFieldDto: CreateFieldDto = result;
        this.isLoadingFields.set(true);
        
        this.resourceTypeService.addField(typeId, newFieldDto).pipe(
          finalize(() => this.isLoadingFields.set(false))
        ).subscribe({
          next: (addedField) => {
            this.currentFields.update(fields => [...fields, addedField]);
            this.snackbar.success(`Field "${addedField.name}" added successfully.`);
          },
          error: err => this.snackbar.error('Failed to add field: ' + (err.error?.message || err.message))
        });
      }
    });
  }

  openEditFieldDialog(fieldToEdit: FieldDefinitionDto): void {
    const typeId = this.resourceTypeId();
    if (!typeId) return;

    const dialogRef = this.dialog.open(FieldDialogComponent, {
      width: '500px',
      data: { 
        action: 'edit',
        resourceTypeId: typeId,
        field: fieldToEdit,
        title: `Edit Field: ${fieldToEdit.name}`
      } as FieldDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && typeof result !== 'boolean') {
        const updatedFieldDto: UpdateFieldDto = result;
        this.isLoadingFields.set(true);
        
        this.resourceTypeService.updateField(typeId, fieldToEdit.id, updatedFieldDto).pipe(
          finalize(() => this.isLoadingFields.set(false))
        ).subscribe({
          next: (updatedField) => {
            this.currentFields.update(fields => fields.map(f => f.id === updatedField.id ? updatedField : f));
            this.snackbar.success(`Field "${updatedField.name}" updated successfully.`);
          },
          error: err => this.snackbar.error('Failed to update field: ' + (err.error?.message || err.message))
        });
      }
    });
  }

  removeField(fieldId: number, fieldName: string): void {
    const typeId = this.resourceTypeId();
    if (!typeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Confirm Deletion', 
        message: `Are you sure you want to delete field "${fieldName}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        dangerous: true
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoadingFields.set(true);
        this.resourceTypeService.removeField(typeId, fieldId).pipe(
          finalize(() => this.isLoadingFields.set(false))
        ).subscribe({
          next: () => {
            this.currentFields.update(fields => fields.filter(f => f.id !== fieldId));
            this.snackbar.success(`Field "${fieldName}" removed successfully.`);
          },
          error: err => this.snackbar.error('Failed to remove field: ' + (err.error?.message || err.message))
        });
      }
    });
  }

  dropField(event: CdkDragDrop<FieldDefinitionDto[]>) {
    const typeId = this.resourceTypeId();
    if (!typeId) {
      this.snackbar.error('Resource Type ID is missing. Cannot reorder fields.');
      return;
    }

    const updatedFields = [...this.currentFields()];
    moveItemInArray(updatedFields, event.previousIndex, event.currentIndex);
    
    // Optimistically update the UI
    this.currentFields.set(updatedFields);

    const fieldOrderPayload = updatedFields.map((field, index) => ({ id: field.id, order: index }));
    
    this.isLoadingFields.set(true); // Use isLoadingFields or a new signal for reordering

    this.resourceTypeService.updateFieldsOrder(typeId, fieldOrderPayload).pipe(
      finalize(() => this.isLoadingFields.set(false))
    ).subscribe({
      next: () => {
        this.snackbar.success('Field order updated successfully.');
        // Optionally, re-fetch the resource type or fields if the backend returns the updated state
        // or if there's a possibility of concurrent modifications.
        // For now, we assume the optimistic update is sufficient.
        // If re-fetching:
        // this.loadFieldsForCurrentType(); // or this.refreshResourceTypeDetails();
      },
      error: (err) => {
        this.snackbar.error('Failed to update field order: ' + (err.error?.message || err.message));
        // Revert to the previous order if the backend call fails
        // To do this, you might need to store the order before moveItemInArray
        // For simplicity, we're not reverting here, but it's good practice.
        // A quick way to revert if you had previousOrder: this.currentFields.set(previousOrder);
        // Consider re-fetching to get the true state from the server:
        this.loadFieldsForCurrentType(); // Re-fetch to ensure UI consistency
      }
    });
  }
}
