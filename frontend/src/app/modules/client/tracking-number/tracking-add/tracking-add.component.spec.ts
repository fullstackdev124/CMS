import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingAddComponent } from './tracking-add.component';

describe('TrackingAddComponent', () => {
  let component: TrackingAddComponent;
  let fixture: ComponentFixture<TrackingAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
