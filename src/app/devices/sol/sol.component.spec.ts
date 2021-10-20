import { Component, EventEmitter, Input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import { MomentModule } from 'ngx-moment'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from 'src/app/shared/shared.module'
import { RouterTestingModule } from '@angular/router/testing'
import { AuthService } from 'src/app/auth.service'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let reqUserConsentCodeSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getPowerState', 'setAmtFeatures', 'getAMTFeatures', 'reqUserConsentCode', 'cancelUserConsentCode'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    const authService = jasmine.createSpyObj('AuthService', ['getLoggedUserToken'])
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of({}))
    reqUserConsentCodeSpy = devicesService.reqUserConsentCode.and.returnValue(of({}))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    tokenSpy = authService.getLoggedUserToken.and.returnValue('123')
    const authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      startwebSocket: new EventEmitter<boolean>(false)
    }

    @Component({
      selector: 'app-device-toolbar'
    })
    class TestDeviceToolbarComponent {
      @Input()
      isLoading = false

      @Input()
      deviceState: number = 0
    }

    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [SolComponent, TestDeviceToolbarComponent],
      providers: [{ provide: DevicesService, useValue: { ...devicesService, ...authServiceStub } }, {
        provide: ActivatedRoute,
        useValue:
          { params: of({ id: 'guid' }) }
      }, { provide: AuthService, useValue: authService }]
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
    expect(tokenSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).toHaveBeenCalled()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
})
