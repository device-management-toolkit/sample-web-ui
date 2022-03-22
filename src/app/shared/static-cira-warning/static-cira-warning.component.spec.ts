import { ComponentFixture, TestBed } from '@angular/core/testing'

import { StaticCIRAWarningComponent } from './static-cira-warning.component'

describe('StaticCIRAWarningComponent', () => {
  let component: StaticCIRAWarningComponent
  let fixture: ComponentFixture<StaticCIRAWarningComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaticCIRAWarningComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticCIRAWarningComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
