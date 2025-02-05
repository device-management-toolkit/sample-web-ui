/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit, inject } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
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
    MatButtonModule
  ],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss'
})
export class AlarmsComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  fb = inject(FormBuilder)

  @Input()
  public deviceId = ''

  cloudMode: boolean = environment.cloud
  public alarmOccurrences: IPSAlarmClockOccurrence[] = []
  public newAlarmForm: FormGroup = this.fb.group({
    alarmName: '',
    interval: 0,
    startTime: new FormControl(new Date()),
    hour: '12',
    minute: '00'
  })

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
  public isLoading = true

  constructor() {
    this.deleteOnCompletion = new FormControl<boolean>(true)
  }

  ngOnInit(): void {
    this.loadAlarms()
  }

  loadAlarms(): void {
    this.devicesService
      .getAlarmOccurrences(this.deviceId)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving Alarm Occurrences`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((results) => {
        this.alarmOccurrences = results
      })
  }

  deleteAlarm = (instanceID: string): void => {
    if (!window.confirm('Deleting: ' + instanceID)) return

    this.devicesService
      .deleteAlarmOccurrence(this.deviceId, instanceID)
      .pipe(finalize(() => {}))
      .subscribe({
        next: () => {
          this.loadAlarms()
        },
        error: (err) => {
          this.snackBar.open($localize`Error deleting Alarm Occurrence`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }
      })
  }

  addAlarm = (): void => {
    if (this.newAlarmForm.valid) {
      const alarm: any = Object.assign({}, this.newAlarmForm.getRawValue())
      const startTime: Date = alarm.startTime
      startTime.setHours(alarm.hour as number)
      startTime.setMinutes(alarm.minute as number)
      const payload: IPSAlarmClockOccurrenceInput = {
        ElementName: alarm.alarmName,
        StartTime: startTime?.toISOString()?.replace(/:\d+.\d+Z$/g, ':00Z'),
        Interval: Number(alarm.interval),
        DeleteOnCompletion: this.deleteOnCompletion.value
      }

      this.isLoading = true
      this.devicesService
        .addAlarmOccurrence(this.deviceId, payload)
        .pipe(
          finalize(() => {
            this.isLoading = false
          })
        )
        .subscribe({
          next: () => {
            this.loadAlarms()
          },
          error: (err) => {
            this.snackBar.open($localize`Error adding Alarm Occurrence`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }
        })
    }
  }
}
