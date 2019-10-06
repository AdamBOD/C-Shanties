import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlCentreComponent } from './control-centre.component';

describe('ControlCentreComponent', () => {
  let component: ControlCentreComponent;
  let fixture: ComponentFixture<ControlCentreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ControlCentreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlCentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
