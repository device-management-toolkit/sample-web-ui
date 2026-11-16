/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, DestroyRef } from '@angular/core'
import { catchError, defaultIfEmpty, exhaustMap, finalize, map, switchMap, takeUntil, timeout } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { Observable, of, forkJoin, EMPTY, Subject, Subscription, timer } from 'rxjs'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AMTFeaturesResponse, BootDetails, Device, UserConsentResponse } from '../../../models/models'
import { MatDialog } from '@angular/material/dialog'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { environment } from '../../../environments/environment'
import { AddDeviceEnterpriseComponent } from '../../shared/add-device-enterprise/add-device-enterprise.component'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton } from '@angular/material/button'
import { MatChipSet, MatChip } from '@angular/material/chips'
import { MatToolbar } from '@angular/material/toolbar'
import { DeviceCertDialogComponent } from '../device-cert-dialog/device-cert-dialog.component'
import { UserConsentService } from '../user-consent.service'
import { HTTPBootDialogComponent } from './http-boot-dialog/http-boot-dialog.component'
import { PBABootDialogComponent } from './pba-boot-dialog/pba-boot-dialog.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'

const PROVISIONING_MODE_CCM = 4

const POWER_STATE_ON = 'deviceToolbar.power.on.value'
const POWER_STATE_SLEEP = 'deviceToolbar.power.sleep.value'
const POWER_STATE_OFF = 'deviceToolbar.power.off.value'
const POWER_STATE_UNKNOWN = 'Unknown'

// CIM "Power Cycle (Off - Hard)": a cycle in progress, not a settled off state.
const CIM_POWER_STATE_CYCLING = 9

// After a power action, and while the device is asleep or off, it is re-read at this interval.
export const POWER_POLL_INTERVAL_MS = 3_000
// While the device is on and nothing is pending, AMT is re-read at this slower interval so the button follows outside changes.
export const POWER_IDLE_POLL_INTERVAL_MS = 5_000
export const POWER_IDLE_FAILURE_LIMIT = 3
export const POWER_READ_TIMEOUT_MS = 10_000
// After a power action the device is followed this long for the expected state; after that the button shows what it reports.
export const POWER_POLL_TIMEOUT_MS = 120_000
// A restart (reset, power cycle, soft reset) keeps the power on, so AMT reports "on" throughout. If AMT never drops out,
// "on" only counts as back up after this long.
export const POWER_REBOOT_MIN_WAIT_MS = 30_000
// AMT can answer between drop-outs while the device restarts, so after it was only seen unreachable (never reported
// off or asleep) it must report "on" this many times in a row before the device counts as back up.
export const POWER_STEADY_ON_READS = 2

type PowerTransitionKind = 'on' | 'sleep' | 'off' | 'reboot' | 'other'

// Action codes sent to the backend: CIM power states below 100, boot actions from 100.
const POWER_ON_ACTIONS = [
  2,
  100,
  106,
  108,
  110,
  401
] // power up, power up to BIOS/HTTPS boot/PBA/WinRE/PXE
const POWER_SLEEP_ACTIONS = [4]
const POWER_OFF_ACTIONS = [
  7,
  8,
  12
] // hibernate, power off, soft off
const POWER_REBOOT_ACTIONS = [
  5,
  10,
  14,
  101,
  105,
  107,
  109,
  202,
  400
] // power cycle, reset, soft reset, reset to BIOS/HTTPS boot/PBA/WinRE/IDER/PXE

