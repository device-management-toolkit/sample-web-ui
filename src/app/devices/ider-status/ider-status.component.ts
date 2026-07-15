/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, input } from '@angular/core'
import { MatIcon } from '@angular/material/icon'
import { MatProgressSpinner } from '@angular/material/progress-spinner'
import { TranslatePipe } from '@ngx-translate/core'

/**
 * Compact, reusable status strip for an IDE-Redirection (IDER) session.
 * Renders the live connection/transfer state so it can sit inline at the same
 * level as the "Attach Disk Image" action, in both the dedicated IDER tab
 * (ISM systems) and the KVM tab (vPro systems, which also run IDER).
 */
@Component({
  selector: 'app-ider-status',
  templateUrl: './ider-status.component.html',
  imports: [MatIcon, MatProgressSpinner, TranslatePipe]
})
export class IderStatusComponent {
  // Session is established and running.
  public readonly active = input(false)
  // Disk sectors are actively moving right now.
  public readonly transferring = input(false)
  // Connection is being set up (power/consent/token checks).
  public readonly connecting = input(false)
  // Translate key for the granular connecting status (e.g. checking power state).
  public readonly statusLabel = input('')
  // Cumulative bytes transferred during the session.
  public readonly bytes = input(0)
  // Optional translate key shown as a subtitle while idle (e.g. attach hint).
  public readonly idleHint = input('')

  // Human-readable byte count for the live transfer indicator.
  formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) {
      return '0 B'
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / Math.pow(1024, exponent)
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
  }
}
