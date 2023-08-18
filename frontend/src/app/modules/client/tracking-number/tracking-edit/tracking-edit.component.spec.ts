import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingEditComponent } from './tracking-edit.component';

describe('TrackingEditComponent', () => {
  let component: TrackingEditComponent;
  let fixture: ComponentFixture<TrackingEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
