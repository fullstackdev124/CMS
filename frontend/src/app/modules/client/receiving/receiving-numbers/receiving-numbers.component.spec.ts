import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivingNumbersComponent } from './receiving-numbers.component';

describe('ReceivingNumbersComponent', () => {
  let component: ReceivingNumbersComponent;
  let fixture: ComponentFixture<ReceivingNumbersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceivingNumbersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceivingNumbersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
