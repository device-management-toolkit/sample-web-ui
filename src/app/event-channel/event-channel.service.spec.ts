/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { IPacket } from 'mqtt-browser'
import { IMqttServiceOptions } from 'ngx-mqtt'
import { of, Subject } from 'rxjs'
import { MQTTEvent } from 'src/models/models'
import { MQTTService } from './event-channel.service'
import { Buffer } from 'buffer'
describe('EventChannelService', () => {
  const packet: IPacket = { cmd: 'publish' }
  let service: MQTTService
  let localStorageSetSpy: jasmine.Spy
  let resetSpy: jasmine.Spy
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
  const mqttservice = jasmine.createSpyObj('mqttService', ['observe', 'connect', 'destroy'])
  mqttservice.state = new Subject()
  mqttservice.observe.and.returnValue(of())

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: []
    })
    localStorageSetSpy = spyOn(localStorage, 'setItem').and.callThrough()
    service = new MQTTService(mqttservice)
  })
  afterEach(() => {
    localStorage.removeItem('oact_telemetry')
    localStorage.removeItem('oact_config')
  })
  it('should be created', () => {
    expect(service).toBeTruthy()
    expect(localStorageSetSpy).toHaveBeenCalled()
  })
  it('should load localStorage telemetry data on create', () => {
    localStorage.setItem('oact_telemetry', JSON.stringify([{ test: 'test' }]))
    const service2 = new MQTTService(mqttservice)
    service2.messageSource.subscribe(x => {
      expect(x).toEqual([{ test: 'test' }])
    })
    expect(service2.mqttEvents.length).toBe(1)
  })
  it('should load localStorage connection data on create', () => {
    localStorage.setItem('oact_config', JSON.stringify({ hostname: 'test', path: '/test', protocol: 'wss' }))

    const service2 = new MQTTService(mqttservice)
    expect(service2.mqttConfig).toEqual({ hostname: 'test', path: '/test', protocol: 'wss' })
  })

  it('should NOT change connection when same', () => {
    const same: IMqttServiceOptions = { hostname: 'localhost', path: '/mosquitto/mqtt', protocol: 'wss' }
    service.changeConnection(same)
    expect(service.clearData).toBeFalse()
  })

  it('should change connection when difference', () => {
    const different: IMqttServiceOptions = { hostname: 'localhost', path: '/mosquitto', protocol: 'wss' }
    service.changeConnection(different)
    expect(service.clearData).toBeTrue()
    expect(service.mqttService.connect).toHaveBeenCalled()
  })
  it('should process the message getting from MQTT', () => {
    let called = 0
    service.messageSource.subscribe(x => {
      called++
    })
    service.processMessage(data as any)
    expect(service.mqttEvents.length).toBe(1)
    expect(localStorageSetSpy).toHaveBeenCalled()
    expect(called).toBe(2)
  })
  it('should reset when 100 records', () => {
    for (let i = 0; i < 100; i++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      service.mqttEvents.push({} as MQTTEvent)
    }
    service.processMessage(data as any)
    expect(service.mqttEvents[0].guid).toEqual('d12428be-9fa1-4226-9784-54b2038beab6')
    expect(service.mqttEvents.length).toBe(100)
  })

  it('should refresh data if connection changed', () => {
    service.reset()
    expect(service.mqttEvents.length).toBe(0)
    expect(localStorageSetSpy).toHaveBeenCalledWith('oact_telemetry', '')
    expect(localStorageSetSpy).toHaveBeenCalledWith('oact_config', JSON.stringify({ hostname: 'localhost', path: '/mosquitto/mqtt', protocol: 'wss' }))
    expect(service.clearData).toBeFalse()
  })

  it('should connect', () => {
    service.connect()
    expect(service.mqttService.connect).toHaveBeenCalled()
  })
  it('should call reset when clearData true and connected', () => {
    resetSpy = spyOn(service, 'reset')

    service.clearData = true
    service.mqttService.state.next(2)
    expect(resetSpy).toHaveBeenCalled()
  })
  it('should subscribe to topic', () => {
    service.subscribeToTopic('test')
    expect(service.mqttService.observe).toHaveBeenCalledWith('test')
    expect(service.subscriptions.length).toBe(1)
  })
})
