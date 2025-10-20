import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NetworkSettingsComponent } from './network-settings.component'
import { DevicesService } from '../devices.service'
import { of } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'

describe('NetworkSettingsComponent', () => {
  let component: NetworkSettingsComponent
  let fixture: ComponentFixture<NetworkSettingsComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getNetworkSettings'
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
    TestBed.configureTestingModule({
      imports: [NetworkSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy }]
    })

    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
