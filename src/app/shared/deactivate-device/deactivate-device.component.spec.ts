/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { MatLegacyDialogModule as MatDialogModule, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { environment } from 'src/environments/environment'
import { SharedModule } from '../shared.module'

import { DeactivateDeviceComponent } from './deactivate-device.component'
import { VaultService } from './vault.service'

describe('DeactivateDeviceComponent', () => {
  let component: DeactivateDeviceComponent
  let fixture: ComponentFixture<DeactivateDeviceComponent>
  let vaultService
  let getPasswordSpy: any

  beforeEach(async () => {
    const data = {
      data: {
        AMT_PASSWORD: 'secret'
      }
    }
    vaultService = jasmine.createSpyObj('VaultService', ['getPassword'])
    getPasswordSpy = vaultService.getPassword.and.returnValue(of({ data }))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, ReactiveFormsModule, MatDialogModule],
      declarations: [DeactivateDeviceComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }, { provide: VaultService, useValue: vaultService }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeactivateDeviceComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.rpcLinux).toBe('sudo ./rpc ')
    expect(component.rpcDocker).toBe('sudo docker run --device=/dev/mei0 rpc:latest ')
    expect(component.rpcWindows).toBe('rpc.exe ')
    expect(component.deactivationUrl).toBe('sudo ./rpc -u wss://localhost/activate ')
    expect(component.serverUrl).toBe(`-u wss://${component.formServerUrl()}/activate `)
    expect(component.deactivationCommand).toBe('')
    expect(component.isCopied).toBe(false)
    expect(component.error).toBe(false)
    expect(component.selectedPlatform).toBe('linux')
  })

  it('should change the selected tab to windows on tab change click', () => {
    const spy = spyOn(component, 'formDeactivationUrl')
    const event: any = {
      index: 0,
      tab: {
        textLabel: 'WINDOWS'
      }
    }
    component.tabChange(event)
    expect(component.selectedPlatform).toBe('WINDOWS')
    expect(spy).toHaveBeenCalled()
  })

  it('should set linux deactivation url', () => {
    component.selectedPlatform = 'Linux'
    component.formDeactivationUrl()
    expect(component.deactivationUrl).toBe('sudo ./rpc -u wss://localhost/activate ')
  })
  it('should set windows deactivation url', () => {
    component.selectedPlatform = 'wiNDows'
    component.formDeactivationUrl()
    expect(component.deactivationUrl).toBe('rpc.exe -u wss://localhost/activate ')
  })
  it('should set docker deactivation url', () => {
    component.selectedPlatform = 'docker'
    component.formDeactivationUrl()
    expect(component.deactivationUrl).toBe('sudo docker run --device=/dev/mei0 rpc:latest -u wss://localhost/activate ')
  })

  it('should set the isCopied flag to true on click of copy icon ', fakeAsync(() => {
    component.onCopy()
    expect(component.isCopied).toBe(true)
    tick(2005)
    expect(component.isCopied).toBe(false)
  }))

  it('should call the submit method on click of retrieve password', () => {
    const spy = spyOn(component, 'formDeactivationUrl')

    component.data.id = '1234-2345ab-1234'
    component.vaultForm.controls.vaultToken.setValue('myroot')
    component.onSubmit()
    expect(getPasswordSpy).toHaveBeenCalled()
    expect(component.deactivationCommand).toBe('deactivate --password secret -n')
    expect(component.error).toBe(false)
    expect(spy).toHaveBeenCalled()
    expect(component.hasRetrievedPassword).toBe(true)
  })

  it('should set rpsServer url with port', () => {
    environment.rpsServer = 'http://localhost:8080'
    const result = component.formServerUrl()
    expect(result).toBe('localhost')
  })

  it('should set rpsServer url with route', () => {
    environment.rpsServer = 'https://localhost/rps'
    const result = component.formServerUrl()
    expect(result).toBe('localhost')
  })
})
