/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Routes } from '@angular/router'
import { ConfigDetailComponent } from './configs/config-detail/config-detail.component'
import { ConfigsComponent } from './configs/configs.component'
import { DeviceDetailComponent } from './devices/device-detail/device-detail.component'
import { DevicesComponent } from './devices/devices.component'
import { DomainDetailComponent } from './domains/domain-detail/domain-detail.component'
import { DomainsComponent } from './domains/domains.component'
// import { EventChannelComponent } from './event-channel/event-channel.component'
import { ProfileDetailComponent } from './profiles/profile-detail/profile-detail.component'
import { ProfilesComponent } from './profiles/profiles.component'
import { WirelessDetailComponent } from './wireless/wireless-detail/wireless-detail.component'
import { WirelessComponent } from './wireless/wireless.component'
import { IEEE8021xComponent } from './ieee8021x/ieee8021x.component'
import { IEEE8021xDetailComponent } from './ieee8021x/ieee8021x-detail/ieee8021x-detail.component'
import { DashboardComponent } from './dashboard/dashboard.component'
import { LoginComponent } from './login/login.component'
import { AuthGuard } from './shared/auth-guard.service'

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  { path: 'devices', component: DevicesComponent, canActivate: [AuthGuard] },
  { path: 'devices/:id', component: DeviceDetailComponent, canActivate: [AuthGuard] },
  { path: 'devices/:id/:component', component: DeviceDetailComponent, canActivate: [AuthGuard] },
  { path: 'profiles', component: ProfilesComponent, canActivate: [AuthGuard] },
  {
    path: 'profiles/new',
    children: [
      { path: '', component: ProfileDetailComponent }],
    canActivate: [AuthGuard]
  },
  { path: 'profiles/:name', component: ProfileDetailComponent, canActivate: [AuthGuard] },
  { path: 'ciraconfigs', component: ConfigsComponent, canActivate: [AuthGuard] },
  {
    path: 'ciraconfigs/new',
    children: [
      { path: '', component: ConfigDetailComponent }],
    canActivate: [AuthGuard]
  },
  { path: 'ciraconfigs/:name', component: ConfigDetailComponent, canActivate: [AuthGuard] },
  { path: 'domains', component: DomainsComponent, canActivate: [AuthGuard] },
  {
    path: 'domains/new',
    children: [
      { path: '', component: DomainDetailComponent }],
    canActivate: [AuthGuard]
  },
  { path: 'domains/:name', component: DomainDetailComponent, canActivate: [AuthGuard] },
  { path: 'wireless', component: WirelessComponent, canActivate: [AuthGuard] },
  {
    path: 'wireless/new',
    children: [
      { path: '', component: WirelessDetailComponent }],
    canActivate: [AuthGuard]
  },
  { path: 'wireless/:name', component: WirelessDetailComponent, canActivate: [AuthGuard] },
  { path: 'ieee8021x', component: IEEE8021xComponent, canActivate: [AuthGuard] },
  {
    path: 'ieee8021x/new',
    children: [
      { path: '', component: IEEE8021xDetailComponent }],
    canActivate: [AuthGuard]
  },
  { path: 'ieee8021x/:name', component: IEEE8021xDetailComponent, canActivate: [AuthGuard] }
]
