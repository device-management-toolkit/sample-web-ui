import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { ConfigDetailComponent } from './configs/config-detail/config-detail.component'
import { ConfigsComponent } from './configs/configs.component'
import { AuditLogComponent } from './devices/audit-log/audit-log.component'
import { DeviceDetailComponent } from './devices/device-detail/device-detail.component'
import { DevicesComponent } from './devices/devices.component'
import { DomainDetailComponent } from './domains/domain-detail/domain-detail.component'
import { DomainsComponent } from './domains/domains.component'
import { ProfileDetailComponent } from './profiles/profile-detail/profile-detail.component'
import { ProfilesComponent } from './profiles/profiles.component'

const routes: Routes = [
  { path: 'devices', component: DevicesComponent },
  { path: 'devices/:id', component: DeviceDetailComponent },
  { path: 'devices/:id/audit-log', component: AuditLogComponent },
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
  { path: 'domains/:name', component: DomainDetailComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
