/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// A discovered device has no credentials in console, so it must open the
// read-only side pane rather than the device page.
import { httpCodes } from '../../fixtures/api/httpCodes'
import { tags } from '../../fixtures/api/tags'

const describeWhenIsolatedConsole =
  Cypress.expose('CLOUD') || Cypress.expose('ISOLATE').charAt(0).toLowerCase() === 'n' ? describe.skip : describe

const managedDevice = {
  hostname: 'finance-ws-12',
  friendlyName: 'Finance workstation',
  guid: '4c4c4544-0052-3410-8058-b2c04f4d3632',
  connectionStatus: false,
  tags: ['finance'],
  deviceInfo: {
    fwVersion: '16.1.30',
    fwBuild: '3400',
    fwSku: '16392',
    currentMode: 'Admin',
    features: '',
    ipAddress: ''
  }
}

const discoveredDevice = {
  hostname: 'lab-pc-07',
  friendlyName: '',
  guid: '4c4c4544-0042-3510-8048-b4c04f4d3633',
  connectionStatus: false,
  tags: [],
  adoption: { eligible: false, reason: 'notActivated' },
  deviceInfo: {
    discovered: true,
    firstDiscovered: '2026-09-28T14:02:11Z',
    lastSynced: '2026-10-06T08:41:37Z',
    fwVersion: '16.1.30',
    fwBuild: '3400',
    fwSku: '16392',
    currentMode: 'Pre-provisioning state',
    features: 'SOL, IDER, KVM',
    ipAddress: '10.49.76.163',
    amtEnabledInBIOS: true,
    dhcpEnabled: true,
    tlsMode: '',
    meInterfaceVersion: '16.1.25.2124',
    lmsInstalled: true,
    lmsVersion: '2410.5.0.0',
    upid: { oemPlatformIdType: 'Not Set (0)', oemId: '', csmeId: '4A45A39C5ED9462082510000' },
    certHashes: [
      'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
      'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244'
    ],
    osName: 'linux',
    osVersion: '6.8.0-51-generic',
    osDistro: 'Ubuntu 24.04 LTS',
    cpuModel: 'Intel(R) Core(TM) Ultra 7 165H',
    osIpAddress: '10.49.76.163',
    dnsSuffixOS: 'lab.example.com',
    monitorConnected: true,
    ethernetAdapterCount: 1,
    ieee8021xEnabled: false,
    meNetwork: { wired: { ipAddress: '10.49.76.163', dhcpEnabled: true, macAddress: 'a4:bb:6d:5e:01:9c' } },
    osNetwork: {
      wired: [
        {
          name: 'enp0s31f6',
          ipAddress: '10.49.76.163',
          dhcpEnabled: true,
          linkStatus: 'up',
          macAddress: 'a4:bb:6d:5e:01:9c'
        }
      ]
    },
    platformAdapters: { wired: ['Intel(R) Ethernet Connection (16) I219-LM'] }
  }
}

// The pane slides in; wait until it sits flush with the viewport edge.
const paneSettled = (): void => {
  cy.get('app-discovered-device-pane').should(($pane) => {
    const right = $pane[0].getBoundingClientRect().right
    expect(right).to.be.closeTo($pane[0].ownerDocument.documentElement.clientWidth, 1)
  })
}

