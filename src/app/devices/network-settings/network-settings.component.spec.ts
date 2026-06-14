import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NetworkSettingsComponent } from './network-settings.component'
import { DevicesService } from '../devices.service'
import { of } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'

describe('NetworkSettingsComponent', () => {
  let component: NetworkSettingsComponent
  let fixture: ComponentFixture<NetworkSettingsComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let dialogSpy: jasmine.SpyObj<MatDialog>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getNetworkSettings',
      'getWirelessState',
      'getWirelessProfileSync',
      'patchWiredNetworkSettings',
      'requestWirelessStateChange',
      'setWirelessProfileSync',
      'getWirelessProfiles',
      'addWirelessProfile',
      'updateWirelessProfile',
      'deleteWirelessProfile'
    ])
    devicesServiceSpy.getNetworkSettings.and.returnValue(
      of({
        wired: { ieee8021x: {} },
        wireless: {
          wifiNetworks: [],
          ieee8021xSettings: []
        }
      } as any)
    )
    devicesServiceSpy.getWirelessState.and.returnValue(of({ state: 'WifiEnabledS0SxAC' } as any))
    devicesServiceSpy.getWirelessProfileSync.and.returnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: true } as any)
    )
    devicesServiceSpy.patchWiredNetworkSettings.and.returnValue(of(void 0))
    devicesServiceSpy.requestWirelessStateChange.and.returnValue(of({ state: 'WifiEnabledS0SxAC' } as any))
    devicesServiceSpy.setWirelessProfileSync.and.returnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: true } as any)
    )
    devicesServiceSpy.getWirelessProfiles.and.returnValue(of([]))
    devicesServiceSpy.addWirelessProfile.and.returnValue(of(void 0))
    devicesServiceSpy.updateWirelessProfile.and.returnValue(of(void 0))
    devicesServiceSpy.deleteWirelessProfile.and.returnValue(of(void 0))
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<unknown>)
    TestBed.configureTestingModule({
      imports: [NetworkSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })

    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
