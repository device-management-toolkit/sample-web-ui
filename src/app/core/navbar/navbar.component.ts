/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { environment } from 'src/environments/environment'
import { MatIcon } from '@angular/material/icon'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatDivider } from '@angular/material/divider'
import { MatNavList, MatListItem, MatListItemIcon } from '@angular/material/list'

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: true,
    imports: [MatNavList, MatDivider, MatListItem, RouterLink, RouterLinkActive, MatIcon, MatListItemIcon]
})
export class NavbarComponent implements OnInit {
  cloudMode = environment.cloud
  showSubNav = false
  ngOnInit (): void {
  }
}