describeWhenIsolatedConsole('Discovered device pane', () => {
  beforeEach(() => {
    cy.setup()
    cy.myIntercept('GET', 'api/v1/devices/stats', {
      statusCode: httpCodes.SUCCESS,
      body: { totalCount: 2, connectedCount: 0, disconnectedCount: 2, activatedCount: 1, discoveredCount: 1 }
    })
    cy.myIntercept('GET', /tags$/, { statusCode: httpCodes.SUCCESS, body: tags.getAll.success.response })
    cy.myIntercept('GET', /devices\?.*activated=true/, {
      statusCode: httpCodes.SUCCESS,
      body: { data: [managedDevice], totalCount: 1 }
    }).as('get-managed')
    cy.myIntercept('GET', /devices\?.*discovered=true/, {
      statusCode: httpCodes.SUCCESS,
      body: { data: [discoveredDevice], totalCount: 1 }
    }).as('get-discovered')
    // rpc-go synced again after the list loaded; the pane must show this copy.
    cy.myIntercept('GET', new RegExp(`devices/${discoveredDevice.guid}$`), {
      statusCode: httpCodes.SUCCESS,
      body: { ...discoveredDevice, deviceInfo: { ...discoveredDevice.deviceInfo, lastSynced: '2026-10-06T08:43:52Z' } }
    }).as('get-discovered-device')

    cy.goToPage('Devices')
    cy.wait('@get-managed')
    cy.get('.mat-mdc-tab').eq(1).click()
    cy.wait('@get-discovered')
  })

  it('opens the pane instead of the device page', () => {
    cy.viewport(1440, 900)
    cy.get('mat-row').contains('lab-pc-07').click()
    cy.location('pathname').should('eq', '/devices')
    cy.get('app-discovered-device-pane').should('be.visible')
    cy.get('[data-cy="discoveredPaneTitle"]').should('have.text', ' lab-pc-07 ').and('be.focused')
    cy.get('[data-cy="discoveredPaneStatus"]').should('contain.text', 'Discovered, not managed')
    cy.get('app-discovered-device-pane').should('contain.text', 'Ubuntu 24.04 LTS').and('contain.text', 'enp0s31f6')
    paneSettled()
    cy.screenshot('discovered-pane-open', { capture: 'viewport' })
  })

  it('fills the screen on a phone', () => {
    cy.viewport(390, 844)
    cy.get('mat-row').contains('lab-pc-07').click()
    paneSettled()
    cy.get('app-discovered-device-pane').invoke('outerWidth').should('eq', 390)
    cy.screenshot('discovered-pane-phone', { capture: 'viewport' })
  })

  it('shows the latest sync time without reloading the page', () => {
    cy.get('mat-row').contains('lab-pc-07').click()
    cy.wait('@get-discovered-device')
    // Seconds survive any time zone offset; the list copy synced at :37.
    cy.get('[data-cy="discoveredPaneLastSynced"]')
      .invoke('text')
      .should('contain', ':52 ')
      .and('not.match', /[\u202F\u00A0]/)
  })

  it('closes on Escape and returns focus to the row', () => {
    cy.get('mat-row').contains('lab-pc-07').click()
    cy.get('app-discovered-device-pane').should('be.visible')
    cy.get('body').type('{esc}')
    cy.get('app-discovered-device-pane').should('not.exist')
    cy.focused().should('have.class', 'mat-mdc-row')
  })

  it('disables Manage and says why when the device is not activated', () => {
    cy.get('mat-row').contains('lab-pc-07').click()
    cy.get('[data-cy="discoveredPaneManage"]').should('be.disabled')
    cy.get('[data-cy="discoveredPaneManageReason"]').should('contain.text', 'not activated yet')
  })

  it('keeps the dialog open on wrong credentials and moves the device to Managed on success', () => {
    const activatedCopy = {
      ...discoveredDevice,
      adoption: { eligible: true },
      deviceInfo: { ...discoveredDevice.deviceInfo, currentMode: 'Admin Control Mode' }
    }
    cy.myIntercept('GET', new RegExp(`devices/${discoveredDevice.guid}$`), {
      statusCode: httpCodes.SUCCESS,
      body: activatedCopy
    }).as('get-activated-device')
    cy.myIntercept('POST', new RegExp(`devices/${discoveredDevice.guid}/adopt$`), {
      statusCode: 403,
      body: { error: 'rejected', message: 'rejected' }
    }).as('adopt-rejected')

    cy.get('mat-row').contains('lab-pc-07').click()
    cy.wait('@get-activated-device')
    cy.get('[data-cy="discoveredPaneManage"]').should('not.be.disabled').click()
    cy.get('[data-cy="manageDeviceSubmit"]').should('be.disabled')
    cy.get('app-manage-device-dialog input[title="password"]').type('wrong')
    cy.get('[data-cy="manageDeviceSubmit"]').click()
    cy.wait('@adopt-rejected')
    cy.get('[data-cy="manageDeviceError"]').should('contain.text', 'rejected')
    cy.get('app-manage-device-dialog').should('exist')

    cy.myIntercept('POST', new RegExp(`devices/${discoveredDevice.guid}/adopt$`), {
      statusCode: httpCodes.SUCCESS,
      body: { ...activatedCopy, deviceInfo: { ...activatedCopy.deviceInfo, discovered: false } }
    }).as('adopt-ok')
    cy.get('app-manage-device-dialog input[title="password"]').clear()
    cy.get('app-manage-device-dialog input[title="password"]').type('right')
    cy.get('[data-cy="manageDeviceSubmit"]').click()
    cy.wait('@adopt-ok')
    cy.get('app-manage-device-dialog').should('not.exist')
    cy.location('search').should('contain', 'tab=managed')
  })

  it('still opens the device page for a managed device', () => {
    cy.get('.mat-mdc-tab').eq(0).click()
    cy.wait('@get-managed')
    cy.get('mat-row').contains('finance-ws-12').click()
    cy.location('pathname').should('eq', `/devices/${managedDevice.guid}`)
  })
})
