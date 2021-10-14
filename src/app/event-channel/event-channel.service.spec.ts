/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { IPacket } from 'mqtt-browser'
import { EventChannelService } from './event-channel.service'

describe('EventChannelService', () => {
  const packet: IPacket = { cmd: 'publish' }
  let service: EventChannelService
  const encVal = Buffer.from(JSON.stringify({
    guid: 'd12428be-9fa1-4226-9784-54b2038beab6',
    message: 'Sent Power State',
    methods: ['AMT_PowerState'],
    timestamp: 1632390720490,
    type: 'success'
  }))

  const data = {
    cmd: packet.cmd,
    retain: false,
    qos: 0,
    dup: false,
    length: 158,
    topic: 'mps/events',
    payload: encVal
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: []
    })
    service = new EventChannelService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should process the message getting from MQTT', () => {
    service.processMessage(data as any)
  })

  it('should refres data if connection changed', () => {
    service.refreshData()
    service.eventChannelLogs.data = []
    expect(service.eventChannelLogs.data.length).toBe(0)
  })

  it('should check connection status', () => {
    spyOn(service.connectionStatusSource, 'next')
    service.connectionStatus(2)
    expect(service.connectionStatusSource.next).toHaveBeenCalled()
  })
})
