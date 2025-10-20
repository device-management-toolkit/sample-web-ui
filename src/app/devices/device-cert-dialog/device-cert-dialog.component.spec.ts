import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceCertDialogComponent } from './device-cert-dialog.component'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { TranslateModule } from '@ngx-translate/core'

describe('DeviceCertDialogComponent', () => {
  let component: DeviceCertDialogComponent
  let fixture: ComponentFixture<DeviceCertDialogComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeviceCertDialogComponent>>

  beforeEach(() => {
    const spyDevicesService = jasmine.createSpyObj('DevicesService', [
      'pinDeviceCertificate',
      'deleteDeviceCertificate'
    ])
    const spySnackBar = jasmine.createSpyObj('MatSnackBar', ['open'])
    const spyDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'])

    TestBed.configureTestingModule({
      imports: [DeviceCertDialogComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DevicesService, useValue: spyDevicesService },
        { provide: MatSnackBar, useValue: spySnackBar },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { certData: { guid: 'test-guid', sha256Fingerprint: 'test-fingerprint' }, isPinned: false }
        },
        { provide: MatDialogRef, useValue: spyDialogRef }
      ]
    })

    fixture = TestBed.createComponent(DeviceCertDialogComponent)
    component = fixture.componentInstance
    devicesServiceSpy = TestBed.inject(DevicesService) as jasmine.SpyObj<DevicesService>
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DeviceCertDialogComponent>>
  })

  it('should pin the device certificate and show a success message', () => {
    devicesServiceSpy.pinDeviceCertificate.and.returnValue(of(null))

    component.pin()

    expect(devicesServiceSpy.pinDeviceCertificate).toHaveBeenCalledWith('test-guid', 'test-fingerprint')
    expect(snackBarSpy.open).toHaveBeenCalledWith('Certificate pinned', 'Close', SnackbarDefaults.defaultSuccess)
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true)
  })

  it('should remove the device certificate and show a success message', () => {
    devicesServiceSpy.deleteDeviceCertificate.and.returnValue(of(null))

    component.remove()

    expect(devicesServiceSpy.deleteDeviceCertificate).toHaveBeenCalledWith('test-guid')
    expect(snackBarSpy.open).toHaveBeenCalledWith('Certificate removed', 'Close', SnackbarDefaults.defaultSuccess)
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false)
  })
})
