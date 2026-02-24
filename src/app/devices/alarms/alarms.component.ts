/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, ViewChild } from '@angular/core'
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormGroupDirective
} from '@angular/forms'
import { IPSAlarmClockOccurrence, IPSAlarmClockOccurrenceInput } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { catchError, finalize, throwError } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSelectModule } from '@angular/material/select'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatIconModule } from '@angular/material/icon'
import { MatDividerModule } from '@angular/material/divider'
import { DatePipe } from '@angular/common'
import { MatListModule } from '@angular/material/list'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { environment } from 'src/environments/environment'
import { MatTooltip } from '@angular/material/tooltip'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MatDialog } from '@angular/material/dialog'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'

@Component({
  selector: 'app-alarms',
  imports: [
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatDividerModule,
    DatePipe,
    MatListModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    MatTooltip
  ],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss'
})
export class AlarmsComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)
  private readonly dialog = inject(MatDialog)

  public readonly deviceId = input('')

  cloudMode: boolean = environment.cloud
  public alarmOccurrences = signal<IPSAlarmClockOccurrence[]>([])
  public newAlarmForm = this.fb.group({
    alarmName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]],
    interval: 0,
    startTime: new FormControl(new Date()),
    hour: '12',
    minute: '00'
  })

  @ViewChild(FormGroupDirective) formDirective?: FormGroupDirective

  public hourOptions = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24'
  ]
  public minuteOptions = [
    '00',
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '50',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59'
  ]
  public deleteOnCompletion: FormControl<any>
  public isLoading = signal(true)

  constructor() {
    this.deleteOnCompletion = new FormControl<boolean>(true)
  }

  ngOnInit(): void {
    this.loadAlarms()
  }

  loadAlarms(): void {
    this.devicesService
      .getAlarmOccurrences(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('alarm.errorRetrieve.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((results) => {
        this.alarmOccurrences.set(results)
      })
  }

  deleteAlarm = (instanceID: string): void => {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== true) return

      // Optimistic update - remove alarm immediately from UI
      const previousAlarms = this.alarmOccurrences()
      this.alarmOccurrences.set(previousAlarms.filter((alarm) => alarm.InstanceID !== instanceID))

      this.isLoading.set(true)
      this.devicesService
        .deleteAlarmOccurrence(this.deviceId(), instanceID)
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          next: () => {
            // Success - alarm already removed from UI
            const msg: string = this.translate.instant('alarm.successDelete.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
          },
          error: () => {
            // Error - restore the alarm and reload to ensure consistency
            this.alarmOccurrences.set(previousAlarms)
            this.loadAlarms()
            const msg: string = this.translate.instant('alarm.errorDelete.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          }
        })
    })
  }

  addAlarm = (): void => {
    if (this.newAlarmForm.invalid) {
      this.newAlarmForm.markAllAsTouched()
      return
    }

    const alarm: any = Object.assign({}, this.newAlarmForm.getRawValue())
    // Create a new Date object to avoid mutating the form's Date
    const startTime: Date = new Date(alarm.startTime)
    startTime.setHours(alarm.hour as number)
    startTime.setMinutes(alarm.minute as number)
    const payload: IPSAlarmClockOccurrenceInput = {
      ElementName: alarm.alarmName,
      StartTime: startTime?.toISOString()?.replace(/:\d+.\d+Z$/g, ':00Z'),
      Interval: Number(alarm.interval),
      DeleteOnCompletion: this.deleteOnCompletion.value
    }

    this.isLoading.set(true)
    this.devicesService
      .addAlarmOccurrence(this.deviceId(), payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: () => {
          this.loadAlarms()
          // Reset the form directive to clear submitted state
          this.formDirective?.resetForm({
            alarmName: '',
            interval: 0,
            startTime: new Date(),
            hour: '12',
            minute: '00'
          })
          this.deleteOnCompletion.setValue(true)
          const msg: string = this.translate.instant('alarm.successAdding.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
        },
        error: () => {
          const msg: string = this.translate.instant('alarm.errorAdding.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        }
      })
  }
}
