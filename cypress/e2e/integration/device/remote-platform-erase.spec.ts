/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { eventLogs } from '../../fixtures/api/eventlog'

const describeWhenNotCloud = Cypress.expose('CLOUD') ? describe.skip : describe

const navigateToRemotePlatformErase = (
  featuresBody: object = eventLogs.remotePlatformErase.supportedDisabled.response
): void => {
  cy.myIntercept('GET', /.*amt\/features.*/, {
    statusCode: httpCodes.SUCCESS,
    body: featuresBody
  }).as('get-features')

  // Console mode appends a tab filter (e.g. &activated=true), so match the prefix
  cy.myIntercept('GET', /devices\?\$top=25&\$skip=0&\$count=true/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.devices.success.response
  }).as('get-devices')

  cy.myIntercept('GET', /devices\/.*$/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.devices.success.response
  }).as('get-device-by-id')

  cy.myIntercept('GET', /devices\/tags/, {
    statusCode: httpCodes.SUCCESS,
    body: []
  }).as('get-tags')

  cy.myIntercept('GET', /.*power.*/, {
    statusCode: httpCodes.SUCCESS,
    body: { powerstate: 2 }
  }).as('get-powerstate')

  cy.myIntercept('GET', /.*general.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.general.success.response
  }).as('get-general')

  cy.myIntercept('GET', /.*version.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.version.success.response
  }).as('get-version')

  cy.myIntercept('GET', /.*amt\/boot\/remoteErase.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.remotePlatformErase.capabilities.response
  }).as('get-capabilities')

  cy.myIntercept('GET', /.*alarmOccurrences.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.alarmOccurrences.success.response
  }).as('get-alarms')

  cy.goToPage('Devices')
  cy.wait('@get-devices').its('response.statusCode').should('eq', 200)

  cy.get('mat-row').first().click()
  cy.wait('@get-device-by-id').its('response.statusCode').should('eq', 200)

  cy.get('.mat-mdc-list-item-title').contains('Remote Platform Erase').click()
  cy.wait('@get-capabilities')
  // Wait for Angular to finish loading (isLoading signal → mat-progress-bar disappears)
  cy.get('mat-progress-bar').should('not.exist')
}

describeWhenNotCloud('Remote Platform Erase', () => {
  beforeEach(() => {
    cy.setup()
  })

  it('should show "not supported" message when remoteEraseSupported is false', () => {
    navigateToRemotePlatformErase(eventLogs.remotePlatformErase.notSupported.response)
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"]').should('not.exist')
    cy.get('mat-icon').contains('info').should('exist')
  })

  it('should show checkbox when supported but not enabled', () => {
    navigateToRemotePlatformErase(eventLogs.remotePlatformErase.supportedDisabled.response)
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"]').should('exist')
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').should('have.attr', 'aria-checked', 'false')
    cy.get('[data-cy="initiateEraseButton"]').should('not.exist')
  })

  it('should show checkbox checked when rpe is true in API response', () => {
    navigateToRemotePlatformErase(eventLogs.remotePlatformErase.supportedEnabled.response)
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').should('have.attr', 'aria-checked', 'true')
    cy.get('[data-cy="initiateEraseButton"]').should('be.visible')
  })

  it('should enable the feature and show initiate erase button after toggling on', () => {
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features').its('request.body.rpe').should('eq', true)

    cy.get('[data-cy="initiateEraseButton"]').should('be.visible')
  })

  it('should disable the feature after toggling off', () => {
    // Register disable handler first (LIFO: last registered = first matched)
    // so the second POST (disable click) hits the disable response
    cy.intercept(
      { method: 'POST', url: /.*amt\/features.*/, times: 1 },
      {
        statusCode: httpCodes.SUCCESS,
        body: eventLogs.remotePlatformErase.supportedDisabled.response
      }
    ).as('post-features-disable')

    // Register enable handler second so it matches the first POST (enable click)
    cy.intercept(
      { method: 'POST', url: /.*amt\/features.*/, times: 1 },
      {
        statusCode: httpCodes.SUCCESS,
        body: eventLogs.remotePlatformErase.supportedEnabled.response
      }
    ).as('post-features-enable')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features-enable').its('request.body.rpe').should('eq', true)

    // Then disable
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features-disable').its('request.body.rpe').should('eq', false)

    cy.get('[data-cy="initiateEraseButton"]').should('not.exist')
  })

  it('should call the remoteErase API when erase is confirmed in the dialog', () => {
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/boot\/remoteErase.*/, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('post-erase')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()

    cy.get('mat-dialog-container').should('be.visible')
    cy.get('mat-dialog-container').contains('button', 'Yes').click()

    cy.wait('@post-erase').its('response.statusCode').should('eq', 200)
  })

  it('should not call the remoteErase API when erase is cancelled', () => {
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/boot\/remoteErase.*/, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('post-erase')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()

    cy.get('mat-dialog-container').should('be.visible')
    cy.get('mat-dialog-container').contains('button', 'No').click()

    cy.get('@post-erase.all').should('have.length', 0)
  })

  it('should show error snackbar when toggling feature fails', () => {
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.INTERNAL_SERVER_ERROR,
      body: {}
    }).as('post-features-error')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features-error')

    cy.get('mat-snack-bar-container').should('be.visible')
  })

  it('should show error snackbar when erase API fails', () => {
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/boot\/remoteErase.*/, {
      statusCode: httpCodes.INTERNAL_SERVER_ERROR,
      body: {}
    }).as('post-erase-error')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()
    cy.get('mat-dialog-container').contains('button', 'Yes').click()

    cy.wait('@post-erase-error')
    cy.get('mat-snack-bar-container').should('be.visible')
  })
})

