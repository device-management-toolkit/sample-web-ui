import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { MomentModule } from 'ngx-moment'
// import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'

import { DeviceUserConsentComponent } from './device-user-consent.component'

describe('DeviceUserConsentComponent', () => {
  let component: DeviceUserConsentComponent
  let fixture: ComponentFixture<DeviceUserConsentComponent>
  // let sendUserConsentCodeSpy: jasmine.Spy
  // let cancelUserConsentCodeSpy: jasmine.Spy
  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['sendUserConsentCode', 'cancelUserConsentCode'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    // sendUserConsentCodeSpy = devicesService.sendUserConsentCode.and.returnValue(of({}))
    // cancelUserConsentCodeSpy = devicesService.cancelUserConsentCode.and.returnValue(of({ }))
    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DeviceUserConsentComponent],
      providers: [{ provide: DevicesService, useValue: devicesService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceUserConsentComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    // expect(cancelUserConsentCodeSpy).toHaveBeenCalledWith('guid')
    // expect(sendUserConsentCodeSpy).toHaveBeenCalledWith('guid', 123567)
  })
})
