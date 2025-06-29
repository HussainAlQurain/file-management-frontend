import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-async-btn',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <button 
      nz-button 
      [nzType]="type || 'default'"
      [nzSize]="size || 'default'"
      [nzDanger]="danger"
      [nzGhost]="ghost"
      [nzLoading]="isLoading"
      [disabled]="disabled || isLoading"
      [type]="buttonType || 'button'"
      [class]="customClass">
      @if (isLoading) {
        <!-- Loading state is handled by nzLoading -->
      } @else if (icon) {
        <nz-icon [nzType]="icon" [nzTheme]="iconTheme || 'outline'"></nz-icon>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class AsyncBtnComponent {
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: 'primary' | 'default' | 'dashed' | 'text' | 'link' = 'default';
  @Input() size: 'large' | 'default' | 'small' = 'default';
  @Input() danger: boolean = false;
  @Input() ghost: boolean = false;
  @Input() icon: string = '';
  @Input() iconTheme: 'outline' | 'fill' | 'twotone' = 'outline';
  @Input() buttonType: 'button' | 'submit' | 'reset' = 'button';
  @Input() customClass: string = '';
}
