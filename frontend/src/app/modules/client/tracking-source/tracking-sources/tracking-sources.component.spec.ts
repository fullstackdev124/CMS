import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSourcesComponent } from './tracking-sources.component';

describe('TrackingSourcesComponent', () => {
  let component: TrackingSourcesComponent;
  let fixture: ComponentFixture<TrackingSourcesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingSourcesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
