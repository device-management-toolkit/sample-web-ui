/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { catchError, concatMap, delay, finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AmtFeaturesResponse, AuditLogResponse, EventLog, HardwareInformation, IPSAlarmClockOccurrence, Device, AmtFeaturesRequest } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { DatePipe } from '@angular/common'
import { MomentModule } from 'ngx-moment'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field'
import { MatList, MatListItem, MatListItemTitle, MatListItemLine } from '@angular/material/list'
import { MatOption, provideNativeDateAdapter } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatStepper, MatStep, MatStepLabel } from '@angular/material/stepper'
import { MatTabGroup, MatTab } from '@angular/material/tabs'
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'

@Component({
    selector: 'app-device-detail',
    templateUrl: './device-detail.component.html',
    styleUrls: ['./device-detail.component.scss'],
    standalone: true,
    providers: [provideNativeDateAdapter()],
    imports: [DeviceToolbarComponent, MatSidenavContainer, MatSidenav, MatTabGroup, MatTab, MatStepper, MatStep, MatStepLabel, MatButton, MatSidenavContent, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatTooltip, MatIcon, MatDivider, ReactiveFormsModule, MatCheckbox, MatSelect, MatOption, MatList, MatListItem, MatListItemTitle, MatListItemLine, MatIconButton, MatFormField, MatInput, MatError, MatHint, MatLabel, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker, MatSlideToggle, MomentModule, DatePipe]
})
export class DeviceDetailComponent implements OnInit {
  public auditLogData: AuditLogResponse = { totalCnt: 0, records: [] }
  public hwInfo?: HardwareInformation
  public amtVersion: any
  public amtFeatures: AmtFeaturesResponse = { KVM: false, SOL: false, IDER: false, redirection: false, optInState: 0, userConsent: 'none' }
  public isLoading = false
  public deviceId: string = ''
  public targetOS: any
  public hourOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']
  public minuteOptions = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59']
  public regOobPowerOptions = [
    {
      label: 'Power On',
      iconlabel: 'power_on',
      tooltip: 'Power up/on fully',
      action: 2
    }, {
      label: 'Power Cycle',
      iconlabel: 'power_on',
      tooltip: 'Transition to minimal power state and then power up/on fully',
      action: 5
    }, {
      label: 'Hard Power Off',
      iconlabel: 'power_off',
      tooltip: 'Transition to a fully powered down state',
      action: 8
    }, {
      label: 'Reset',
      iconlabel: 'power_off',
      tooltip: 'Perform hardware reset on the bus',
      action: 10
    }
  ]

  public biosPxeOobPowerOptions = [
    {
      label: 'Power to BIOS',
      iconlabel: 'restart_alt',
      tooltip: 'Power to BIOS to verify or modify system configuration',
      action: 100
    }, {
      label: 'Reset to BIOS',
      iconlabel: 'restart_alt',
      tooltip: 'Perform hardware reset on the bus to BIOS to verify or modify system configuration',
      action: 101
    }, {
      label: 'Power to PXE',
      iconlabel: 'restart_alt',
      tooltip: 'Power up/on fully to pre-boot execution environment (PXE) (i.e., a network boot)',
      action: 401
    }, {
      label: 'Reset to PXE',
      iconlabel: 'restart_alt',
      tooltip: 'Reset to pre-boot execution environment (PXE) (i.e., a network boot)',
      action: 400
    }
  ]

  public ibPowerOptions = [
    {
      label: 'Sleep',
      iconlabel: 'power_settings_new',
      tooltip: 'Transition to a standby state of low-power usage and store system context (e.g., open applications) in memory',
      action: 4
    }, {
      label: 'Hibernate',
      iconlabel: 'power_settings_new',
      tooltip: 'Transition to zero power usage and store system context in non-volatile storage',
      action: 7
    }, {
      label: 'Soft Power Off',
      iconlabel: 'power_settings_new',
      tooltip: 'Transition to a very minimal power state',
      action: 12
    }, {
      label: 'Soft Reset',
      iconlabel: 'power_settings_new',
      tooltip: 'Perform a shutdown and then a hardware reset',
      action: 14
    }
  ]

  public showSol: boolean = false
  public selectedAction: string = ''
  public deviceState: number = 0
  public amtEnabledFeatures: FormGroup
  public isDisabled: boolean = false
  public userConsentValues = ['none', 'kvm', 'all']
  public eventLogData: EventLog[] = []
  public alarmOccurrences: IPSAlarmClockOccurrence[] = []
  public newAlarmForm: FormGroup = this.fb.group({
    alarmName: '',
    interval: 0,
    startTime: new FormControl(new Date()),
    hour: '12',
    minute: '00'
  })

  public device: Device | null = null

