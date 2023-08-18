import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivingEditComponent } from './receiving-edit.component';

describe('ReceivingEditComponent', () => {
  let component: ReceivingEditComponent;
  let fixture: ComponentFixture<ReceivingEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReceivingEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceivingEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
