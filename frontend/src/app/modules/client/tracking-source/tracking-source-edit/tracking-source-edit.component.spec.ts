import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSourceEditComponent } from './tracking-source-edit.component';

describe('TrackingSourceEditComponent', () => {
  let component: TrackingSourceEditComponent;
  let fixture: ComponentFixture<TrackingSourceEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingSourceEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingSourceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
