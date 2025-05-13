import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  readonly loading = signal<boolean>(false);
  private requestCount = 0;
  
  show(): void {
    this.requestCount++;
    this.loading.set(true);
  }
  
  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loading.set(false);
    }
  }
}
