/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTIDER } from '@device-management-toolkit/ui-toolkit/core'
import { getMediaSectorCount, patchAmtIderLargeMediaSupport } from './amt-ider-large-media'

const PATCH_FLAG = '__sampleWebUiLargeMediaPatched__'

interface IderContext {
  floppy: File | null
  cdrom: File | null
  sendCommandEndResponse: jasmine.Spy
  sendDiskDataEx: jasmine.Spy
  sectorStats: jasmine.Spy | null
  g_media: File | null
  g_readQueue: { media: File | null; dev: number; lba: number; len: number; fr: number }[]
  g_dev: number
  g_lba: number
  g_len: number
}

function makeFakeIder(cdromSizeBytes: number): IderContext {
  return {
    floppy: null,
    cdrom: { size: cdromSizeBytes } as File,
    sendCommandEndResponse: jasmine.createSpy('sendCommandEndResponse'),
    sendDiskDataEx: jasmine.createSpy('sendDiskDataEx'),
    sectorStats: jasmine.createSpy('sectorStats'),
    g_media: null,
    g_readQueue: [],
    g_dev: 0,
    g_lba: 0,
    g_len: 0
  }
}

describe('amt-ider-large-media', () => {
  const prototype = AMTIDER.prototype as any
  let originalSendDiskData: any

  beforeAll(() => {
    originalSendDiskData = prototype.sendDiskData
    patchAmtIderLargeMediaSupport()
  })

  afterAll(() => {
    prototype.sendDiskData = originalSendDiskData
    delete prototype[PATCH_FLAG]
  })

  it('computes sector counts without 32-bit overflow for large ISOs', () => {
    const iso = { size: 3 * 1024 * 1024 * 1024 } as File

    expect(getMediaSectorCount(iso, 2048)).toBe(1572864)
    expect(iso.size >> 11).toBeLessThan(0)
  })

  it('returns 0 for missing media', () => {
    expect(getMediaSectorCount(null, 2048)).toBe(0)
  })

  it('patching is idempotent and does not replace sendDiskData again', () => {
    const patchedSendDiskData = prototype.sendDiskData

    patchAmtIderLargeMediaSupport()

    expect(prototype.sendDiskData).toBe(patchedSendDiskData)
  })

  it('accepts valid large ISO requests and converts sector ranges to byte ranges', () => {
    const ctx = makeFakeIder(3 * 1024 * 1024 * 1024)
    const sendDiskData = prototype.sendDiskData as (device: number, lba: number, length: number, flag: number) => void
    const maxSector = getMediaSectorCount(ctx.cdrom, 2048) - 1

    sendDiskData.call(ctx, 176, maxSector, 1, 2)

    expect(ctx.sendCommandEndResponse).not.toHaveBeenCalled()
    expect(ctx.sectorStats).toHaveBeenCalledWith(1, 1, getMediaSectorCount(ctx.cdrom, 2048), maxSector, 1)
    expect(ctx.sendDiskDataEx).toHaveBeenCalledWith(2)
    expect(ctx.g_lba).toBe(maxSector * 2048)
    expect(ctx.g_len).toBe(2048)
  })

  it('retains small-media bounds checks and rejects out-of-range sector reads', () => {
    const ctx = makeFakeIder(2 * 2048)
    const sendDiskData = prototype.sendDiskData as (device: number, lba: number, length: number, flag: number) => void

    sendDiskData.call(ctx, 176, 2, 1, 0)

    expect(ctx.sendCommandEndResponse).toHaveBeenCalledWith(true, 5, 176, 33, 0)
    expect(ctx.sendDiskDataEx).not.toHaveBeenCalled()
  })

  it('returns success for zero-length reads', () => {
    const ctx = makeFakeIder(2048)
    const sendDiskData = prototype.sendDiskData as (device: number, lba: number, length: number, flag: number) => void

    sendDiskData.call(ctx, 176, 0, 0, 0)

    expect(ctx.sendCommandEndResponse).toHaveBeenCalledWith(true, 0, 176, 0, 0)
    expect(ctx.sendDiskDataEx).not.toHaveBeenCalled()
  })
})
