/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import { environment } from 'src/environments/environment'
import { MatIcon } from '@angular/material/icon'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatDivider } from '@angular/material/divider'
import { MatNavList, MatListItem, MatListItemIcon } from '@angular/material/list'
import { MatTooltip } from '@angular/material/tooltip'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

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
    TranslateModule
  ]
})
export class NavbarComponent {
  cloudMode = environment.cloud
  showSubNav = false
  private readonly translate = inject(TranslateService)

  get ciraTitle(): string {
    return this.cloudMode === false
      ? this.translate.instant('configs.header.noCiraTitle.value')
      : this.translate.instant('configs.header.ciraTitle.value')
  }
}
