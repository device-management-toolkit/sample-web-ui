import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getDeviceSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['sendPowerAction', 'getDevice'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of(
      {
        Body: {
          ReturnValueStr: 'NOT_READY'
        }
      }))
    getDeviceSpy = devicesService.getDevice.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      declarations: [DeviceToolbarComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      providers: [{ provide: DevicesService, useValue: devicesService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceToolbarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDeviceSpy).toHaveBeenCalledWith('guid')
  })
  it('should send power action', () => {
    component.sendPowerAction(4)

    fixture.detectChanges()

    expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 4, false)
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })
})
