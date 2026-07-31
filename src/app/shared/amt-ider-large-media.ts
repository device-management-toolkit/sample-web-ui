/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTIDER } from '@device-management-toolkit/ui-toolkit/core'

const FLOPPY_SECTOR_BYTES = 512
const CDROM_SECTOR_BYTES = 2048
const PATCH_FLAG = '__sampleWebUiLargeMediaPatched__'

type IderMedia = File | null

type PatchedAMTIDER = InstanceType<typeof AMTIDER> & {
  [PATCH_FLAG]?: boolean
  floppy: IderMedia
  cdrom: IderMedia
  sendCommand: (command: number, payload?: string, a?: boolean, i?: number) => void
  sendCommandEndResponse: (result: boolean, error: number, device: number, sense?: number, asc?: number) => void
  sendDiskDataEx: (flag: number) => void
  sectorStats: ((mode: number, dev: number, total: number, start: number, len: number) => void) | null
  g_media: IderMedia
  g_readQueue: { media: IderMedia; dev: number; lba: number; len: number; fr: number }[]
  g_dev: number
  g_lba: number
  g_len: number
  bytesToAmt: number
  bytesFromAmt: number
  floppyRead: number
  floppyWrite: number
  cdromRead: number
  cdromWrite: number
  inSequence: number
  outSequence: number
  rx_timeout: number
  tx_timeout: number
  heartbeat: number
  version: number
}

export function getMediaSectorCount(media: IderMedia, sectorBytes: number): number {
  if (media == null) {
    return 0
  }
  return Math.floor(media.size / sectorBytes)
}

export function patchAmtIderLargeMediaSupport(): void {
  const prototype = AMTIDER.prototype as PatchedAMTIDER
  if (prototype[PATCH_FLAG]) {
    return
  }

  prototype.sendDiskData = function patchedSendDiskData(
    this: PatchedAMTIDER,
    device: number,
    lba: number,
    length: number,
    flag: number
  ): void {
    const media = device === 160 ? this.floppy : this.cdrom
    const totalSectors =
      device === 160
        ? getMediaSectorCount(this.floppy, FLOPPY_SECTOR_BYTES)
        : getMediaSectorCount(this.cdrom, CDROM_SECTOR_BYTES)

    if (length < 0 || lba + length > totalSectors) {
      this.sendCommandEndResponse(true, 5, device, 33, 0)
      return
    }

    if (length === 0) {
      this.sendCommandEndResponse(true, 0, device, 0, 0)
      return
    }

    if (typeof this.sectorStats === 'function') {
      this.sectorStats(1, device === 160 ? 0 : 1, totalSectors, lba, length)
    }

    const byteOffset = device === 160 ? lba * FLOPPY_SECTOR_BYTES : lba * CDROM_SECTOR_BYTES
    const byteLength = device === 160 ? length * FLOPPY_SECTOR_BYTES : length * CDROM_SECTOR_BYTES

    if (this.g_media != null) {
      this.g_readQueue.push({ media, dev: device, lba: byteOffset, len: byteLength, fr: flag })
      return
    }

    this.g_media = media
    this.g_dev = device
    this.g_lba = byteOffset
    this.g_len = byteLength
    this.sendDiskDataEx(flag)
  }

  prototype[PATCH_FLAG] = true
}
