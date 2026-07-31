/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { provideTranslateService } from '@ngx-translate/core'
import { IderStatusComponent } from './ider-status.component'

describe('IderStatusComponent', () => {
  let component: IderStatusComponent
  let fixture: ComponentFixture<IderStatusComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, IderStatusComponent],
      providers: [provideTranslateService()]
    }).compileComponents()

    fixture = TestBed.createComponent(IderStatusComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('formatBytes formats byte counts into human-readable units', () => {
    expect(component.formatBytes(0)).toBe('0 B')
    expect(component.formatBytes(512)).toBe('512 B')
    expect(component.formatBytes(2048)).toBe('2.0 KB')
    expect(component.formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('formatBytes returns 0 B for invalid input', () => {
    expect(component.formatBytes(-1)).toBe('0 B')
    expect(component.formatBytes(NaN)).toBe('0 B')
  })

  it('shows the not-connected state by default', () => {
    fixture.detectChanges()
    const el = fixture.nativeElement
    expect(el.querySelector('mat-icon').textContent.trim()).toBe('storage')
    expect(el.querySelector('mat-spinner')).toBeNull()
  })

  it('shows the transferred total when active', () => {
    fixture.componentRef.setInput('active', true)
    fixture.componentRef.setInput('bytes', 2048)
    fixture.detectChanges()
    const el = fixture.nativeElement
    expect(el.querySelector('mat-icon').textContent.trim()).toBe('check_circle')
    expect(el.textContent).toContain('2.0 KB')
  })

  it('shows a spinner while transferring', () => {
    fixture.componentRef.setInput('active', true)
    fixture.componentRef.setInput('transferring', true)
    fixture.detectChanges()
    const el = fixture.nativeElement
    expect(el.querySelector('mat-spinner')).toBeTruthy()
    expect(el.querySelector('mat-icon')).toBeNull()
  })

  it('shows the idle hint when provided and idle', () => {
    fixture.componentRef.setInput('idleHint', 'ider.status.attachHelp.value')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('ider.status.attachHelp.value')
  })
})
