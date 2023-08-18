import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { SipGatewayDeleteComponent } from './sipgateway-delete.component'

describe('SipGatewayDeleteComponent', () => {
  let component: SipGatewayDeleteComponent
  let fixture: ComponentFixture<SipGatewayDeleteComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SipGatewayDeleteComponent ]
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SipGatewayDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