  public deleteOnCompletion: FormControl<any>

  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService, public fb: FormBuilder) {
    this.targetOS = this.devicesService.TargetOSMap
    this.amtEnabledFeatures = fb.group({
      enableIDER: false,
      enableKVM: false,
      enableSOL: false,
      userConsent: [{ value: 'none', disabled: this.isDisabled }],
      optInState: 0,
      redirection: false
    })

    this.deleteOnCompletion = new FormControl<boolean>(true)
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
      const delayTime = 0

      const tempLoading = [true, true, true, true, true, true]
      this.devicesService.device.subscribe({
        next: (device) => { this.device = device }
      })
      of(null).pipe(
        concatMap(() => this.devicesService.getAMTVersion(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving AMT Version`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[0] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )),
        delay(delayTime), // Delay for 2 seconds
        concatMap((results) => {
          this.amtVersion = results
          this.isDisabled = results?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === 4
          return this.devicesService.getHardwareInformation(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving HW Info`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[1] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )
      }),
        delay(delayTime), // Delay for 2 seconds
        concatMap((results) => {
          this.hwInfo = results
          return this.devicesService.getAuditLog(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving Audit Log`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[2] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )
        }),
        delay(delayTime), // Delay for 2 seconds
        concatMap((results) => {
          this.auditLogData = results
          return this.devicesService.getAMTFeatures(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[3] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )
      }),
      delay(delayTime), // Delay for 2 seconds
      concatMap((results) => {
        this.amtEnabledFeatures = this.fb.group({
          enableIDER: results.IDER,
          enableKVM: results.KVM,
          enableSOL: results.SOL,
          userConsent: results.userConsent,
          optInState: results.optInState,
          redirection: results.redirection
        })
        return this.devicesService.getEventLog(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving Event Logs`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[4] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )
      }),
      delay(delayTime), // Delay for 2 seconds
      concatMap((results) => {
       //  this.eventLogData = results
        return this.devicesService.getAlarmOccurrences(this.deviceId).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error retrieving Alarm Occurrences`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            tempLoading[5] = false
            this.isLoading = !tempLoading.every(v => !v)
          })
        )
      })
      ).subscribe({
        error: () => {
          this.isLoading = false
          this.snackBar.open($localize`Error retrieving Hardware Information`, undefined, SnackbarDefaults.defaultError)
        },
        next: (results) => {
          this.alarmOccurrences = results as any
        },
        complete: () => {
          this.isLoading = false
      }
    })
    })
  }

  setAmtFeatures (): void {
    this.isLoading = true
    this.devicesService.setAmtFeatures(this.deviceId, this.amtEnabledFeatures.value as AmtFeaturesRequest).pipe(finalize(() => {
      this.isLoading = false
    })).subscribe((results: any) => {
      this.snackBar.open($localize`${results.status}`, undefined, SnackbarDefaults.defaultSuccess)
    }, err => {
      this.snackBar.open($localize`Failed to update AMT Features`, undefined, SnackbarDefaults.defaultError)
      return throwError(err)
    })
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${this.deviceId}/${path}`])
  }

  sendPowerAction (action: number): void {
    this.isLoading = true
    let useSOL = false
    if (this.router.url.toString().includes('sol') && action === 101) {
      useSOL = true
    }
    this.devicesService.sendPowerAction(this.deviceId, action, useSOL).pipe(
      catchError(err => {
        // TODO: handle error better
        console.error(err)
        this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
        return of(null)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      if (data.Body?.ReturnValueStr === 'NOT_READY') {
        this.snackBar.open($localize`Power action sent but is not ready`, undefined, SnackbarDefaults.defaultWarn)
      } else {
        this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
      }
    })
  }

  parseProvisioningMode (mode: number): string {
    switch (mode) {
      case 1:
        return 'Admin Control Mode (ACM)'
      case 4:
        return 'Client Control Mode (CCM)'
      default:
        return 'Unknown'
    }
  }

  onSelectAction = (): void => {
    this.showSol = !this.showSol
  }

  deviceStatus = (state: number): void => {
    this.deviceState = state
  }

  onSelectedAction = (selectedAction: string): void => {
    this.selectedAction = selectedAction
  }

  reloadAlarms = (): void => {
    window.location.reload()
  }

  deleteAlarm = (instanceID: string): void => {
    if (!window.confirm('Deleting: ' + instanceID)) return

    this.devicesService.deleteAlarmOccurrence(this.deviceId, instanceID).pipe(finalize(() => {

    })).subscribe(results => {
      this.reloadAlarms()
    }, err => {
      this.snackBar.open($localize`Error deleting Alarm Occurrence`, undefined, SnackbarDefaults.defaultError)
      return throwError(err)
    })
  }

  addAlarm = (): void => {
    if (this.newAlarmForm.valid) {
      const alarm: any = Object.assign({}, this.newAlarmForm.getRawValue())
      const startTime: Date = alarm.startTime
      startTime.setHours(alarm.hour as number)
      startTime.setMinutes(alarm.minute as number)
      const payload = {
        ElementName: alarm.alarmName,
        StartTime: startTime?.toISOString()?.replace(/:\d+.\d+Z$/g, ':00Z'),
        Interval: alarm.interval,
        DeleteOnCompletion: this.deleteOnCompletion.value
      }
      if (!window.confirm(JSON.stringify(payload, null, '\t'))) return

      this.isLoading = true
      this.devicesService.addAlarmOccurrence(this.deviceId, payload).pipe(finalize(() => {
        this.isLoading = false
      })).subscribe(results => {
        this.reloadAlarms()
      }, err => {
        this.snackBar.open($localize`Error adding Alarm Occurrence`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
    }
  }
}
