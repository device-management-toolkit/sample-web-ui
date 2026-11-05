/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddDeviceEnterpriseComponent } from './add-device-enterprise.component'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from '../../devices/devices.service'
import { of, throwError } from 'rxjs'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatChipsModule } from '@angular/material/chips'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSnackBar } from '@angular/material/snack-bar'
import { provideTranslateService } from '@ngx-translate/core'

describe('AddDeviceEnterpriseComponent', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>
  let addDeviceSpy: MockInstance
  let dialogCloseSpy: MockInstance
  beforeEach(() => {
    const deviceService = createSpyObj('DevicesService', ['addDevice'])
    addDeviceSpy = deviceService.addDevice.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatChipsModule,
        AddDeviceEnterpriseComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: deviceService },
        { provide: MAT_DIALOG_DATA, useValue: { tags: [''] } },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    })
    fixture = TestBed.createComponent(AddDeviceEnterpriseComponent)
    component = fixture.componentInstance
    dialogCloseSpy = vi.spyOn(component.dialog, 'close').mockImplementation(() => undefined)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should treat a device without a guid as a new direct-connect device', () => {
    expect(component.isEdit).toBe(false)
    expect(component.isCIRA).toBe(false)
    expect(component.form.enabled).toBe(true)
  })

  it('should default useTLS and allowSelfSigned to true', () => {
    expect(component.form.get('useTLS')?.value).toBe(true)
    expect(component.form.get('allowSelfSigned')?.value).toBe(true)
  })

  it('should submit form when valid', () => {
    component.form.setValue({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: true,
      allowSelfSigned: true
    })
    component.submitForm()

    expect(addDeviceSpy).toHaveBeenCalledWith({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: true,
      allowSelfSigned: true,
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
      useTLS: true,
      allowSelfSigned: true
    })
    component.submitForm()

    expect(addDeviceSpy).not.toHaveBeenCalled()
    expect(dialogCloseSpy).not.toHaveBeenCalled()
  })
})

describe('AddDeviceEnterpriseComponent with existing device', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>

  beforeEach(() => {
    const deviceService = createSpyObj('DevicesService', ['addDevice', 'editDevice'])
    deviceService.addDevice.mockReturnValue(of({}))
    deviceService.editDevice.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatChipsModule,
        AddDeviceEnterpriseComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: deviceService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            hostname: 'test-device.local',
            friendlyName: 'Existing Device',
            username: 'admin',
            password: 'testpass',
            useTLS: false,
            allowSelfSigned: false,
            guid: 'test-guid-456',
            connectionType: 'Direct',
            tags: ['existing']
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

  it('should preserve loaded TLS values instead of applying the defaults', () => {
    expect(component.form.get('useTLS')?.value).toBe(false)
    expect(component.form.get('allowSelfSigned')?.value).toBe(false)
  })

  it('should keep every field editable for a direct-connect device', () => {
    expect(component.isEdit).toBe(true)
    expect(component.isCIRA).toBe(false)
    expect(component.form.enabled).toBe(true)
  })
})

describe('AddDeviceEnterpriseComponent with CIRA device', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>
  let editDeviceSpy: MockInstance
  let dialogCloseSpy: MockInstance

  const configure = (data: Record<string, unknown>): void => {
    const deviceService = createSpyObj('DevicesService', ['addDevice', 'editDevice'])
    deviceService.addDevice.mockReturnValue(of({}))
    editDeviceSpy = deviceService.editDevice.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatCheckboxModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatChipsModule,
        AddDeviceEnterpriseComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: deviceService },
        { provide: MAT_DIALOG_DATA, useValue: data },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    })
    fixture = TestBed.createComponent(AddDeviceEnterpriseComponent)
    component = fixture.componentInstance
    dialogCloseSpy = vi.spyOn(component.dialog, 'close').mockImplementation(() => undefined)
    fixture.detectChanges()
  }

  beforeEach(() => {
    configure({
      hostname: '10.0.0.5',
      friendlyName: 'CIRA Device',
      username: 'admin',
      mpsusername: 'admin',
      connectionType: 'CIRA',
      guid: 'cira-guid-789',
      tags: ['existing']
    })
  })

  it('should make the device details read-only', () => {
    expect(component.isEdit).toBe(true)
    expect(component.isCIRA).toBe(true)
    expect(component.form.disabled).toBe(true)
    expect(fixture.nativeElement.querySelector('[data-cy="ciraReadOnly"]')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('input[title="password"]')).toBeNull()
  })

  it('should only send the guid and tags on submit', () => {
    component.tags.set(['existing', 'floor-2'])
    component.submitForm()

    expect(editDeviceSpy).toHaveBeenCalledWith({ guid: 'cira-guid-789', tags: ['existing', 'floor-2'] })
    expect(dialogCloseSpy).toHaveBeenCalledWith({ submitted: true })
  })

  it('should treat a legacy row with an MPS username but no connectionType as CIRA', () => {
    TestBed.resetTestingModule()
    configure({ guid: 'legacy-guid', mpsusername: 'admin', tags: [] })

    expect(component.isCIRA).toBe(true)
    expect(component.form.disabled).toBe(true)
  })
})

describe('AddDeviceEnterpriseComponent when Console rejects the device', () => {
  let component: AddDeviceEnterpriseComponent
  let dialogCloseSpy: MockInstance
  let snackBarOpenSpy: MockInstance

  beforeEach(() => {
    const deviceService = createSpyObj('DevicesService', ['addDevice'])
    deviceService.addDevice.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'could not connect to 10.0.0.5 to read the AMT UUID' } }))
    )
    const snackBar = createSpyObj('MatSnackBar', ['open'])
    snackBarOpenSpy = snackBar.open

    TestBed.configureTestingModule({
      imports: [AddDeviceEnterpriseComponent],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: deviceService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MAT_DIALOG_DATA, useValue: { tags: [] } },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ]
    })
    const fixture = TestBed.createComponent(AddDeviceEnterpriseComponent)
    component = fixture.componentInstance
    dialogCloseSpy = vi.spyOn(component.dialog, 'close').mockImplementation(() => undefined)
    fixture.detectChanges()
  })

  it('shows the server message and keeps the dialog open', () => {
    component.form.setValue({
      hostname: '10.0.0.5',
      friendlyName: 'Unreachable',
      username: 'admin',
      password: 'P@ssw0rd',
      tenantId: '',
      useTLS: true,
      allowSelfSigned: true
    })
    component.submitForm()

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'could not connect to 10.0.0.5 to read the AMT UUID',
      expect.any(String),
      expect.anything()
    )
    expect(dialogCloseSpy).not.toHaveBeenCalled()
  })
})
