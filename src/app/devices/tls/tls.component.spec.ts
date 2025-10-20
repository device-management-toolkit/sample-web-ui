import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TLSComponent } from './tls.component'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { TranslateModule } from '@ngx-translate/core'

describe('TLSComponent', () => {
  let component: TLSComponent
  let fixture: ComponentFixture<TLSComponent>
  let mockDevicesService: any
  let mockSnackBar: any
  const mockTLSData = [{}, {}]

  beforeEach(() => {
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['getTLSSettings'])
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatDividerModule,
        TLSComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(TLSComponent)
    component = fixture.componentInstance

    fixture.componentRef.setInput('deviceId', 'test-device-id')
    mockDevicesService.getTLSSettings.and.returnValue(of(mockTLSData))
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call getTLSSettings on ngOnInit and set tlsData', () => {
    component.ngOnInit()

    expect(mockDevicesService.getTLSSettings).toHaveBeenCalledWith('test-device-id')
    expect(component.tlsData).toEqual(mockTLSData)
    expect(component.isLoading()).toBeFalse()
  })
})
