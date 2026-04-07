/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * MPS Console REST API — Power Control Fixtures
 *
 * Defines the standard AMT/CIM power action codes and power state values used
 * by the MPS Console API.
 *
 * API reference:
 *   POST /api/v1/amt/power/action/:guid  body: { action: <code> }
 *   GET  /api/v1/amt/power/state/:guid
 *   GET  /api/v1/amt/power/capabilities/:guid
 *
 * Source of truth:
 *   Action codes  — console/internal/usecase/devices/power.go  determinePowerCapabilities()
 *   State values  — go-wsman-messages/v2 pkg/wsman/cim/power/decoder.go
 */

// ─── Power Action Codes ───────────────────────────────────────────────────────

/**
 * Numeric codes sent in POST /api/v1/amt/power/action/{guid} body.action
 *
 * Verified against GET /api/v1/amt/power/capabilities response and
 * console/internal/usecase/devices/power.go determinePowerCapabilities().
 *
 * OOB  = Out-of-Band  (AMT hardware command; works even when OS is off/suspended)
 * IB   = In-Band      (requires OS agent to be running; will not work from S4/S5)
 */
export const PowerActions = {
  // ── Core OOB actions (always available) ───────────────────────────────────
  /** OOB — Cold power on. Works from S4 (Hibernate) and S5 (Off). */
  PowerUp: 2,
  /** OOB — Hard power cycle (immediate off → on). No OS involvement. */
  PowerCycle: 5,
  /** OOB — Hard power off (immediate cut to S5). No OS involvement. */
  PowerDown: 8,
  /** OOB — Hard reset (immediate reboot). No OS involvement. */
  Reset: 10,

  // ── In-band OS-assisted actions (requires OS + AMT agent running) ─────────
  /** IB — Requests OS graceful shutdown (S5). Requires running OS. */
  SoftOff: 12,
  /** IB — Requests OS graceful restart. Requires running OS. */
  SoftReset: 14,
  /** IB — Requests OS to enter Sleep (S3, suspend-to-RAM). Requires running OS. */
  Sleep: 4,
  /** IB — Requests OS to Hibernate (S4, suspend-to-disk). Requires running OS. */
  Hibernate: 7,

  // ── Boot-to-target actions ─────────────────────────────────────────────────
  /** OOB — Power on and boot into BIOS setup. */
  PowerOnToBIOS: 100,
  /** OOB — Reset and boot into BIOS setup. */
  ResetToBIOS: 101,
  /** OOB — Reset and boot from IDE-R Floppy image. */
  ResetToIDERFloppy: 200,
  /** OOB — Power on and boot from IDE-R Floppy image. */
  PowerOnToIDERFloppy: 201,
  /** OOB — Reset and boot from IDE-R CD-ROM image. */
  ResetToIDERCDROM: 202,
  /** OOB — Power on and boot from IDE-R CD-ROM image. */
  PowerOnToIDERCDROM: 203,
  /** OOB — Reset and boot via PXE. */
  ResetToPXE: 400,
  /** OOB — Power on and boot via PXE. */
  PowerOnToPXE: 401,

  // ── IPS OS power-saving state transitions ─────────────────────────────────
  /** IPS OOB — Transition OS power-saving state to Full Power (wake from S1–S3). */
  OsToFullPower: 500,
  /** IPS IB — Transition OS to power-saving mode. */
  OsToPowerSaving: 501
} as const

// ─── Power State Values ───────────────────────────────────────────────────────

/**
 * Numeric values returned in GET /api/v1/amt/power/state/{guid} .powerstate
 * Source of truth: go-wsman-messages/v2 pkg/wsman/cim/power/decoder.go
 */
