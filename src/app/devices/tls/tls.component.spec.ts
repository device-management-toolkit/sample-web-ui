import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TLSComponent } from './tls.component'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'

describe('TLSComponent', () => {
  let component: TLSComponent
  let fixture: ComponentFixture<TLSComponent>
  let mockDevicesService: any
  let mockSnackBar: any

  beforeEach(async () => {
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['getTLSSettings'])
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open'])

    await TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatDividerModule,
        TLSComponent
      ],
      providers: [
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(TLSComponent)
    component = fixture.componentInstance
    component.deviceId = 'test-device-id'
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call getTLSSettings on ngOnInit and set tlsData', () => {
    const mockTLSData = [{}, {}]
    mockDevicesService.getTLSSettings.and.returnValue(of(mockTLSData))

    fixture.detectChanges() // Triggers ngOnInit

    expect(mockDevicesService.getTLSSettings).toHaveBeenCalledWith('test-device-id')
    expect(component.tlsData).toEqual(mockTLSData)
    expect(component.isLoading).toBeFalse()
  })

  it('should set isLoading to false after request completes', () => {
    mockDevicesService.getTLSSettings.and.returnValue(of([{}]))

    fixture.detectChanges() // Triggers ngOnInit

    expect(component.isLoading).toBeFalse()
  })
})
