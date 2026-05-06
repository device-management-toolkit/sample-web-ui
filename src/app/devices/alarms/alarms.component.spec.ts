/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { AlarmsComponent } from './alarms.component'
import { DevicesService } from '../devices.service'
import { provideNativeDateAdapter } from '@angular/material/core'
import { of, throwError } from 'rxjs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateModule } from '@ngx-translate/core'
import { MatDialog } from '@angular/material/dialog'

describe('AlarmsComponent', () => {
  let component: AlarmsComponent
  let fixture: ComponentFixture<AlarmsComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let dialogSpy: jasmine.SpyObj<MatDialog>

  beforeEach(() => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getAlarmOccurrences',
      'addAlarmOccurrence',
      'deleteAlarmOccurrence'
    ])
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])

    devicesServiceSpy.getAlarmOccurrences.and.returnValue(of([{ StartTime: {} } as any]))
    devicesServiceSpy.addAlarmOccurrence.and.returnValue(of({}))
    devicesServiceSpy.deleteAlarmOccurrence.and.returnValue(of({}))
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        AlarmsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideNativeDateAdapter(),
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }]
    })

    fixture = TestBed.createComponent(AlarmsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load alarms on init', () => {
    expect(devicesServiceSpy.getAlarmOccurrences).toHaveBeenCalledWith('')
    expect(component.alarmOccurrences().length).toBeGreaterThanOrEqual(0)
  })

  it('should add alarm successfully', () => {
    component.newAlarmForm.patchValue({
      alarmName: 'TestAlarm',
      interval: 5,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '30'
    })

    component.addAlarm()

    expect(devicesServiceSpy.addAlarmOccurrence).toHaveBeenCalled()
    expect(devicesServiceSpy.getAlarmOccurrences).toHaveBeenCalled()
  })

  it('should not add alarm if alarm name is empty', () => {
    component.newAlarmForm.patchValue({
      alarmName: '',
      interval: 0,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '00'
    })

    const callCount = devicesServiceSpy.addAlarmOccurrence.calls.count()
    component.addAlarm()

    expect(devicesServiceSpy.addAlarmOccurrence.calls.count()).toBe(callCount)
  })

  it('should not add alarm if alarm name contains spaces', () => {
    component.newAlarmForm.patchValue({
      alarmName: 'Test Alarm',
      interval: 0,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '00'
    })

    const callCount = devicesServiceSpy.addAlarmOccurrence.calls.count()
    component.addAlarm()

    expect(devicesServiceSpy.addAlarmOccurrence.calls.count()).toBe(callCount)
  })

  it('should not add alarm if alarm name contains special characters', () => {
    component.newAlarmForm.patchValue({
      alarmName: 'Test@Alarm',
      interval: 0,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '00'
    })

    const callCount = devicesServiceSpy.addAlarmOccurrence.calls.count()
    component.addAlarm()

    expect(devicesServiceSpy.addAlarmOccurrence.calls.count()).toBe(callCount)
  })

  it('should delete alarm successfully', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)

    component.deleteAlarm('test-instance-id')

    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(devicesServiceSpy.deleteAlarmOccurrence).toHaveBeenCalledWith('', 'test-instance-id')
  })

  it('should not delete alarm if user cancels', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)

    const callCount = devicesServiceSpy.deleteAlarmOccurrence.calls.count()
    component.deleteAlarm('test-instance-id')

    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(devicesServiceSpy.deleteAlarmOccurrence.calls.count()).toBe(callCount)
  })

  it('should mark form as touched when adding alarm with invalid form', () => {
    component.newAlarmForm.patchValue({
      alarmName: '',
      interval: 0,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '00'
    })

    spyOn(component.newAlarmForm, 'markAllAsTouched')
    component.addAlarm()

    expect(component.newAlarmForm.markAllAsTouched).toHaveBeenCalled()
  })

  it('should optimistically remove alarm from UI when deleting', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)
    component.alarmOccurrences.set([
      { InstanceID: 'test-instance-id', StartTime: {} } as any,
      { InstanceID: 'other-instance-id', StartTime: {} } as any
    ])

    component.deleteAlarm('test-instance-id')

    const alarms = component.alarmOccurrences()
    expect(alarms.length).toBe(1)
    expect(alarms[0].InstanceID).toBe('other-instance-id')
  })

  it('should call getAlarmOccurrences when delete fails', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)
    const mockAlarms = [
      { InstanceID: 'test-instance-id', StartTime: {} } as any,
      { InstanceID: 'other-instance-id', StartTime: {} } as any
    ]
    component.alarmOccurrences.set([...mockAlarms])

    devicesServiceSpy.deleteAlarmOccurrence.and.returnValue(throwError(() => new Error('Delete failed')))
    devicesServiceSpy.getAlarmOccurrences.and.returnValue(of([...mockAlarms]))

    component.deleteAlarm('test-instance-id')

    expect(devicesServiceSpy.getAlarmOccurrences).toHaveBeenCalled()
  })

  it('should reset form values after successful add', () => {
    component.newAlarmForm.patchValue({
      alarmName: 'TestAlarm',
      interval: 5,
      startTime: new Date('2024-01-01T00:00:00'),
      hour: '12',
      minute: '30'
    })

    component.addAlarm()

    expect(component.newAlarmForm.get('alarmName')?.value).toBe('')
    expect(component.newAlarmForm.get('interval')?.value).toBe(0)
  })

  it('should validate alarm name pattern', () => {
    const alarmNameControl = component.newAlarmForm.get('alarmName')

    alarmNameControl?.setValue('ValidName123')
    expect(alarmNameControl?.valid).toBe(true)

    alarmNameControl?.setValue('Invalid Name')
    expect(alarmNameControl?.hasError('pattern')).toBe(true)

    alarmNameControl?.setValue('Invalid@Name')
    expect(alarmNameControl?.hasError('pattern')).toBe(true)
  })
})
