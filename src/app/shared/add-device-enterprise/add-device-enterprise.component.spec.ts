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
      ciraConfigGuid: '',
      mpsUsername: 'admin'
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
      tags: ['']
    })
    expect(dialogCloseSpy).toHaveBeenCalled()
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
      mpsUsername: 'admin'
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

  it('should reset CIRA fields when CIRA is disabled', () => {
    component.form.patchValue({
      guid: 'test-guid-123',
      mpsUsername: 'customUser'
    })
    
    component.onCIRAChange(false)
    
    expect(component.form.get('guid')?.value).toBe('')
    expect(component.form.get('mpsUsername')?.value).toBe('admin')
  })

  it('should include guid but not mpsUsername in submitted device', () => {
    component.form.setValue({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTLS: false,
      allowSelfSigned: false,
      guid: 'test-guid-123',
      mpsUsername: 'customUser'
    })
    component.useCIRA = true
    component.submitForm()

    const submittedDevice = addDeviceSpy.calls.mostRecent().args[0]
    expect(submittedDevice.guid).toBe('test-guid-123')
    expect(submittedDevice.mpsUsername).toBeUndefined()
    expect(dialogCloseSpy).toHaveBeenCalled()
  })
})
