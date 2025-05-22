import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReminderDTO } from '../../../core/services/reminder.service';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, of } from 'rxjs';

export interface ReminderDialogData {
  reminder?: ReminderDTO;
  documentId?: number;
  isAdmin: boolean;
}

@Component({
  selector: 'app-reminder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTimepickerModule,
    ReactiveFormsModule,
    MatDatepickerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.reminder ? 'Edit Reminder' : 'Add Reminder' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSave()" class="p-4 flex flex-col gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Message</mat-label>
        <textarea matInput formControlName="message" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Remind Date</mat-label>
        <input matInput [matDatepicker]="datePicker" formControlName="remindAt" required>
        <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
        <mat-datepicker #datePicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Remind Time (optional)</mat-label>
        <input matInput [matTimepicker]="timePicker" formControlName="remindAt">
        <mat-timepicker-toggle matIconSuffix [for]="timePicker"></mat-timepicker-toggle>
        <mat-timepicker #timePicker></mat-timepicker>
      </mat-form-field>
      <ng-container *ngIf="data.isAdmin">
        <mat-form-field appearance="outline">
          <mat-label>User</mat-label>
          <mat-select formControlName="userId" required>
            <mat-option *ngFor="let user of users$ | async" [value]="user.id">
              {{ user.username }} ({{ user.email }})
            </mat-option>
          </mat-select>
        </mat-form-field>
      </ng-container>
      <div class="flex gap-2 justify-end mt-4">
        <button mat-stroked-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `,
  styles: [``]
})
export class ReminderDialogComponent implements OnInit {
  form: FormGroup;
  users$: Observable<UserDTO[]> = of([]);
  private auth = inject(AuthService);
  private userService = inject(UserService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReminderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderDialogData
  ) {
    const currentUser = this.auth.currentUserSignal();
    this.form = this.fb.group({
      message: [data.reminder?.message || '', Validators.required],
      remindAt: [data.reminder ? new Date(data.reminder.remindAt) : '', Validators.required],
      userId: [data.reminder?.userId || (data.isAdmin ? '' : currentUser?.id), Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.data.isAdmin) {
      this.users$ = this.userService.getAllUsers();
    }
  }

  onSave() {
    if (this.form.invalid) return;
    let remindAt: Date = this.form.value.remindAt;
    if (remindAt && remindAt instanceof Date) {
      // If time is midnight (user didn't pick a time), set to 9:00 AM
      if (remindAt.getHours() === 0 && remindAt.getMinutes() === 0) {
        remindAt.setHours(9, 0, 0, 0);
      }
    }
    const reminder: ReminderDTO = {
      ...this.data.reminder,
      message: this.form.value.message,
      remindAt: remindAt ? remindAt.toISOString() : '',
      userId: this.form.value.userId,
      documentId: this.data.documentId ?? this.data.reminder?.documentId
    };
    this.dialogRef.close(reminder);
  }

  onCancel() {
    this.dialogRef.close();
  }
} 