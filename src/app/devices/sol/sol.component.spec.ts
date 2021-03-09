import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { SolComponent } from './sol.component'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolComponent],
      providers: [{
        provide: ActivatedRoute,
        useValue:
         { params: of({ id: 'guid' }) }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
