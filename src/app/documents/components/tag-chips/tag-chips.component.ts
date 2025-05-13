import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-tag-chips',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule, MatFormFieldModule],
  template: `
    <div class="tag-chips">
      @if (readonly) {
        @if (tags.length) {
          <div class="flex flex-wrap gap-1">
            @for (tag of tags; track tag) {
              <mat-chip color="primary" selected>{{ tag }}</mat-chip>
            }
          </div>
        } @else {
          <div class="text-gray-500">No tags</div>
        }
      } @else {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid>
            @for (tag of tags; track tag) {
              <mat-chip-row (removed)="removeTag(tag)">
                {{ tag }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
            <input
              placeholder="Add tags..."
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              [matChipInputAddOnBlur]="addOnBlur"
              (matChipInputTokenEnd)="addTag($event)">
          </mat-chip-grid>
        </mat-form-field>
      }
    </div>
  `
})
export class TagChipsComponent {
  @Input() tags: string[] = [];
  @Input() readonly = false;
  @Input() addOnBlur = true;
  
  @Output() tagsChange = new EventEmitter<string[]>();
  
  separatorKeysCodes: number[] = [ENTER, COMMA];
  
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    // Add the tag
    if (value) {
      if (!this.tags.includes(value)) {
        this.tags = [...this.tags, value];
        this.tagsChange.emit(this.tags);
      }
    }
    
    // Reset the input value
    event.chipInput!.clear();
  }
  
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    
    if (index >= 0) {
      this.tags = this.tags.filter(t => t !== tag);
      this.tagsChange.emit(this.tags);
    }
  }
}
