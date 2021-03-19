import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import { MomentModule } from 'ngx-moment'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from 'src/app/shared/shared.module'
import { RouterTestingModule } from '@angular/router/testing'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getPowerState', 'setAmtFeatures'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    const authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(),
      startwebSocket: new EventEmitter<boolean>()
    }
    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [SolComponent],
      providers: [{ provide: DevicesService, useValue: { ...devicesService, ...authServiceStub } }, {
        provide: ActivatedRoute,
        useValue:
          { params: of({ id: 'guid' }) }
      }],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
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
    expect(getPowerStateSpy).toHaveBeenCalledWith('guid')
    expect(setAmtFeaturesSpy).toHaveBeenCalledWith('guid')
  })
})
