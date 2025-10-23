/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddDeviceComponent } from './add-device.component'
import { ProfilesService } from '../../profiles/profiles.service'
import { of } from 'rxjs'
import { MatIconModule } from '@angular/material/icon'
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MatSelectChange, MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatCardModule } from '@angular/material/card'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

describe('AddDeviceComponent', () => {
  let component: AddDeviceComponent
  let fixture: ComponentFixture<AddDeviceComponent>
  let getDataSpy: jasmine.Spy

  beforeEach(async () => {
    const profileService = jasmine.createSpyObj('ProfilesService', ['getData'])
    getDataSpy = profileService.getData.and.returnValue(of({ data: [], totalCount: 0 }))

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatIconModule,
        MatTabsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatCardModule,
        ClipboardModule,
        MatButtonModule,
        MatInputModule,
        ReactiveFormsModule,
        AddDeviceComponent,
        TranslateModule.forRoot()
      ],
      providers: [{ provide: ProfilesService, useValue: profileService }]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDeviceComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true)
  })

  it('should initialize with default values', () => {
    expect(component.selectedPlatform()).toBe('linux')
    expect(component.isCopied()).toBe(false)
    expect(component.deviceForm.get('profile')?.value).toBe('activate')
    expect(component.deviceForm.get('certCheck')?.value).toBe(true)
    expect(component.deviceForm.get('verbose')?.value).toBe(false)
  })

  it('should update the selected platform on tab change', () => {
    const event: MatTabChangeEvent = {
      index: 1,
      tab: {
        textLabel: 'Windows'
      }
    } as any

    component.tabChange(event)
    expect(component.selectedPlatform()).toBe('windows')
  })

  it('should update the selected platform to docker on tab change', () => {
    const event: MatTabChangeEvent = {
      index: 2,
      tab: {
        textLabel: 'Docker'
      }
    } as any

    component.tabChange(event)
    expect(component.selectedPlatform()).toBe('docker')
  })

  it('should set the isCopied signal to true when onCopy is triggered', () => {
    component.onCopy()
    expect(component.isCopied()).toBe(true)
  })

  it('should update the selected profile on profile selection change', () => {
    const event: MatSelectChange = {
      value: 'profile1'
    } as any

    component.profileChange(event)
    expect(component.deviceForm.get('profile')?.value).toBe('profile1')
  })

  it('should update the form controls on checkbox clicks', () => {
    const certCheckEvent: MatCheckboxChange = {
      checked: false
    } as any

    const verboseEvent: MatCheckboxChange = {
      checked: true
    } as any

    component.updateCertCheck(certCheckEvent)
    expect(component.deviceForm.get('certCheck')?.value).toBe(false)

    component.updateVerboseCheck(verboseEvent)
    expect(component.deviceForm.get('verbose')?.value).toBe(true)
  })

  it('should generate correct activation URL for different platforms', () => {
    // Set a profile
    component.deviceForm.patchValue({ profile: 'testProfile' })
    component.formValues.set({ profile: 'testProfile', certCheck: true, verbose: false })

    // Test Linux
    component.selectedPlatform.set('linux')
    expect(component.activationUrl()).toContain('sudo ./rpc activate -profile testProfile')

    // Test Windows
    component.selectedPlatform.set('windows')
    expect(component.activationUrl()).toContain('rpc.exe activate -profile testProfile')

    // Test Docker
    component.selectedPlatform.set('docker')
    expect(component.activationUrl()).toContain(
      'sudo docker run --device=/dev/mei0 rpc:latest activate -profile testProfile'
    )
  })

  it('should include cert check and verbose flags in activation URL when enabled', () => {
    component.deviceForm.patchValue({
      profile: 'testProfile',
      certCheck: true,
      verbose: true
    })
    component.formValues.set({ profile: 'testProfile', certCheck: true, verbose: true })

    const url = component.activationUrl()
    expect(url).toContain('-n ')
    expect(url).toContain('-v ')
  })

  it('should disable activation command when no profile is selected', () => {
    component.formValues.set({ profile: 'activate', certCheck: true, verbose: false })
    expect(component.isActivationCommandDisabled()).toBe(true)

    component.formValues.set({ profile: 'testProfile', certCheck: true, verbose: false })
    expect(component.isActivationCommandDisabled()).toBe(false)
  })
})
