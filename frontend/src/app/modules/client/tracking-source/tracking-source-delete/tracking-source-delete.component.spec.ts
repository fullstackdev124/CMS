import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSourceDeleteComponent } from './tracking-source-delete.component';

describe('TrackingSourceDeleteComponent', () => {
  let component: TrackingSourceDeleteComponent;
  let fixture: ComponentFixture<TrackingSourceDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingSourceDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingSourceDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
