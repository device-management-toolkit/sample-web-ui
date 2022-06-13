/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { AuthorizeInterceptor } from './authorize.interceptor'
import { Router } from '@angular/router'

describe('AuthorizeInterceptor', () => {
  const routerSpy: any = jasmine.createSpyObj('Router', ['navigate'])
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, MatDialogModule],
    providers: [
      AuthorizeInterceptor,
      { provide: MAT_DIALOG_DATA, useValue: {} },
      { provide: MatDialogRef, useValue: {} },
      { provide: Router, useValue: routerSpy }
    ]
  }))

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    const interceptor: AuthorizeInterceptor = TestBed.inject(AuthorizeInterceptor)
    expect(interceptor).toBeTruthy()
  })
})