export const PowerStateValues = {
  Unknown: 0,
  /** Device is fully powered on and running */
  On: 2,
  /** Sleep — Light (S1 or S2) */
  SleepLight: 3,
  /** Sleep — Deep (S3, suspend-to-RAM) */
  SleepDeep: 4,
  /** Power Cycle — Off Hard (OOB hard power cycle: off then on) */
  PowerCycleOffHard: 5,
  /** Power Cycle — Off Soft */
  PowerCycleOffSoft: 6,
  /** Hibernate (S4, suspend-to-disk). Device powers off after saving RAM to disk. */
  Hibernate: 7,
  /** Power Off — Hard (immediate OOB power cut, S5) */
  PowerOffHard: 8,
  /** Power Off — Soft (graceful OS shutdown completed, S5) */
  PowerOffSoft: 9,
  /** Master Bus Reset (OOB hard reboot) */
  MasterBusReset: 10,
  /** Diagnostic Interrupt — NMI */
  DiagnosticInterruptNMI: 11,
  /** Power Off — Soft Graceful (transitioning to soft-off) */
  PowerOffSoftGraceful: 12,
  /** Power Off — Hard Graceful (transitioning to hard-off) */
  PowerOffHardGraceful: 13,
  /** Master Bus Reset — Graceful */
  MasterBusResetGraceful: 14,
  /** Power Cycle — Off Soft Graceful */
  PowerCycleOffSoftGraceful: 15,
  /** Power Cycle — Off Hard Graceful */
  PowerCycleOffHardGraceful: 16
} as const

// ─── Human-Readable Labels ────────────────────────────────────────────────────

/** Maps action code → display name (used in test log output) */
export const PowerActionLabels: Record<number, string> = {
  // Core OOB
  2: 'Power Up',
  5: 'Power Cycle',
  8: 'Power Down',
  10: 'Reset',
  // In-band OS-assisted
  4: 'Sleep',
  7: 'Hibernate',
  12: 'Soft-Off',
  14: 'Soft Reset',
  // Boot-to-target
  100: 'Power On to BIOS',
  101: 'Reset to BIOS',
  200: 'Reset to IDE-R Floppy',
  201: 'Power On to IDE-R Floppy',
  202: 'Reset to IDE-R CDROM',
  203: 'Power On to IDE-R CDROM',
  400: 'Reset to PXE',
  401: 'Power On to PXE',
  // IPS OS power-saving
  500: 'OS to Full Power (Wake)',
  501: 'OS to Power Saving'
}

/** Maps power state integer → display name (used in test log output) */
export const PowerStateLabels: Record<number, string> = {
  0: 'Unknown',
  2: 'On',
  3: 'Sleep Light (S1/S2)',
  4: 'Sleep Deep (S3)',
  5: 'Power Cycle (Off-Hard)',
  6: 'Power Cycle (Off-Soft)',
  7: 'Hibernate (S4)',
  8: 'Power Off - Hard',
  9: 'Power Off - Soft',
  10: 'Master Bus Reset',
  11: 'Diagnostic Interrupt (NMI)',
  12: 'Power Off - Soft Graceful',
  13: 'Power Off - Hard Graceful',
  14: 'Master Bus Reset Graceful',
  15: 'Power Cycle (Off-Soft Graceful)',
  16: 'Power Cycle (Off-Hard Graceful)'
}

// ─── Off-state helper ─────────────────────────────────────────────────────────

/**
 * Array of all powerstate values that represent a powered-off device.
 * Used as targetStates in pollMpsPowerState() when waiting for shutdown.
 */
export const OFF_STATES: number[] = [
  PowerStateValues.PowerOffHard,
  PowerStateValues.PowerOffSoft,
  PowerStateValues.PowerOffSoftGraceful,
  PowerStateValues.PowerOffHardGraceful
]

/**
 * Array of all powerstate values that represent a sleeping device (S1–S3).
 * Used as targetStates in pollMpsPowerState() when waiting for sleep.
 */
export const SLEEP_STATES: number[] = [
  PowerStateValues.SleepLight,
  PowerStateValues.SleepDeep
]

// ─── IPS OS Power Saving State ────────────────────────────────────────────────

/**
 * Numeric values for IPS_PowerManagementService.OSPowerSavingState returned in
 * GET /api/v1/amt/power/state/{guid} .osPowerSavingState
 *
 * Source: go-wsman-messages/v2 pkg/wsman/ips/power/decoder.go
 *   Unknown       = 0  // Unknown OS Power Saving State (also returned on error)
 *   Unsupported   = 1  // Feature not supported on this platform
 *   FullPower     = 2  // OS is in full-power mode
 *   OSPowerSaving = 3  // OS is in a power-saving mode
 */
export const OsPowerSavingStateValues = {
  Unknown: 0,
  Unsupported: 1,
  FullPower: 2,
  OsPowerSaving: 3
} as const

/** Maps osPowerSavingState integer → display name */
export const OsPowerSavingStateLabels: Record<number, string> = {
  0: 'Unknown',
  1: 'Unsupported',
  2: 'Full Power',
  3: 'OS Power Saving'
}
