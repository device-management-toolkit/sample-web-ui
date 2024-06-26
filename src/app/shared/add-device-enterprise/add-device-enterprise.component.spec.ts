/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddDeviceEnterpriseComponent } from './add-device-enterprise.component'
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from 'src/app/devices/devices.service'
import { of } from 'rxjs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

describe('AddDeviceEnterpriseComponent', () => {
  let component: AddDeviceEnterpriseComponent
  let fixture: ComponentFixture<AddDeviceEnterpriseComponent>
  let addDeviceSpy: jasmine.Spy
  let dialogCloseSpy: jasmine.Spy
  beforeEach(async () => {
    const deviceService = jasmine.createSpyObj('DevicesService', ['addDevice'])
    addDeviceSpy = deviceService.addDevice.and.returnValue(of({}))

    await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, MatDialogModule, AddDeviceEnterpriseComponent],
    providers: [
        { provide: DevicesService, useValue: deviceService },
        { provide: MatDialogRef, useValue: { close: () => { } } }
    ]
})
    .compileComponents()
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
      useTls: false,
      allowSelfSigned: false
    })
    component.submitForm()

    expect(addDeviceSpy).toHaveBeenCalledWith({
      hostname: 'example.com',
      friendlyName: 'Test Device',
      username: 'testuser',
      password: 'password',
      tenantId: '',
      useTls: false,
      allowSelfSigned: false
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
      useTls: false,
      allowSelfSigned: false
    })
    component.submitForm()

    expect(addDeviceSpy).not.toHaveBeenCalled()
    expect(dialogCloseSpy).not.toHaveBeenCalled()
  })
})
