/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnDestroy } from '@angular/core'

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnDestroy {
  doNotShowAgain: boolean = false

  ngOnInit (): void {
    const storedValue = localStorage.getItem('doNotShowAgain')
    this.doNotShowAgain = storedValue ? JSON.parse(storedValue) : false
  }

  ngOnDestroy (): void {
    localStorage.setItem('doNotShowAgain', JSON.stringify(this.doNotShowAgain))
  }
}
