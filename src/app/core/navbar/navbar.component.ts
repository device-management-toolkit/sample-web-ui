/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { environment } from '../../../environments/environment'
import { MatIcon } from '@angular/material/icon'
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router'
import { MatDivider } from '@angular/material/divider'
import { MatNavList, MatListItem, MatListItemIcon } from '@angular/material/list'
import { MatTooltip } from '@angular/material/tooltip'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { ServerFeaturesService } from '../../server-features.service'
import { filter } from 'rxjs/operators'

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    MatNavList,
    MatDivider,
    MatListItem,
    RouterLink,
    RouterLinkActive,
    MatIcon,
    MatListItemIcon,
    MatTooltip,
    TranslatePipe
  ]
})
export class NavbarComponent implements OnInit {
  cloudMode = environment.cloud
  showSubNav = false
  // CIRA tab visibility. Cloud (MPS+RPS) always shows it; in enterprise it is
  // driven by the Console server's APP_DISABLE_CIRA setting (fetched on init).
  // Start from cloudMode so enterprise hides the tab until the API responds,
  // avoiding a flash of the tab when the server reports CIRA disabled.
  ciraEnabled = signal(this.cloudMode)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly serverFeaturesService = inject(ServerFeaturesService)

  ngOnInit(): void {
    if (this.cloudMode === false) {
      this.refreshCiraAvailability()
      // Re-check server feature flags on navigation so runtime server setting
      // changes (like enabling CIRA) are reflected without full page reload.
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.refreshCiraAvailability()
      })
    }
  }

  private refreshCiraAvailability(): void {
    this.serverFeaturesService.getFeatures().subscribe({
      next: (features) => this.ciraEnabled.set(features.ciraEnabled),
      // Fail open: if the features call fails, keep the CIRA tab visible.
      error: () => this.ciraEnabled.set(true)
    })
  }

  get ciraTitle(): string {
    return this.ciraEnabled()
      ? this.translate.instant('configs.header.ciraTitle.value')
      : this.translate.instant('configs.header.noCiraTitle.value')
  }
}
