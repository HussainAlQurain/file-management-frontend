import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  
  private roles: string[] = [];
  private isVisible = false;
  
  @Input()
  set appHasRole(roles: string | string[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }
  
  private updateView(): void {
    const hasAnyRole = this.roles.some(role => this.authService.hasRole(role));
    
    if (hasAnyRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasAnyRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
