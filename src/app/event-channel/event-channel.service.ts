/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// import { Injectable } from '@angular/core'
// import { IMqttMessage, IMqttServiceOptions, MqttService } from 'ngx-mqtt'
// import { BehaviorSubject, Subscription } from 'rxjs'
// import { MQTTEvent } from 'src/models/models'

// @Injectable({
//   providedIn: 'root'
// })

// export class MQTTService {
//   public mqttConfig: IMqttServiceOptions = { hostname: 'localhost', path: '/mosquitto/mqtt', protocol: 'wss' }
//   public mqttEvents: MQTTEvent[] = []
//   public messageSource = new BehaviorSubject<any>(this.mqttEvents)
//   public connectionStatusSubject = new BehaviorSubject<number>(0)
//   public clearData = false
//   public subscriptions: Subscription[] = []
//   constructor (public mqttService: MqttService) {
//     const localStorageData = localStorage.getItem('oact_telemetry')
//     if (localStorageData != null && localStorageData !== '') {
//       this.mqttEvents = JSON.parse(localStorageData)
//       this.messageSource.next(this.mqttEvents)
//     }

//     const localMQTTConfig = localStorage.getItem('oact_config')
//     if (localMQTTConfig != null && localMQTTConfig !== '') {
//       this.mqttConfig = JSON.parse(localMQTTConfig)
//     } else {
//       localStorage.setItem('oact_config', JSON.stringify(this.mqttConfig))
//     }

//     this.mqttService.state.subscribe(state => {
//       this.connectionStatusSubject.next(state)
//       if (this.clearData && state === 2) {
//         this.reset()
//       }
//     })
//   }

//   processMessage (message: IMqttMessage): void {
//     this.mqttEvents.splice(0, 0, JSON.parse(message.payload.toString()))
//     if (this.mqttEvents.length > 100) {
//       this.mqttEvents = this.mqttEvents.slice(0, 100)
//     }
//     localStorage.setItem('oact_telemetry', JSON.stringify(this.mqttEvents))
//     this.messageSource.next(this.mqttEvents)
//   }

//   changeConnection (mqttNewParams: IMqttServiceOptions): void {
//     if (JSON.stringify(this.mqttConfig) !== JSON.stringify(mqttNewParams)) {
//       this.mqttConfig = mqttNewParams
//       this.clearData = true
//       this.connect()
//     }
//   }

//   reset (): void {
//     localStorage.setItem('oact_telemetry', '')
//     localStorage.setItem('oact_config', JSON.stringify(this.mqttConfig))
//     this.mqttEvents = []
//     this.messageSource.next(this.mqttEvents)
//     this.clearData = false
//     this.destroy()
//     this.subscribeToTopic('mps/#')
//     this.subscribeToTopic('rps/#')
//   }

//   connect (): void {
//     this.mqttService.connect(this.mqttConfig)
//   }

//   subscribeToTopic (topic: string): void {
//     const sub = this.mqttService.observe(topic).subscribe((message: IMqttMessage) => {
//       this.processMessage(message)
//     })
//     this.subscriptions.push(sub)
//   }

//   destroy (): void {
//     this.subscriptions.forEach(x => x.unsubscribe())
//     this.subscriptions = []
//   }
// }
