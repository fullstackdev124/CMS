import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SipGatewayAddComponent } from './sipgateway-add.component';

describe('SipGatewayAddComponent', () => {
  let component: SipGatewayAddComponent;
  let fixture: ComponentFixture<SipGatewayAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SipGatewayAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SipGatewayAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
