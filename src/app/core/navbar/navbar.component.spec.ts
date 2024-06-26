/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { NavbarComponent } from './navbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'

describe('NavbarComponent', () => {
  let component: NavbarComponent
  let fixture: ComponentFixture<NavbarComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatIconModule, MatDividerModule, MatListModule, RouterModule, NavbarComponent],
    providers: [{ provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } }]
    }).compileComponents()
    fixture = TestBed.createComponent(NavbarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
