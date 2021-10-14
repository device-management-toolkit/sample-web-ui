/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { NavigationStart, Router } from '@angular/router'
import { AuthService } from './auth.service'
import { IMqttMessage, IMqttServiceOptions, MqttService } from 'ngx-mqtt'
import { Subscription } from 'rxjs'
import { EventChannelService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoggedIn = false
  public mpsSubscription!: Subscription
  public rpsSubscription!: Subscription
  public isDefault: boolean = true
  public getDefaultConfig = localStorage.getItem('oact_config') ?? localStorage.setItem('oact_config', JSON.stringify({ hostname: 'localhost', port: 9001, path: '/mqtt' }))
  public defaultConfig = this.getDefaultConfig ? JSON.parse(this.getDefaultConfig) : { hostname: 'localhost', port: 9001, path: '/mqtt' }

  constructor (public router: Router, public authService: AuthService, public mqttService: MqttService, public eventChannelService: EventChannelService
  ) {
    this.eventChannelService.reconnectMqttService.subscribe((params: IMqttServiceOptions) => {
      if (localStorage.getItem('oact_config') !== JSON.stringify(params)) {
        this.mpsSubscription.unsubscribe()
        this.rpsSubscription.unsubscribe()
        this.isDefault = false
        localStorage.setItem('oact_telemetry', '')
        localStorage.setItem('oact_config', JSON.stringify(params))
        this.eventChannelService.refreshData()
        this.mqttService.connect(params)
        this.mqttService.state.subscribe(state => this.eventChannelService.connectionStatus(state))
        this.mpsSubscription = this.mqttService.observe('mps/#').subscribe((message: IMqttMessage) => {
          this.eventChannelService.processMessage(message)
        })
        this.rpsSubscription = this.mqttService.observe('rps/#').subscribe((message: IMqttMessage) => {
          this.eventChannelService.processMessage(message)
        })
      }
    })
    if (this.isDefault) {
      this.mqttService.connect(this.defaultConfig)
      this.mqttService.state.subscribe(state => this.eventChannelService.connectionStatus(state))
      this.mpsSubscription = this.mqttService.observe('mps/#').subscribe((message: IMqttMessage) => {
        this.eventChannelService.processMessage(message)
      })
      this.rpsSubscription = this.mqttService.observe('rps/#').subscribe((message: IMqttMessage) => {
        this.eventChannelService.processMessage(message)
      })
    }
  }

  ngOnInit (): void {
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
    })
  }

  ngAfterViewInit (): void {
    this.router.events.subscribe(val => {
      this.isLoggedIn = this.authService.isLoggedIn
      if (val instanceof NavigationStart) {
        // if not logged in
        if (!this.isLoggedIn && val.url !== '/login') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate(['login'])
        }
      }
    })
  }

  ngOnDestroy (): void {
    this.mpsSubscription.unsubscribe()
    this.rpsSubscription.unsubscribe()
  }
}