// These tests confirm an erase, so they only run when every request is stubbed (ISOLATE=Y).
const isIsolated = Cypress.expose('ISOLATE').charAt(0).toLowerCase() !== 'n'
const describeWhenIsolatedConsole = Cypress.expose('CLOUD') || !isIsolated ? describe.skip : describe

describeWhenIsolatedConsole('Remote Platform Erase BIOS result polling', () => {
  const deviceA = 'guid'
  const deviceB = 'guid-b'
  const messages = {
    submitted: 'Erase request submitted. BIOS completion has not been confirmed.',
    osEraseSuccess: 'OS drive erased successfully. Please reinstall an operating system before using this device.',
    biosEraseSuccess: 'BIOS reported that the erase completed successfully.',
    unconfirmed: 'Unable to confirm the erase outcome. Check the BIOS result before retrying.',
    deviceNotResponding: 'Device did not respond. Double check connection settings and try again.',
    sessionTimedOut: 'Session timed out. Please login again'
  }
  const pending = { statusCode: httpCodes.SUCCESS, body: { status: 'pending', message: '' } }
  const staleSuccess = { statusCode: httpCodes.SUCCESS, body: { status: 'succeeded', message: 'stale result' } }
  const eraseProgressBar = 'app-remote-platform-erase mat-progress-bar'

  // Replies in order; the last reply repeats for any further polls.
  const stubStatus = (deviceId: string, alias: string, replies: object[]): void => {
    let call = 0
    cy.myIntercept('GET', new RegExp(`amt/boot/remoteErase/${deviceId}/status`), (req: any) => {
      req.reply(replies[Math.min(call++, replies.length - 1)])
    }).as(alias)
  }

  // Holds the erase submission until the test calls gate.release().
  const holdSubmission = (gate: { release?: () => void }): void => {
    cy.myIntercept('POST', /.*amt\/boot\/remoteErase.*/, (req: any) =>
      new Promise<void>((resolve) => {
        gate.release = resolve
      }).then(() => req.reply({ statusCode: httpCodes.SUCCESS, body: {} }))
    ).as('post-erase-held')
  }

  const openEraseView = (): void => {
    navigateToRemotePlatformErase()
    cy.wait('@get-features')
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .click()
    cy.wait('@post-features')
    // First capability is "Secure erase SSDs", so success reports the OS-drive message
    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
  }

  let clock: Cypress.Clock

  const confirmErase = (): void => {
    // Fake only the RxJS polling timers; Angular rendering and snackbars keep real timeouts
    cy.clock(Date.now(), ['setInterval', 'clearInterval']).then((c) => {
      clock = c
    })
    cy.get('[data-cy="initiateEraseButton"]').click()
    cy.get('mat-dialog-container').contains('button', 'Yes').click()
  }

  const startWatching = (): void => {
    confirmErase()
    cy.wait('@post-erase')
    // The watcher subscribes in the same step that opens this snackbar. The progress bar is
    // not a usable signal because it also shows while the submission is loading.
    cy.contains('mat-snack-bar-container', messages.submitted).should('be.visible')
    cy.get(eraseProgressBar).should('exist')
  }

  // Advances fake time until the next status request is sent. A tick that lands while the
  // previous response is still being handled is dropped by exhaustMap, so it is retried.
  const poll = (alias: string, ms = 5000): void => {
    cy.get<unknown[]>(`@${alias}.all`).then((calls) => {
      const before = calls.length
      let lastTick = 0
      cy.get<unknown[]>(`@${alias}.all`, { timeout: 10000 }).should((current) => {
        if (current.length > before) return
        if (Date.now() - lastTick > 500) {
          clock.tick(ms)
          lastTick = Date.now()
        }
        throw new Error(`waiting for a ${alias} request`)
      })
    })
    cy.wait(`@${alias}`)
  }

  // Changes the route in-app so Angular reuses the device-detail view, as a real device switch does.
  const switchDevice = (deviceId: string): void => {
    cy.window().then((win) => {
      win.history.pushState({}, '', `/devices/${deviceId}/remote-platform-erase`)
      win.dispatchEvent(new win.PopStateEvent('popstate', { state: {} }))
    })
    cy.location('pathname').should('eq', `/devices/${deviceId}/remote-platform-erase`)
  }

  const expectNoSnackbar = (text: string): void => {
    cy.contains('mat-snack-bar-container', text).should('not.exist')
  }

  beforeEach(() => {
    cy.setup()
    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')
    cy.myIntercept('POST', /.*amt\/boot\/remoteErase.*/, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('post-erase')
  })

  describe('outcomes', () => {
    it('should report success after pending then succeeded', () => {
      openEraseView()
      stubStatus(deviceA, 'status-a', [pending, { statusCode: httpCodes.SUCCESS, body: { status: 'succeeded' } }])
      startWatching()

      poll('status-a', 1)
      cy.get(eraseProgressBar).should('exist')
      poll('status-a')

      cy.contains('mat-snack-bar-container', messages.osEraseSuccess).should('be.visible')
      cy.get(eraseProgressBar).should('not.exist')
      cy.get('[data-cy="initiateEraseButton"]').should('not.be.disabled')
    })

    it('should report the BIOS message after pending then failed', () => {
      const failure = 'BIOS erase failed: drive authentication failure.'
      openEraseView()
      stubStatus(deviceA, 'status-a', [
        pending,
        { statusCode: httpCodes.SUCCESS, body: { status: 'failed', message: failure } }
      ])
      startWatching()

      poll('status-a', 1)
      poll('status-a')

      cy.contains('mat-snack-bar-container', failure).should('be.visible')
      cy.get(eraseProgressBar).should('not.exist')
      cy.get('[data-cy="initiateEraseButton"]').should('not.be.disabled')
    })

    it('should not treat a stale succeeded result as confirmation', () => {
      openEraseView()
      stubStatus(deviceA, 'status-a', [staleSuccess])
      startWatching()

      poll('status-a', 1)
      poll('status-a')
      cy.tick(300000)

      cy.contains('mat-snack-bar-container', messages.unconfirmed).should('be.visible')
      expectNoSnackbar(messages.osEraseSuccess)
      cy.get(eraseProgressBar).should('not.exist')
    })

    it('should keep polling quietly through gateway timeouts', () => {
      openEraseView()
      stubStatus(deviceA, 'status-a', [{ statusCode: 504, body: {} }])
      startWatching()

      poll('status-a', 1)
      // Each later poll only fires once the previous response was handled
      poll('status-a')
      expectNoSnackbar(messages.deviceNotResponding)
      poll('status-a')
      expectNoSnackbar(messages.deviceNotResponding)
      cy.tick(300000)

      cy.contains('mat-snack-bar-container', messages.unconfirmed).should('be.visible')
    })

    it('should report BIOS completion when only BIOS restore is selected', () => {
      openEraseView()
      // Swap the default SSD selection for BIOS restore only
      cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').uncheck({ force: true })
      cy.contains('[data-cy="eraseCapCheckbox"]', 'Restore BIOS to EOM State')
        .find('input[type="checkbox"]')
        .check({ force: true })
      stubStatus(deviceA, 'status-a', [pending, { statusCode: httpCodes.SUCCESS, body: { status: 'succeeded' } }])
      startWatching()

      cy.get('@post-erase.all')
        .its(0)
        .its('request.body')
        .should('include', { secureEraseAllSSDs: false, restoreBIOSToEOM: true, tpmClear: false })
      cy.get('[data-cy="ssdPasswordInput"]').should('not.exist')

      poll('status-a', 1)
      poll('status-a')

      cy.contains('mat-snack-bar-container', messages.biosEraseSuccess).should('be.visible')
      expectNoSnackbar(messages.osEraseSuccess)
      cy.get(eraseProgressBar).should('not.exist')
    })

    it('should treat a server error as unconfirmed', () => {
      openEraseView()
      stubStatus(deviceA, 'status-a', [{ statusCode: httpCodes.INTERNAL_SERVER_ERROR, body: {} }])
      startWatching()

      poll('status-a', 1)
      cy.tick(300000)

      cy.contains('mat-snack-bar-container', messages.unconfirmed).should('be.visible')
    })

    it('should still log out when the session expires during polling', () => {
      cy.myIntercept('POST', /authorize\/logout/, { statusCode: httpCodes.SUCCESS, body: {} }).as('logout')
      openEraseView()
      stubStatus(deviceA, 'status-a', [{ statusCode: httpCodes.UNAUTHORIZED, body: { exp: 'token expired' } }])
      startWatching()

      poll('status-a', 1)

      cy.contains('mat-dialog-container', messages.sessionTimedOut).should('be.visible')
      cy.location('pathname').should('eq', '/login')
      cy.tick(300000)
      expectNoSnackbar(messages.unconfirmed)
    })
  })

  describe('device and lifecycle races', () => {
    it('should stop polling device A when the view switches to device B', () => {
      openEraseView()
      stubStatus(deviceA, 'status-a', [pending, { statusCode: httpCodes.SUCCESS, body: { status: 'succeeded' } }])
      stubStatus(deviceB, 'status-b', [staleSuccess])
      startWatching()

      poll('status-a', 1)
      switchDevice(deviceB)

      // The watcher is cancelled on the input change, so the progress bar clears without an outcome
      cy.get(eraseProgressBar).should('not.exist')
      cy.tick(5000)
      cy.tick(5000)
      cy.tick(300000)

      cy.get('@status-a.all').should('have.length', 1)
      cy.get('@status-b.all').should('have.length', 0)
      expectNoSnackbar(messages.osEraseSuccess)
      expectNoSnackbar(messages.unconfirmed)
      expectNoSnackbar('stale result')
      cy.get('[data-cy="initiateEraseButton"]').should('not.be.disabled')
    })

    it('should not start polling when the submission returns after switching to device B', () => {
      const gate: { release?: () => void } = {}
      openEraseView()
      holdSubmission(gate)
      stubStatus(deviceA, 'status-a', [pending])
      stubStatus(deviceB, 'status-b', [staleSuccess])
      confirmErase()

      cy.wrap(gate).its('release').should('be.a', 'function')
      switchDevice(deviceB)
      cy.then(() => gate.release!())
      cy.wait('@post-erase-held')

      // Loading clears and no watcher starts for device A
      cy.get(eraseProgressBar).should('not.exist')
      cy.tick(1)
      cy.tick(5000)

      cy.get('@status-a.all').should('have.length', 0)
      cy.get('@status-b.all').should('have.length', 0)
      expectNoSnackbar(messages.submitted)
      cy.get('[data-cy="initiateEraseButton"]').should('not.be.disabled')
    })

    it('should not notify or poll when the submission returns after leaving the page', () => {
      const gate: { release?: () => void } = {}
      openEraseView()
      holdSubmission(gate)
      stubStatus(deviceA, 'status-a', [pending])
      confirmErase()

      cy.wrap(gate).its('release').should('be.a', 'function')
      cy.goToPage('Devices')
      cy.location('pathname').should('eq', '/devices')
      cy.then(() => gate.release!())
      cy.wait('@post-erase-held')
      cy.tick(1)
      cy.tick(5000)

      cy.get('@status-a.all').should('have.length', 0)
      expectNoSnackbar(messages.submitted)
    })
  })
})
