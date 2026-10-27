/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Injectable, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly breakpointObserver = inject(BreakpointObserver)

  isHandset = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).pipe(
      map((result) => result.matches)
    ),
    { initialValue: false }
  )

  opened = signal(false)
  immersive = signal(false)

  toggle(): void {
    this.opened.update((value) => !value)
  }

  close(): void {
    this.opened.set(false)
  }

  setImmersive(value: boolean): void {
    this.immersive.set(value)
  }
}
