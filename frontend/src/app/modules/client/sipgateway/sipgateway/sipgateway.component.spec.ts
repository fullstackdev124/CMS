import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SipGatewaysComponent } from './sipgateway.component';

describe('SipGatewaysComponent', () => {
  let component: SipGatewaysComponent;
  let fixture: ComponentFixture<SipGatewaysComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SipGatewaysComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SipGatewaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
