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
import { of } from 'rxjs'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatChipsModule } from '@angular/material/chips'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
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
        NoopAnimationsModule,
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
        NoopAnimationsModule,
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
})
