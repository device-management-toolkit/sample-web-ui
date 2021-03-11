import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoweralertComponent } from './poweralert.component';

describe('PoweralertComponent', () => {
  let component: PoweralertComponent;
  let fixture: ComponentFixture<PoweralertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoweralertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PoweralertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
