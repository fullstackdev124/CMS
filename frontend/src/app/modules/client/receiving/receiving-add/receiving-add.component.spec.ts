import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivingAddComponent } from './receiving-add.component';

describe('ReceivingAddComponent', () => {
  let component: ReceivingAddComponent;
  let fixture: ComponentFixture<ReceivingAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceivingAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceivingAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
