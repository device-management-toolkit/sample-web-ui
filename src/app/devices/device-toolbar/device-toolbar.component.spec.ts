import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getDeviceSpy: jasmine.Spy
  let deviceServiceStub: { stopwebSocket: { next: any } }
  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['sendPowerAction', 'getDevice'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({
      Body: {
        ReturnValueStr: 'NOT_READY'
      }
    }))
    getDeviceSpy = devicesService.getDevice.and.returnValue(of({}))

    deviceServiceStub = {
      stopwebSocket: { next: jasmine.createSpy('stopwebSocket next') }
    }

    await TestBed.configureTestingModule({
      declarations: [DeviceToolbarComponent],
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      providers: [{ provide: DevicesService, useValue: { ...deviceServiceStub, ...devicesService } }, {
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
  it('should navigate to', async () => {
    component.deviceId = '12345-pokli-456772'
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith([`/devices/${component.deviceId}/guid`])
  })
  it('should open the deactivate device dialog', () => {
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open')
    component.deactivateADevice()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('should stop sol ', () => {
    component.stopSol()
    fixture.detectChanges()
    expect(deviceServiceStub.stopwebSocket.next).toHaveBeenCalled()
  })
  it('should stop kvm', () => {
    component.stopKvm()
    fixture.detectChanges()
    expect(deviceServiceStub.stopwebSocket.next).toHaveBeenCalled()
  })
})
