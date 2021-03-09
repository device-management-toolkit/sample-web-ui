import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerUpAlertComponent } from './power-up-alert.component';

describe('PowerUpAlertComponent', () => {
  let component: PowerUpAlertComponent;
  let fixture: ComponentFixture<PowerUpAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PowerUpAlertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerUpAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
