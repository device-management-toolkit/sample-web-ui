/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { SharedModule } from '../shared/shared.module'
import { NavbarComponent } from './navbar/navbar.component'
import { ToolbarComponent } from './toolbar/toolbar.component'

@NgModule({
  imports: [RouterModule, SharedModule],
  declarations: [NavbarComponent, ToolbarComponent],
  exports: [RouterModule, NavbarComponent, ToolbarComponent, SharedModule]
})
export class CoreModule {
  // constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
  // throwIfAlreadyLoaded(parentModule, 'CoreModule')
//  }
}
