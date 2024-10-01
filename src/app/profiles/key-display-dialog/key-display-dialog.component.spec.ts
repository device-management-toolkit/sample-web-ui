import { ComponentFixture, TestBed } from '@angular/core/testing'

import { KeyDisplayDialogComponent } from './key-display-dialog.component'

describe('KeyDisplayDialogComponent', () => {
  let component: KeyDisplayDialogComponent
  let fixture: ComponentFixture<KeyDisplayDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyDisplayDialogComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(KeyDisplayDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
