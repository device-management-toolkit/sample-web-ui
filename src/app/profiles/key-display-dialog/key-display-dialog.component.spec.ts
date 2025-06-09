import { ComponentFixture, TestBed } from '@angular/core/testing'

import { KeyDisplayDialogComponent } from './key-display-dialog.component'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

describe('KeyDisplayDialogComponent', () => {
  let component: KeyDisplayDialogComponent
  let fixture: ComponentFixture<KeyDisplayDialogComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { key: 'test' }
        }
      ],
      imports: [KeyDisplayDialogComponent, MatDialogModule]
    })

    fixture = TestBed.createComponent(KeyDisplayDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
