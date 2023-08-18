import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingDeleteComponent } from './tracking-delete.component';

describe('TrackingDeleteComponent', () => {
  let component: TrackingDeleteComponent;
  let fixture: ComponentFixture<TrackingDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
