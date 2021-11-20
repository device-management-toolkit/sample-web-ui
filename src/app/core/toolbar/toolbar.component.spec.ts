/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/auth.service'
import { SharedModule } from 'src/app/shared/shared.module'
import { ToolbarComponent } from './toolbar.component'

describe('ToolbarComponent', () => {
  let component: ToolbarComponent
  let fixture: ComponentFixture<ToolbarComponent>
  let authService: { logout: any }
  // let logoutSpy: jasmine.Spy
  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    authService = jasmine.createSpyObj('AuthService', ['logout'])
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>(false)
    }

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [ToolbarComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: { ...authServiceStub, ...authService } }
      ]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.isLoggedIn).toBeFalse()
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

  it('should subscribe to loggedInSubject on init', () => {
    component.authService.loggedInSubject.next(true)
    fixture.detectChanges()
    expect(component.isLoggedIn).toBeTruthy()
  })
})
