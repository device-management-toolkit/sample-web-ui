import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PowerAlertComponent } from './poweralert.component'

describe('PoweralertComponent', () => {
  let component: PowerAlertComponent
  let fixture: ComponentFixture<PowerAlertComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PowerAlertComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerAlertComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
