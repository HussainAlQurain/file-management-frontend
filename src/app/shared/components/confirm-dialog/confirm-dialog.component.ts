import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info' | 'success';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <div class="confirm-dialog p-2">
      <div class="flex items-start mb-4">
        <nz-icon 
          [nzType]="getIcon()" 
          [class]="getIconColor()"
          class="text-2xl mr-3 mt-1">
        </nz-icon>
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2">{{ data.title }}</h3>
          <p class="text-gray-600">{{ data.message }}</p>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 mt-6">
        <button 
          nz-button 
          nzType="default" 
          (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          nz-button 
          [nzType]="data.type === 'error' ? 'primary' : 'primary'"
          [nzDanger]="data.type === 'error'"
          (click)="onConfirm()">
          <nz-icon [nzType]="getConfirmIcon()"></nz-icon>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.modal.close(true);
  }

  onCancel(): void {
    this.modal.close(false);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning':
        return 'exclamation-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'info-circle';
      case 'success':
        return 'check-circle';
      default:
        return 'question-circle';
    }
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'info':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  getConfirmIcon(): string {
    switch (this.data.type) {
      case 'error':
        return 'delete';
      default:
        return 'check';
    }
  }
}
