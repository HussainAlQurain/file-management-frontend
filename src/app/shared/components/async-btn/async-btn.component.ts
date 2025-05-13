import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-async-btn',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-raised-button
      [color]="color"
      [disabled]="disabled || isLoading"
      [type]="type"
      (click)="onClick()"
      class="flex items-center justify-center gap-2"
    >
      <mat-spinner *ngIf="isLoading" [diameter]="20"></mat-spinner>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      min-width: 100px;
    }
  `]
})
export class AsyncBtnComponent {
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  
  @Output() btnClick = new EventEmitter<void>();
  
  onClick(): void {
    if (!this.isLoading && !this.disabled) {
      this.btnClick.emit();
    }
  }
}
