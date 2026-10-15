/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { EmptyStateComponent } from './empty-state.component'

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent
  let fixture: ComponentFixture<EmptyStateComponent>
  const el = (): HTMLElement => fixture.nativeElement as HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(EmptyStateComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('icon', 'wifi')
    fixture.componentRef.setInput('title', 'No Wireless Configs')
  })

  it('should show the icon and title', () => {
    fixture.detectChanges()
    expect(el().querySelector('mat-icon')?.textContent?.trim()).toBe('wifi')
    expect(el().querySelector('h3')?.textContent?.trim()).toBe('No Wireless Configs')
  })

  it('should show the description when one is given', () => {
    fixture.componentRef.setInput('description', 'Add one, then attach it to a profile.')
    fixture.detectChanges()
    expect(el().querySelector('p')?.textContent?.trim()).toBe('Add one, then attach it to a profile.')
  })

  it('should leave out the description and the button when neither is given', () => {
    fixture.detectChanges()
    expect(el().querySelector('p')).toBeNull()
    expect(el().querySelector('button')).toBeNull()
  })

  it('should emit action when the button is clicked', () => {
    let emitted = 0
    component.action.subscribe(() => emitted++)
    fixture.componentRef.setInput('actionLabel', 'Add New')
    fixture.detectChanges()

    const button = el().querySelector('button')!
    expect(button.textContent).toContain('Add New')
    button.click()

    expect(emitted).toBe(1)
  })
})
