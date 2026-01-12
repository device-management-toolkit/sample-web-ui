/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddDeviceEnterpriseComponent } from './add-device-enterprise.component'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from 'src/app/devices/devices.service'
import { of } from 'rxjs'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatChipsModule } from '@angular/material/chips'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateModule } from '@ngx-translate/core'

describe('AddDeviceEnterpriseComponent', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>
  let addDeviceSpy: jasmine.Spy
  let dialogCloseSpy: jasmine.Spy
  beforeEach(() => {
    const deviceService = jasmine.createSpyObj('DevicesService', ['addDevice'])
    addDeviceSpy = deviceService.addDevice.and.returnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatChipsModule,
        AddDeviceEnterpriseComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: deviceService },
        { provide: MAT_DIALOG_DATA, useValue: { tags: [''] } },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    })
    fixture = TestBed.createComponent(AddDeviceEnterpriseComponent)
    component = fixture.componentInstance
    dialogCloseSpy = spyOn(component.dialog, 'close')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
  it('should submit form when valid', () => {
    component.form.setValue({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: false,
      allowSelfSigned: false,
      guid: '',
      mpsusername: 'admin',
      mpspassword: ''
    })
    component.submitForm()

    expect(addDeviceSpy).toHaveBeenCalledWith({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: false,
      allowSelfSigned: false,
      guid: '',
      tags: ['']
    })
    expect(dialogCloseSpy).toHaveBeenCalledWith({ submitted: true })
  })

  it('should not submit form when invalid', () => {
    component.form.setValue({
      hostname: '',
      friendlyName: '',
      username: '',
      password: '',
      tenantId: '',
      useTLS: false,
      allowSelfSigned: false,
      guid: '',
      mpsusername: 'admin',
      mpspassword: ''
    })
    component.submitForm()

    expect(addDeviceSpy).not.toHaveBeenCalled()
    expect(dialogCloseSpy).not.toHaveBeenCalled()
  })

  it('should toggle CIRA fields visibility', () => {
    expect(component.useCIRA).toBe(false)

    component.onCIRAChange(true)
    expect(component.useCIRA).toBe(true)

    component.onCIRAChange(false)
    expect(component.useCIRA).toBe(false)
  })

  it('should reset MPS fields but preserve guid when CIRA is disabled', () => {
    component.form.patchValue({
      guid: 'test-guid-123',
      mpsusername: 'customUser'
    })

    component.onCIRAChange(false)

    expect(component.form.get('guid')?.value).toBe('test-guid-123')
    expect(component.form.get('mpsusername')?.value).toBe('admin')
  })

  it('should include guid and mpsusername as admin in submitted CIRA device', () => {
    component.form.setValue({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: false,
      allowSelfSigned: false,
      guid: 'test-guid-123',
      mpsusername: 'customUser',
      mpspassword: ''
    })
    component.useCIRA = true
    component.submitForm()

    const submittedDevice = addDeviceSpy.calls.mostRecent().args[0]
    expect(submittedDevice.guid).toBe('test-guid-123')
    expect(submittedDevice.mpsusername).toBe('admin')
    expect(dialogCloseSpy).toHaveBeenCalledWith({ submitted: true })
  })

  it('should disable TLS options and username when CIRA is enabled', () => {
    component.onCIRAChange(true)

    expect(component.form.get('useTLS')?.disabled).toBe(true)
    expect(component.form.get('allowSelfSigned')?.disabled).toBe(true)
    expect(component.form.get('username')?.disabled).toBe(true)
    expect(component.form.get('useTLS')?.value).toBe(false)
    expect(component.form.get('allowSelfSigned')?.value).toBe(false)
    expect(component.form.get('username')?.value).toBe('admin')
  })

  it('should enable TLS options and username when CIRA is disabled', () => {
    component.onCIRAChange(true)
    component.onCIRAChange(false)

    expect(component.form.get('useTLS')?.disabled).toBe(false)
    expect(component.form.get('allowSelfSigned')?.disabled).toBe(false)
    expect(component.form.get('username')?.disabled).toBe(false)
  })

  it('should set useCIRA when device has mpsusername', () => {
    // This is tested via constructor behavior with MAT_DIALOG_DATA
    // Mocking would require a different test setup
    expect(component).toBeTruthy()
  })
})

describe('AddDeviceEnterpriseComponent with CIRA device', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>

  beforeEach(() => {
    const deviceService = jasmine.createSpyObj('DevicesService', ['addDevice', 'editDevice'])
    deviceService.addDevice.and.returnValue(of({}))
    deviceService.editDevice.and.returnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatChipsModule,
        AddDeviceEnterpriseComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: deviceService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            hostname: 'test-device.local',
            friendlyName: 'Test CIRA Device',
            username: 'admin',
            password: 'testpass',
            guid: 'test-guid-123',
            mpsusername: 'admin',
            tags: ['cira']
          }
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {
              /* empty */
            }
          }
        }
      ]
    })
    fixture = TestBed.createComponent(AddDeviceEnterpriseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should enable CIRA mode when device has mpsusername populated', () => {
    expect(component.useCIRA).toBe(true)
  })

  it('should disable TLS and username fields when CIRA device is loaded', () => {
    expect(component.form.get('useTLS')?.disabled).toBe(true)
    expect(component.form.get('allowSelfSigned')?.disabled).toBe(true)
    expect(component.form.get('username')?.disabled).toBe(true)
    expect(component.form.get('mpsusername')?.disabled).toBe(true)
  })

  it('should preserve guid value for CIRA device', () => {
    expect(component.form.get('guid')?.value).toBe('test-guid-123')
  })
})
