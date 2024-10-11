import { ComponentFixture, TestBed } from '@angular/core/testing'

import { KeyDisplayDialogComponent } from './key-display-dialog.component'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

describe('KeyDisplayDialogComponent', () => {
  let component: KeyDisplayDialogComponent
  let fixture: ComponentFixture<KeyDisplayDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { key: 'test' }
        }
      ],
      imports: [KeyDisplayDialogComponent, MatDialogModule]
    }).compileComponents()

    fixture = TestBed.createComponent(KeyDisplayDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
