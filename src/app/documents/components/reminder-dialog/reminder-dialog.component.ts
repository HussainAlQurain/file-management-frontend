import { Component, inject, OnInit, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReminderDTO } from '../../../core/services/reminder.service';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, of } from 'rxjs';

// NG-ZORRO imports
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';

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
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSelectModule,
    NzIconModule,
    NzSpaceModule
  ],
  template: `
    <div class="reminder-dialog">
      <h3 nz-typography>{{ data.reminder ? 'Edit Reminder' : 'Add Reminder' }}</h3>
      
      <form nz-form [nzLayout]="'vertical'" [formGroup]="form" (ngSubmit)="onSave()">
        <!-- Message Field -->
        <nz-form-item>
          <nz-form-label nzRequired>Message</nz-form-label>
          <nz-form-control nzErrorTip="Please enter a reminder message">
            <textarea 
              nz-input 
              formControlName="message" 
              [nzAutosize]="{ minRows: 2, maxRows: 4 }"
              placeholder="Enter reminder message">
            </textarea>
          </nz-form-control>
        </nz-form-item>

        <!-- Remind Date Field -->
        <nz-form-item>
          <nz-form-label nzRequired>Remind Date</nz-form-label>
          <nz-form-control nzErrorTip="Please select a remind date">
            <nz-date-picker 
              formControlName="remindAt"
              nzFormat="yyyy-MM-dd"
              nzPlaceHolder="Select date"
              nzShowTime
              style="width: 100%;">
            </nz-date-picker>
          </nz-form-control>
        </nz-form-item>

        <!-- User Selection -->
        <nz-form-item>
          <nz-form-label nzRequired>User</nz-form-label>
          <nz-form-control nzErrorTip="Please select a user">
            <nz-select 
              formControlName="userId" 
              nzPlaceHolder="Select user"
              nzShowSearch
              style="width: 100%;">
              <nz-option 
                *ngFor="let user of users$ | async" 
                [nzValue]="user.id" 
                [nzLabel]="user.username + ' (' + user.email + ')'">
              </nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Action Buttons -->
        <nz-form-item style="margin-top: 24px;">
          <nz-space>
            <button *nzSpaceItem nz-button nzType="default" type="button" (click)="onCancel()">
              Cancel
            </button>
            <button *nzSpaceItem nz-button nzType="primary" type="submit" [disabled]="form.invalid">
              <span nz-icon nzType="check" nzTheme="outline"></span>
              Save Reminder
            </button>
          </nz-space>
        </nz-form-item>
      </form>
    </div>
  `,
  styles: [`
    .reminder-dialog {
      padding: 8px;
    }

    ::ng-deep .ant-form-item {
      margin-bottom: 16px;
    }

    ::ng-deep .ant-form-item:last-child {
      margin-bottom: 0;
    }
  `]
})
export class ReminderDialogComponent implements OnInit {
  form: FormGroup;
  users$: Observable<UserDTO[]> = of([]);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private modal = inject(NzModalRef);

  constructor(
    private fb: FormBuilder,
    @Inject(NZ_MODAL_DATA) public data: ReminderDialogData
  ) {
    const currentUser = this.auth.currentUserSignal();
    
    // Parse existing reminder data
    let existingDate: Date | null = null;
    let defaultUserId: number | null = null;
    
    if (this.data.reminder?.remindAt) {
      existingDate = new Date(this.data.reminder.remindAt);
    }
    
    // Set default user ID
    if (this.data.reminder?.userId) {
      defaultUserId = this.data.reminder.userId;
    } else if (!this.data.isAdmin && currentUser?.id) {
      defaultUserId = currentUser.id;
    }

    this.form = this.fb.group({
      message: [this.data.reminder?.message || '', Validators.required],
      remindAt: [existingDate, Validators.required],
      userId: [defaultUserId, Validators.required],
    });
  }

  ngOnInit(): void {
    // Always load users - admin can assign to anyone, regular users can see themselves
    if (this.data.isAdmin) {
      this.users$ = this.userService.getAllUsers();
    } else {
      // For non-admin users, show only themselves
      const currentUser = this.auth.currentUserSignal();
      if (currentUser) {
        this.users$ = of([{
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email
        } as UserDTO]);
      }
    }
  }

  onSave() {
    if (this.form.invalid) return;
    
    const formValue = this.form.value;
    let remindAt: Date;
    
    // Handle date/time
    if (formValue.remindAt) {
      remindAt = new Date(formValue.remindAt);
      // If no time was set, default to 9:00 AM
      if (remindAt.getHours() === 0 && remindAt.getMinutes() === 0) {
        remindAt.setHours(9, 0, 0, 0);
      }
    } else {
      return; // Should not happen due to validation
    }

    const reminder: ReminderDTO = {
      ...this.data.reminder,
      message: formValue.message,
      remindAt: remindAt.toISOString(),
      userId: formValue.userId,
      documentId: this.data.documentId ?? this.data.reminder?.documentId
    };
    
    this.modal.close(reminder);
  }

  onCancel() {
    this.modal.close();
  }
} 