interface PowerOptions {
  label: string
  action: number
}
@Component({
  selector: 'app-device-toolbar',
  templateUrl: './device-toolbar.component.html',
  styleUrls: ['./device-toolbar.component.scss'],
  imports: [
    MatToolbar,
    MatChipSet,
    MatChip,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatDivider,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatProgressBar,
    TranslatePipe
  ]
})
export class DeviceToolbarComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly matDialog = inject(MatDialog)
  private readonly dialog = inject(MatDialog)
  private readonly destroyRef = inject(DestroyRef)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)

  public readonly isLoading = input(signal(false))

  public readonly deviceId = input('')
  public readonly isPinned = signal(false)

  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public isCloudMode = environment.cloud
  public device = signal<Device | null>(null)
  public powerState = signal(POWER_STATE_UNKNOWN)
  private powerWatch: Subscription | null = null
  // Kept outside the watcher, which is rebuilt whenever its poll interval changes.
  private powerCycling = false
  private cycleOnReads = 0
  private readonly powerFetchCancelled = new Subject<void>()
  public basePowerOptions: PowerOptions[] = [
    {
      label: 'powerOptions.hibernate.value',
      action: 7
    },
    {
      label: 'powerOptions.sleep.value',
      action: 4
    },
    {
      label: 'powerOptions.powerCycle.value',
      action: 5
    },
    {
      label: 'powerOptions.reset.value',
      action: 10
    },
    {
      label: 'powerOptions.softOff.value',
      action: 12
    },
    {
      label: 'powerOptions.softReset.value',
      action: 14
    },
    {
      label: 'powerOptions.resetToIDER.value',
      action: 202
    },
    {
      label: 'powerOptions.resetToBIOS.value',
      action: 101
    },
    {
      label: 'powerOptions.powerUpToBIOS.value',
      action: 100
    },
    {
      label: 'powerOptions.resetToPXE.value',
      action: 400
    },
    {
      label: 'powerOptions.powerUpToPXE.value',
      action: 401
    }
  ]
  public powerOptions = signal<PowerOptions[]>([])

  // Conditional power options based on AMT features
  private readonly conditionalPowerOptions = {
    localPBABootSupported: [
      {
        label: 'powerOptions.resetToPBA.value',
        action: 107
      },
      {
        label: 'powerOptions.powerUpToPBA.value',
        action: 108
      }
    ],
    winREBootSupported: [
      {
        label: 'powerOptions.resetToWinRe.value',
        action: 109
      },
      {
        label: 'powerOptions.powerUpToWinRe.value',
        action: 110
      }
    ],
    httpsBootSupported: [
      {
        label: 'powerOptions.resetToHTTPSBoot.value',
        action: 105
      },
      {
        label: 'powerOptions.powerUpToHTTPSBoot.value',
        action: 106
      }
    ]
  }

  ngOnInit(): void {
    this.devicesService
      .getDevice(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.device.set(data)
        this.devicesService.device.next(data)
        this.isPinned.set(data.certHash != null && data.certHash !== '')
        this.loadPowerState()
        this.loadAMTFeatures()
        // react to AMT feature updates emitted by service
        this.devicesService
          .featuresChanges(this.deviceId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((features) => {
            if (features) {
              this.amtFeatures.set(features)
              this.buildPowerOptions()
            }
          })
      })
  }

  private loadAMTFeatures(): void {
    // Use cached features if fresher than 30s — avoids a duplicate AMT round-trip
    // when the KVM/SOL component already loaded features moments before the toolbar.
    this.devicesService
      .getAMTFeaturesCached(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((features) => {
        this.amtFeatures.set(features)
        this.buildPowerOptions()
      })
  }

  private buildPowerOptions(): void {
    let options: PowerOptions[] = [...this.basePowerOptions]

    const f = this.amtFeatures()
    if (f?.ocr) {
      // Add HTTPS Boot options if httpsBootSupported is true
      if (f.httpsBootSupported) {
        options = options.concat(this.conditionalPowerOptions.httpsBootSupported)
      }

      // Add PBA options if localPBABootSupported is true
      if (f.localPBABootSupported) {
        options = options.concat(this.conditionalPowerOptions.localPBABootSupported)
      }

      if (f.winREBootSupported) {
        options = options.concat(this.conditionalPowerOptions.winREBootSupported)
      }
    }

    // Sort options by action number for consistent ordering
    options.sort((a, b) => a.action - b.action)

    this.powerOptions.set(options)
  }

  private static powerTransitionKind(action: number): PowerTransitionKind {
    if (POWER_ON_ACTIONS.includes(action)) return 'on'
    if (POWER_SLEEP_ACTIONS.includes(action)) return 'sleep'
    if (POWER_OFF_ACTIONS.includes(action)) return 'off'
    if (POWER_REBOOT_ACTIONS.includes(action)) return 'reboot'
    return 'other'
  }

  private static optimisticPowerStateLabel(action: number, kind: PowerTransitionKind): string | null {
    if (kind === 'on' || action === 12 || action === 14) return null
    if (action === 4) return POWER_STATE_SLEEP
    if (kind === 'off' || kind === 'reboot') return POWER_STATE_OFF

    return POWER_STATE_UNKNOWN
  }

  // Whether the device reached the state the action leads to. "Back up after going down" is handled separately.
  private static isPowerTransitionDone(kind: PowerTransitionKind, powerstate: number, elapsedMs: number): boolean {
    switch (kind) {
      case 'on':
        return powerstate === 2
      case 'sleep':
        return powerstate === 3 || powerstate === 4
      case 'off':
        return powerstate !== 0 && powerstate !== 1 && powerstate !== 2 && powerstate !== 3 && powerstate !== 4
      case 'reboot':
        // AMT never showed the restart (no drop-out): accept "on" once a restart has had time to finish.
        return powerstate === 2 && elapsedMs >= POWER_REBOOT_MIN_WAIT_MS
      default:
        return true
    }
  }

  // Keep the last confirmed state until AMT reports that the device changed power state.
  private watchPowerTransition(action: number): void {
    this.powerFetchCancelled.next()
    this.stopPowerWatch()
    const kind = DeviceToolbarComponent.powerTransitionKind(action)
    const isSoftAction = action === 12 || action === 14
    const optimisticState = DeviceToolbarComponent.optimisticPowerStateLabel(action, kind)
    if (optimisticState != null) {
      this.powerState.set(optimisticState)
    }

    let reportedDown = false // AMT reported the device off or asleep
    let cycling = false // AMT reported a power cycle in progress
    let droppedOut = false // AMT stopped answering, as it does while the device restarts
    let failedReads = 0
    let onReads = 0
    let latestPowerState: number | undefined
    const startedAt = Date.now()
    this.powerWatch = timer(POWER_POLL_INTERVAL_MS, POWER_POLL_INTERVAL_MS)
      .pipe(
        exhaustMap((tick) => {
          latestPowerState = undefined
          return this.devicesService.getPowerState(this.deviceId(), { background: true }).pipe(
            timeout({ first: POWER_READ_TIMEOUT_MS }),
            map((state) => ({ tick, powerstate: state?.powerstate as number | undefined })),
            catchError(() => of({ tick, powerstate: undefined })),
            defaultIfEmpty({ tick, powerstate: undefined })
          )
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ powerstate }) => {
        latestPowerState = powerstate
        const elapsedMs = Date.now() - startedAt
        if (powerstate == null) {
          // A soft action waits green until the device goes down, so one failed read is enough to turn red;
          // otherwise one failed read can be a network blip and two in a row means AMT has dropped out.
          failedReads++
          onReads = 0
          if (failedReads >= (isSoftAction ? 1 : 2)) {
            droppedOut = true
          }
        } else {
          failedReads = 0
          if (powerstate === 2) {
            onReads++
          } else {
            onReads = 0
            if (powerstate === CIM_POWER_STATE_CYCLING) {
              cycling = true
            } else if (powerstate !== 0 && powerstate !== 1) {
              reportedDown = true
            }
          }
        }

        if (powerstate === CIM_POWER_STATE_CYCLING) {
          this.powerState.set(POWER_STATE_OFF)
          return
        }

        const settling = droppedOut || cycling

        if (droppedOut) {
          if (kind === 'sleep') {
            this.powerState.set(POWER_STATE_SLEEP)
          } else if (kind === 'off' || kind === 'reboot') {
            this.powerState.set(POWER_STATE_OFF)
          }
        }

        // A reported off/sleep is definite, so one "on" is enough; after a drop-out or a power cycle alone AMT
        // must answer "on" steadily, since it can answer between drop-outs.
        const backUp = powerstate === 2 && (reportedDown || (settling && onReads >= POWER_STEADY_ON_READS))
        const reportedDeviceDown = powerstate != null && powerstate !== 0 && powerstate !== 1 && powerstate !== 2
        if (
          powerstate != null &&
          (backUp ||
            reportedDeviceDown ||
            ((!settling || powerstate !== 2) &&
              DeviceToolbarComponent.isPowerTransitionDone(kind, powerstate, elapsedMs)))
        ) {
          this.showPowerState(powerstate)
        }
      })
    this.powerWatch.add(
      timer(POWER_POLL_TIMEOUT_MS)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.showPowerState(latestPowerState))
    )
  }

  // Shows Unknown and keeps checking, so the button recovers once the device can be read again.
  private showUnknownPowerState(): void {
    this.stopPowerWatch()
    this.powerCycling = false
    this.cycleOnReads = 0
    this.powerState.set(POWER_STATE_UNKNOWN)
    this.watchPowerState()
  }

  // Shows the device's power state and keeps following it, so the button also changes when the device is slept,
  // shut down or woken outside the UI (power button, keyboard, wake timer).
  private showPowerState(powerstate: number | undefined): void {
    this.stopPowerWatch()
    this.powerCycling = powerstate === CIM_POWER_STATE_CYCLING
    this.cycleOnReads = 0
    this.setPowerStateLabel(powerstate)
    this.watchPowerState()
  }

  private watchPowerState(): void {
    this.stopPowerWatch()
    const interval = this.powerState() === POWER_STATE_ON ? POWER_IDLE_POLL_INTERVAL_MS : POWER_POLL_INTERVAL_MS
    let failedReads = 0
    this.powerWatch = timer(interval, interval)
      .pipe(
        exhaustMap(() =>
          this.devicesService.getPowerState(this.deviceId(), { background: true }).pipe(
            timeout({ first: POWER_READ_TIMEOUT_MS }),
            catchError(() => of(undefined)),
            defaultIfEmpty(undefined)
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((state) => {
        if (state?.powerstate == null) {
          failedReads++
          this.cycleOnReads = 0
          if (this.powerState() === POWER_STATE_ON && failedReads >= POWER_IDLE_FAILURE_LIMIT) {
            this.powerState.set(POWER_STATE_UNKNOWN)
            this.watchPowerState()
          }
          return
        }
        failedReads = 0
        this.applyPolledPowerState(state.powerstate)
        const next = this.powerState() === POWER_STATE_ON ? POWER_IDLE_POLL_INTERVAL_MS : POWER_POLL_INTERVAL_MS
        if (next !== interval) {
          this.watchPowerState()
        }
      })
  }

  // After a power cycle, AMT can answer "on" between drop-outs, so only a steady run of "on" (or an explicit
  // off/asleep) ends the cycle.
  private applyPolledPowerState(powerstate: number): void {
    if (powerstate === CIM_POWER_STATE_CYCLING) {
      this.powerCycling = true
      this.cycleOnReads = 0
    } else if (powerstate === 2) {
      this.cycleOnReads++
      if (this.cycleOnReads >= POWER_STEADY_ON_READS) {
        this.powerCycling = false
      }
    } else if (powerstate !== 0 && powerstate !== 1) {
      this.powerCycling = false
    }

    if (powerstate !== 2) {
      this.cycleOnReads = 0
    }

    if (!(powerstate === 2 && this.powerCycling)) {
      this.setPowerStateLabel(powerstate)
    }
  }

  private stopPowerWatch(): void {
    this.powerWatch?.unsubscribe()
    this.powerWatch = null
  }

  private setPowerStateLabel(powerstate: number | undefined): void {
    switch (powerstate) {
      case 2:
        this.powerState.set(POWER_STATE_ON)
        break
      case 3:
      case 4:
        this.powerState.set(POWER_STATE_SLEEP)
        break
      case undefined:
      case null:
      case 0: // CIM Unknown
      case 1: // CIM Other
        this.powerState.set(POWER_STATE_UNKNOWN)
        break
      default:
        this.powerState.set(POWER_STATE_OFF)
    }
  }

  private loadPowerState(): void {
    // Use cached to dedupe simultaneous requests (KVM deep-link + toolbar both loading).
    this.fetchPowerState(this.devicesService.getPowerStateCached(this.deviceId()))
  }

  refreshPowerState(): void {
    // A manual refresh shows the device's actual state now, so stop waiting for a pending power action.
    this.stopPowerWatch()
    // Bypass the cache so manual refresh always fetches the latest state from the device.
    this.fetchPowerState(this.devicesService.getPowerState(this.deviceId()), () => {
      const msg: string = this.translate.instant('kvm.errorRetrievePower.value')
      this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
    })
  }

  private fetchPowerState(source: Observable<any>, onError?: () => void): void {
    this.powerFetchCancelled.next()
    this.isLoading().set(true)

    source
      .pipe(
        timeout({ first: POWER_READ_TIMEOUT_MS }),
        defaultIfEmpty({ powerstate: undefined }),
        catchError((err) => {
          if (onError) {
            console.error(err)
            onError()
          }
          // The old colour may no longer be true, so don't keep showing it.
          this.showUnknownPowerState()
          return EMPTY
        }),
        finalize(() => {
          this.isLoading().set(false)
        }),
        takeUntil(this.powerFetchCancelled),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((powerState) => {
        this.showPowerState(powerState?.powerstate)
      })
  }

  getDeviceCert(): void {
    this.devicesService
      .getDeviceCertificate(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.matDialog
          .open(DeviceCertDialogComponent, { data: { certData: data, isPinned: this.isPinned() } })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((pinned) => {
            if (pinned != null) {
              this.device.update((device) => (device ? { ...device, certHash: pinned ? 'yup' : '' } : device))
              this.isPinned.set(!!pinned)
            }
          })
      })
  }

  editDevice(): void {
    if (!environment.cloud) {
      const sub = this.matDialog.open(AddDeviceEnterpriseComponent, {
        height: '500px',
        width: '600px',
        data: this.device()
      })
      sub
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          window.location.reload()
          this.snackBar.open('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
        })
    }
  }

  sendPowerAction(action: number): void {
    if (action >= 100) {
      this.preprocessingForAuthorizedPowerAction(action)
    } else {
      this.executePowerAction(action)
    }
  }

  performHTTPBoot(action: number): void {
    this.devicesService
      .getAMTVersion(this.deviceId())
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((amtVersion) => {
        const isCCM = amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === PROVISIONING_MODE_CCM
        const dialogRef = this.dialog.open(HTTPBootDialogComponent, {
          width: '400px',
          disableClose: false,
          data: { isCCM }
        })

        dialogRef
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((bootDetails: BootDetails) => {
            if (!bootDetails) {
              return
            }
            this.executeAuthorizedPowerAction(action, false, bootDetails)
          })
      })
  }

  // Add this new method for PBA boot
  performPBABoot(action: number): void {
    forkJoin({
      amtVersion: this.devicesService.getAMTVersion(this.deviceId()).pipe(catchError(() => of(null))),
      sources: this.devicesService.getBootSources(this.deviceId())
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ amtVersion, sources }) => {
        const isCCM = amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === PROVISIONING_MODE_CCM
        const pbaSources = sources.filter((s) => s.biosBootString?.toLowerCase().includes('pba'))
        const dialogRef = this.dialog.open(PBABootDialogComponent, {
          width: '400px',
          disableClose: false,
          data: {
            pbaBootFilesPath: pbaSources,
            action: action,
            isCCM
          }
        })
        dialogRef
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((bootDetails: BootDetails) => {
            if (!bootDetails) {
              return
            }
            this.executeAuthorizedPowerAction(action, false, bootDetails)
          })
      })
  }

  performWinREBoot(action: number): void {
    const bootDetails: BootDetails = {
      enforceSecureBoot: true
    }
    this.executeAuthorizedPowerAction(action, false, bootDetails)
  }

  preprocessingForAuthorizedPowerAction(action?: number): void {
    // Handle specific action pre-processing
    switch (action) {
      case 105:
      case 106: // HTTP Boot action
        this.performHTTPBoot(action)
        break
      case 107:
      case 108: // PBA Boot action
        this.performPBABoot(action)
        break
      case 109:
      case 110: // WinRE Boot action
        this.performWinREBoot(action)
        break
      case 101: {
        // Reset to BIOS
        const useSOL = this.router.url.toString().includes('sol')
        this.executeAuthorizedPowerAction(action, useSOL)
        break
      }
      default:
        this.executeAuthorizedPowerAction(action)
        break
    }
  }

  executeAuthorizedPowerAction(action?: number, useSOL = false, bootDetails: BootDetails = {} as BootDetails): void {
    this.isLoading().set(true)
    this.devicesService
      .getAMTFeatures(this.deviceId())
      .pipe(
        switchMap((results: AMTFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
        switchMap((result: boolean) => {
          if (result) {
            return of(null)
          } else {
            return this.checkUserConsent()
          }
        }),
        switchMap((result: any) =>
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures() ?? undefined)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'PowerAction')
        )
      )
      .subscribe({
        next: () => {
          if (action !== undefined) {
            this.executePowerAction(action, useSOL, bootDetails)
          }
        },
        error: () => {
          const msg: string = this.translate.instant('devices.errorInitializing.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        },
        complete: () => {
          this.isLoading().set(false)
        }
      })
  }

  executePowerAction(action: number, useSOL = false, bootDetails: BootDetails = {} as BootDetails): void {
    this.isLoading().set(true)
    this.devicesService
      .sendPowerAction(this.deviceId(), action, useSOL, bootDetails)
      .pipe(
        catchError((err) => {
          console.error(err)
          const msg: string = this.translate.instant('devices.errorPowerAction.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return of(null)
        }),
        finalize(() => {
          this.isLoading().set(false)
        })
      )
      .subscribe((data) => {
        if (data == null) {
          return // request failed; the error is already shown
        }
        // MPS (cloud) wraps the AMT result in Body; Console returns it at the top level.
        const result = this.isCloudMode ? (data.Body?.RequestPowerStateChange_OUTPUT ?? data.Body) : data
        if (this.isCloudMode && result?.ReturnValueStr === 'NOT_READY') {
          const msg: string = this.translate.instant('devices.powerActionNotReady.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultWarn)
        } else if (result?.ReturnValue === 0) {
          const msg: string = this.translate.instant('devices.powerActionSent.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
          this.watchPowerTransition(action)
        } else {
          console.log('Power action failed:', data)
          const msg: string = this.translate.instant('devices.failPowerAction.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  async navigateTo(path: string): Promise<void> {
    const deviceId = this.deviceId()
    if (this.router.url === `/devices/${deviceId}` && path === 'devices') {
      await this.router.navigate(['/devices'])
    } else {
      await this.router.navigate([`/devices/${deviceId}/${path}`])
    }
  }

  sendDeactivate(): void {
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent)
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.isLoading().set(true)
          this.devicesService
            .sendDeactivate(this.deviceId())
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => {
                this.isLoading().set(false)
              })
            )
            .subscribe({
              next: () => {
                const msg: string = this.translate.instant('devices.deactivation.value')
                this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
                void this.navigateTo('devices')
              },
              error: (err) => {
                console.error(err)
                const msg: string = this.translate.instant('devices.errorDeactivation.value')
                this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
              }
            })
        }
      })
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures.set(results)
    if (this.amtFeatures()?.userConsent === 'None') {
      return of(true) // User consent is not required
    }
    return of(false)
  }

  checkUserConsent(): Observable<any> {
    if (
      this.amtFeatures()?.userConsent === 'none' ||
      this.amtFeatures()?.optInState === 3 ||
      this.amtFeatures()?.optInState === 4
    ) {
      return of(true)
    }
    return of(false)
  }

  public get deactivateRemoveAction(): string {
    return this.isCloudMode
      ? this.translate.instant('devices.actions.deactivateCloud.value')
      : this.translate.instant('devices.actions.remove.value')
  }
}
