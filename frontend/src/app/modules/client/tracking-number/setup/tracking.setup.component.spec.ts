import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSetupComponent } from './tracking.setup.component';

describe('TrackingSetupComponent', () => {
  let component: TrackingSetupComponent;
  let fixture: ComponentFixture<TrackingSetupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingSetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
