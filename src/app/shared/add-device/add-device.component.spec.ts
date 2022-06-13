/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddDeviceComponent } from './add-device.component'
import { ProfilesService } from '../../profiles/profiles.service'
import { of } from 'rxjs'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatCardModule } from '@angular/material/card'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'

describe('AddDeviceComponent', () => {
  let component: AddDeviceComponent
  let fixture: ComponentFixture<AddDeviceComponent>
  let getDataSpy: jasmine.Spy

  beforeEach(async () => {
    const profileService = jasmine.createSpyObj('ProfilesService', ['getData'])
    getDataSpy = profileService.getData.and.returnValue(of([]))
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MatIconModule, MatTabsModule, MatSelectModule, MatFormFieldModule, MatCheckboxModule, MatCardModule, ClipboardModule, MatButtonModule, MatInputModule],
      declarations: [AddDeviceComponent],
      providers: [{ provide: ProfilesService, useValue: profileService }]
    })
      .compileComponents()
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

  it('should update the selected tab to windows on tab change', () => {
    const event: any = {
      index: 1,
      tab: {
        textLabel: 'windows'
      }
    }

    component.tabChange(event)
    expect(component.selectedPlatform).toBe('windows')
  })

  it('should update the selected tab to docker on tab change', () => {
    const event: any = {
      index: 1,
      tab: {
        textLabel: 'docker'
      }
    }

    component.tabChange(event)
    expect(component.selectedPlatform).toBe('docker')
  })

  it('should set the isCopied flag to true when onCopy is triggered', () => {
    component.onCopy()
    expect(component.isCopied).toBe(true)
  })

  it('should update the selected profile on profile selection change', () => {
    const event: any = {
      value: 'profile1'
    }

    component.profileChange(event)
    expect(component.selectedProfile).toBe('activate -profile profile1')
  })

  it('should update the cert check and verbose strings on checkbox clicks', () => {
    const certCheckEvent: any = {
      checked: false
    }

    const verboseEvent: any = {
      checked: true
    }

    component.updateCertCheck(certCheckEvent)
    expect(component.certCheckString).toBe('')

    component.updateVerboseCheck(verboseEvent)
    expect(component.verboseString).toBe('-v ')
  })
})
