import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivingDeleteComponent } from './receiving-delete.component';

describe('ReceivingDeleteComponent', () => {
  let component: ReceivingDeleteComponent;
  let fixture: ComponentFixture<ReceivingDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceivingDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceivingDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
