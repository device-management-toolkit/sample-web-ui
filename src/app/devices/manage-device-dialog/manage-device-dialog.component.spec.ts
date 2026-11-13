/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HttpErrorResponse } from '@angular/common/http'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { provideTranslateService } from '@ngx-translate/core'
import { of, throwError, EMPTY, Subject } from 'rxjs'
import { ManageDeviceDialogComponent } from './manage-device-dialog.component'
import { DevicesService } from '../devices.service'
import { createSpyObj, SpyObj } from '../../../test-helpers'
import { Device } from '../../../models/models'

describe('ManageDeviceDialogComponent', () => {
  let fixture: ComponentFixture<ManageDeviceDialogComponent>
  let component: ManageDeviceDialogComponent
  let devicesService: SpyObj<DevicesService>
  let dialogRef: { close: ReturnType<typeof vi.fn>; disableClose?: boolean }

  const device = { guid: 'guid-1', hostname: 'lab-pc' } as Device

  beforeEach(async () => {
    devicesService = createSpyObj<DevicesService>('DevicesService', ['adoptDevice'])
    dialogRef = { close: vi.fn() }
    await TestBed.configureTestingModule({
      imports: [ManageDeviceDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: device }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(ManageDeviceDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('does not submit until a password is entered', () => {
    component.submit()
    expect(devicesService.adoptDevice).not.toHaveBeenCalled()
  })

  it('sends the credentials and closes with true on success', () => {
    devicesService.adoptDevice.mockReturnValue(of({}))
    component.form.setValue({ username: 'admin', password: 'P@ssw0rd' })
    component.submit()
    expect(devicesService.adoptDevice).toHaveBeenCalledWith('guid-1', { username: 'admin', password: 'P@ssw0rd' })
    expect(dialogRef.close).toHaveBeenCalledWith(true)
  })

  it.each([
    [401, 'devices.manage.error.unauthorized.value'],
    [0, 'devices.manage.error.unreachable.value'],
    [502, 'devices.manage.error.unreachable.value'],
    [504, 'devices.manage.error.timeout.value'],
    [500, 'devices.manage.error.generic.value']
  ])('keeps the dialog open with an inline error for HTTP %i', (status, key) => {
    devicesService.adoptDevice.mockReturnValue(throwError(() => new HttpErrorResponse({ status })))
    component.form.setValue({ username: 'admin', password: 'wrong' })
    component.submit()
    expect(dialogRef.close).not.toHaveBeenCalled()
    expect(component.errorKey()).toBe(key)
    expect(component.submitting()).toBe(false)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="manageDeviceError"]')).toBeTruthy()
  })

  it('re-enables the form when the request completes without a result', () => {
    devicesService.adoptDevice.mockReturnValue(EMPTY)
    component.form.setValue({ username: 'admin', password: 'pw' })
    component.submit()
    expect(component.submitting()).toBe(false)
    expect(dialogRef.close).not.toHaveBeenCalled()
  })

  it('clears a previous error when retrying', () => {
    devicesService.adoptDevice.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 401 })))
    component.form.setValue({ username: 'admin', password: 'wrong' })
    component.submit()
    expect(component.errorKey()).not.toBeNull()
    devicesService.adoptDevice.mockReturnValueOnce(of({}))
    component.submit()
    expect(component.errorKey()).toBeNull()
  })

  it('masks the password until the visibility toggle is clicked', () => {
    const input = fixture.nativeElement.querySelector('input[title="password"]') as HTMLInputElement
    expect(input.type).toBe('password')
    ;(fixture.nativeElement.querySelector('[data-cy="manageDeviceTogglePassword"]') as HTMLButtonElement).click()
    fixture.detectChanges()
    expect(input.type).toBe('text')
  })

  it('gives the visibility toggle an accessible name', () => {
    const toggle = fixture.nativeElement.querySelector('[data-cy="manageDeviceTogglePassword"]') as HTMLButtonElement
    expect(toggle.getAttribute('aria-label')).toBeTruthy()
  })

  it('blocks dismissal while the request is pending and restores it afterwards', () => {
    const pending = new Subject<Device>()
    devicesService.adoptDevice.mockReturnValue(pending)
    component.form.setValue({ username: 'admin', password: 'pw' })
    component.submit()
    expect(dialogRef.disableClose).toBe(true)
    pending.error(new HttpErrorResponse({ status: 500 }))
    expect(dialogRef.disableClose).toBe(false)
  })
})
