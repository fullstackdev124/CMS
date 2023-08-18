import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SipGatewayEditComponent } from './sipgateway-edit.component';

describe('SipGatewayEditComponent', () => {
  let component: SipGatewayEditComponent;
  let fixture: ComponentFixture<SipGatewayEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SipGatewayEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SipGatewayEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
