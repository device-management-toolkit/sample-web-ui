/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { BreakpointObserver } from '@angular/cdk/layout'
import { LayoutService } from './layout.service'
import { Subject } from 'rxjs'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('LayoutService', () => {
  let service: LayoutService
  let breakpointObserver: any

  beforeEach(() => {
    const breakpointSubject = new Subject<{ matches: boolean }>()
    breakpointObserver = {
      observe: vi.fn().mockReturnValue(breakpointSubject.asObservable())
    }

    TestBed.configureTestingModule({
      providers: [LayoutService, { provide: BreakpointObserver, useValue: breakpointObserver }]
    })

    service = TestBed.inject(LayoutService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should track isHandset from BreakpointObserver', (context) => {
    const breakpointSubject = new Subject<{ matches: boolean }>()
    breakpointObserver.observe.mockReturnValue(breakpointSubject.asObservable())

    const layoutService = new LayoutService(breakpointObserver)

    expect(layoutService.isHandset()).toBe(false)

    breakpointSubject.next({ matches: true })
    expect(layoutService.isHandset()).toBe(true)

    breakpointSubject.next({ matches: false })
    expect(layoutService.isHandset()).toBe(false)
  })

  it('should toggle opened state', () => {
    expect(service.opened()).toBe(false)
    service.toggle()
    expect(service.opened()).toBe(true)
    service.toggle()
    expect(service.opened()).toBe(false)
  })

  it('should close drawer', () => {
    service.opened.set(true)
    expect(service.opened()).toBe(true)
    service.close()
    expect(service.opened()).toBe(false)
  })

  it('should set immersive state', () => {
    expect(service.immersive()).toBe(false)
    service.setImmersive(true)
    expect(service.immersive()).toBe(true)
    service.setImmersive(false)
    expect(service.immersive()).toBe(false)
  })
})
