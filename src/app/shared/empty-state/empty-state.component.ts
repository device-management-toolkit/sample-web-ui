/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, input, output } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'

// Shown in place of an empty list: what the page holds and, optionally, a button to add the first item.
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  imports: [
    MatButton,
    MatIcon
  ]
})
export class EmptyStateComponent {
  public readonly icon = input('')
  public readonly title = input('')
  public readonly description = input('')
  // The button is left out when no label is given.
  public readonly actionLabel = input('')
  public readonly action = output()
}
