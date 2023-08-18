import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SipgatewayOrderComponent } from './sipgateway-order.component';

describe('SipgatewayOrderComponent', () => {
  let component: SipgatewayOrderComponent;
  let fixture: ComponentFixture<SipgatewayOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SipgatewayOrderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SipgatewayOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
