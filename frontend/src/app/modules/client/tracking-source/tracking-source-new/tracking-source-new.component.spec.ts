import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSourceNewComponent } from './tracking-source-new.component';

describe('TrackingSourceNewComponent', () => {
  let component: TrackingSourceNewComponent;
  let fixture: ComponentFixture<TrackingSourceNewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingSourceNewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingSourceNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
