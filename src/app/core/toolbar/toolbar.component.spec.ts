/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/auth.service'
import { ToolbarComponent } from './toolbar.component'
import { BehaviorSubject, of } from 'rxjs'

describe('ToolbarComponent', () => {
  let component: ToolbarComponent
  let fixture: ComponentFixture<ToolbarComponent>
  let authService: jasmine.SpyObj<AuthService>
  let getMPSVersionSpy: jasmine.Spy
  let getRPSVersionSpy: jasmine.Spy
  // let getConsoleVersionSpy: jasmine.Spy
  // let logoutSpy: jasmine.Spy
  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    authService = jasmine.createSpyObj('AuthService', [
      'logout',
      'getMPSVersion',
      'getRPSVersion',
      'getConsoleVersion'
    ])
    getMPSVersionSpy = authService.getMPSVersion.and.returnValue(of({}))
    getRPSVersionSpy = authService.getRPSVersion.and.returnValue(of({}))
    // getConsoleVersionSpy = authService.getConsoleVersion.and.returnValue(of({}))
    const authServiceStub = {
      loggedInSubject$: new BehaviorSubject<boolean>(true)
    }

    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: { ...authServiceStub, ...authService } }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(ToolbarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.isLoggedIn).toBeTrue()
  })

  it('should display dialog', () => {
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open')
    component.displayAbout()
    expect(dialogSpy).toHaveBeenCalled()
  })

  it('should logout and redirect to login page', () => {
    component.logout()
    expect(authService.logout).toHaveBeenCalled()
  })

  it('should call getMPSVersion', () => {
    expect(component).toBeTruthy()
    expect(getMPSVersionSpy).toHaveBeenCalled()
  })

  it('should call getRPSVersion', () => {
    expect(component).toBeTruthy()
    expect(getRPSVersionSpy).toHaveBeenCalled()
  })

  it('should subscribe to loggedInSubject on init', () => {
    component.authService.loggedInSubject$.next(true)
    fixture.detectChanges()
    expect(component.isLoggedIn).toBeTruthy()
  })
})
