/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Injectable, signal } from '@angular/core'

export const themeModes = [
  'system',
  'light',
  'dark'
] as const
export type ThemeMode = (typeof themeModes)[number]

export const palettes = [
  'azure',
  'rose',
  'magenta',
  'cyan'
] as const
export type Palette = (typeof palettes)[number]

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public readonly mode = signal<ThemeMode>('system')
  public readonly palette = signal<Palette>('azure')

  constructor() {
    const mode = localStorage.getItem('theme')
    const palette = localStorage.getItem('palette')
    this.applyMode(themeModes.find((name) => name === mode) ?? 'system')
    this.applyPalette(palettes.find((name) => name === palette) ?? 'azure')
  }

  setMode(mode: ThemeMode): void {
    localStorage.setItem('theme', mode)
    this.applyMode(mode)
  }

  setPalette(palette: Palette): void {
    localStorage.setItem('palette', palette)
    this.applyPalette(palette)
  }

  // system-theme has no styles of its own, so the stylesheet follows the OS.
  private applyMode(mode: ThemeMode): void {
    const classes = document.documentElement.classList
    themeModes.forEach((name) => classes.toggle(`${name}-theme`, name === mode))
    this.mode.set(mode)
  }

  private applyPalette(palette: Palette): void {
    const classes = document.documentElement.classList
    palettes.forEach((name) => classes.toggle(`${name}-palette`, name === palette))
    this.palette.set(palette)
  }
}
