/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { EventEmitter, Component, Input } from '@angular/core'

import { TestBed } from '@angular/core/testing'
import { MatSidenavModule } from '@angular/material/sidenav'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'

@Component({
  selector: 'app-toolbar'
})
class TestToolbarComponent {
  @Input()
  isLoading = false
}

describe('AppComponent', () => {
  beforeEach(async () => {
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>()
    }

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, MatSidenavModule
      ],
      declarations: [
        AppComponent, TestToolbarComponent
      ],
      providers: [{ provide: AuthService, useValue: authServiceStub }, {
        provide: Router,
        useValue: {
          events: of({})
        }
      }]

    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })
})
