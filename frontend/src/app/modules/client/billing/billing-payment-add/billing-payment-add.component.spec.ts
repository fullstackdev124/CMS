import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingPaymentAddComponent } from './billing-payment-add.component';

describe('BillingPaymentAddComponent', () => {
  let component: BillingPaymentAddComponent;
  let fixture: ComponentFixture<BillingPaymentAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BillingPaymentAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillingPaymentAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
