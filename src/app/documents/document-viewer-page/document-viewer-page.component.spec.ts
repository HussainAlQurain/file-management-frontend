import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentViewerPageComponent } from './document-viewer-page.component';

describe('DocumentViewerPageComponent', () => {
  let component: DocumentViewerPageComponent;
  let fixture: ComponentFixture<DocumentViewerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentViewerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentViewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
