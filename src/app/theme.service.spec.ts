/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ThemeService } from './theme.service'

describe('ThemeService', () => {
  const root = document.documentElement

  beforeEach(() => {
    TestBed.configureTestingModule({})
  })

  afterEach(() => {
    localStorage.removeItem('theme')
    localStorage.removeItem('palette')
    root.className = ''
  })

  describe('mode', () => {
    it('should follow the OS when nothing is stored', () => {
      const service = TestBed.inject(ThemeService)

      expect(service.mode()).toBe('system')
      expect(root.classList.contains('dark-theme')).toBe(false)
      expect(root.classList.contains('light-theme')).toBe(false)
    })

    it('should apply a stored dark mode', () => {
      localStorage.setItem('theme', 'dark')

      const service = TestBed.inject(ThemeService)

      expect(service.mode()).toBe('dark')
      expect(root.classList.contains('dark-theme')).toBe(true)
      expect(root.classList.contains('light-theme')).toBe(false)
    })

    it('should apply a stored light mode', () => {
      localStorage.setItem('theme', 'light')

      const service = TestBed.inject(ThemeService)

      expect(service.mode()).toBe('light')
      expect(root.classList.contains('light-theme')).toBe(true)
      expect(root.classList.contains('dark-theme')).toBe(false)
    })

    it('should follow the OS when system is stored', () => {
      localStorage.setItem('theme', 'system')

      const service = TestBed.inject(ThemeService)

      expect(service.mode()).toBe('system')
      expect(root.classList.contains('dark-theme')).toBe(false)
      expect(root.classList.contains('light-theme')).toBe(false)
    })

    it('should follow the OS when the stored mode is not recognised', () => {
      localStorage.setItem('theme', 'sepia')

      const service = TestBed.inject(ThemeService)

      expect(service.mode()).toBe('system')
      expect(root.classList.contains('sepia-theme')).toBe(false)
    })

    it('should switch to dark and remember it', () => {
      const service = TestBed.inject(ThemeService)

      service.setMode('dark')

      expect(service.mode()).toBe('dark')
      expect(root.classList.contains('dark-theme')).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should replace dark with light', () => {
      const service = TestBed.inject(ThemeService)
      service.setMode('dark')

      service.setMode('light')

      expect(root.classList.contains('light-theme')).toBe(true)
      expect(root.classList.contains('dark-theme')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('should take over a mode class set before the app started', () => {
      localStorage.setItem('theme', 'system')
      root.classList.add('system-theme')
      const service = TestBed.inject(ThemeService)

      service.setMode('dark')

      expect(root.classList.contains('system-theme')).toBe(false)
      expect(root.classList.contains('dark-theme')).toBe(true)
    })

    it('should go back to following the OS and remember it', () => {
      const service = TestBed.inject(ThemeService)
      service.setMode('dark')

      service.setMode('system')

      expect(service.mode()).toBe('system')
      expect(root.classList.contains('dark-theme')).toBe(false)
      expect(root.classList.contains('light-theme')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('system')
    })
  })

  describe('palette', () => {
    it('should use azure when nothing is stored', () => {
      const service = TestBed.inject(ThemeService)

      expect(service.palette()).toBe('azure')
      expect(root.classList.contains('azure-palette')).toBe(true)
    })

    it('should apply a stored palette', () => {
      localStorage.setItem('palette', 'rose')

      const service = TestBed.inject(ThemeService)

      expect(service.palette()).toBe('rose')
      expect(root.classList.contains('rose-palette')).toBe(true)
      expect(root.classList.contains('azure-palette')).toBe(false)
    })

    it('should use azure when the stored palette is not recognised', () => {
      localStorage.setItem('palette', 'teal')

      const service = TestBed.inject(ThemeService)

      expect(service.palette()).toBe('azure')
      expect(root.classList.contains('azure-palette')).toBe(true)
      expect(root.classList.contains('teal-palette')).toBe(false)
    })

    it('should switch palette and remember it', () => {
      const service = TestBed.inject(ThemeService)

      service.setPalette('magenta')

      expect(service.palette()).toBe('magenta')
      expect(root.classList.contains('magenta-palette')).toBe(true)
      expect(root.classList.contains('azure-palette')).toBe(false)
      expect(localStorage.getItem('palette')).toBe('magenta')
    })

    it('should keep the mode when the palette changes', () => {
      const service = TestBed.inject(ThemeService)
      service.setMode('dark')

      service.setPalette('cyan')

      expect(root.classList.contains('dark-theme')).toBe(true)
      expect(root.classList.contains('cyan-palette')).toBe(true)
    })
  })
})
