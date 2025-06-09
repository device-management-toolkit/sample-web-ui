/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import { NgModule, provideZonelessChangeDetection } from '@angular/core'
import { getTestBed } from '@angular/core/testing'
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing'
@NgModule({
  providers: [provideZonelessChangeDetection()]
})
export class ZonelessTestModule {}
// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment([BrowserDynamicTestingModule, ZonelessTestModule], platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: false }
})
