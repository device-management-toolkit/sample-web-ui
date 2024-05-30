/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { ConfigDetailComponent } from './configs/config-detail/config-detail.component'
import { ConfigsComponent } from './configs/configs.component'
import { AuditLogComponent } from './devices/audit-log/audit-log.component'
import { DeviceDetailComponent } from './devices/device-detail/device-detail.component'
import { DevicesComponent } from './devices/devices.component'
import { EventLogComponent } from './devices/event-log/event-log.component'
import { KvmComponent } from './devices/kvm/kvm.component'
import { SolComponent } from './devices/sol/sol.component'
import { DomainDetailComponent } from './domains/domain-detail/domain-detail.component'
import { DomainsComponent } from './domains/domains.component'
// import { EventChannelComponent } from './event-channel/event-channel.component'
import { ProfileDetailComponent } from './profiles/profile-detail/profile-detail.component'
import { ProfilesComponent } from './profiles/profiles.component'
import { WirelessDetailComponent } from './wireless/wireless-detail/wireless-detail.component'
import { WirelessComponent } from './wireless/wireless.component'
import { IEEE8021xComponent } from './ieee8021x/ieee8021x.component'
import { IEEE8021xDetailComponent } from './ieee8021x/ieee8021x-detail/ieee8021x-detail.component'
import { ExplorerComponent } from './explorer/explorer.component'

const routes: Routes = [
  { path: 'devices', component: DevicesComponent },
  { path: 'devices/:id', component: DeviceDetailComponent },
  { path: 'devices/:id/audit-log', component: AuditLogComponent },
  { path: 'devices/:id/event-log', component: EventLogComponent },
  { path: 'devices/:id/kvm', component: KvmComponent },
  { path: 'devices/:id/sol', component: SolComponent },
  { path: 'devices/:id/explorer', component: ExplorerComponent },
  { path: 'profiles', component: ProfilesComponent },
  {
    path: 'profiles/new',
    children: [
      { path: '', component: ProfileDetailComponent }
    ]
  },
  { path: 'profiles/:name', component: ProfileDetailComponent },
  { path: 'ciraconfigs', component: ConfigsComponent },
  {
    path: 'ciraconfigs/new',
    children: [
      { path: '', component: ConfigDetailComponent }
    ]
  },
  { path: 'ciraconfigs/:name', component: ConfigDetailComponent },
  { path: 'domains', component: DomainsComponent },
  {
    path: 'domains/new',
    children: [
      { path: '', component: DomainDetailComponent }
    ]
  },
  { path: 'domains/:name', component: DomainDetailComponent },
  { path: 'wireless', component: WirelessComponent },
  {
    path: 'wireless/new',
    children: [
      { path: '', component: WirelessDetailComponent }
    ]
  },
  { path: 'wireless/:name', component: WirelessDetailComponent },
  { path: 'ieee8021x', component: IEEE8021xComponent },
  {
    path: 'ieee8021x/new',
    children: [
      { path: '', component: IEEE8021xDetailComponent }
    ]
  },
  { path: 'ieee8021x/:name', component: IEEE8021xDetailComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
