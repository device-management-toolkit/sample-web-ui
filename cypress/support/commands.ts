/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="cypress" />

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import stats from 'cypress/e2e/fixtures/api/stats'
import { AuthenticationProtocols, Config } from 'src/app/ieee8021x/ieee8021x.constants'
import * as Constants from 'src/app/shared/config/Constants'

declare global {
  namespace Cypress {
    interface Chainable {
      matCheckboxSet: (selector: string, checked: boolean) => Chainable<Element>
      matCheckboxAssert: (selector: string, checked: boolean) => Chainable<Element>
      matListAssert: (selector: string, value: string) => Chainable<Element>
      matRadioButtonChoose: (selector: string, value: string) => Chainable<Element>
      matRadioButtonAssert: (selector: string, value: string) => Chainable<Element>
      matSelectChoose: (selector: string, value: string) => Chainable<Element>
      matSelectAssert: (selector: string, value: string) => Chainable<Element>
      matTextlikeInputType: (selector: string, value: string) => Chainable<Element>
      matTextlikeInputAssert: (selector: string, value: string) => Chainable<Element>
      matFormFieldAssertInvalid: (formControlName: string, expected: boolean) => Chainable<Element>
      setup: () => Chainable<Element>
      login: (user: string, password: string) => Chainable<Element>
      myIntercept: (method: string, url: string | RegExp, body: any) => Chainable<Element>
      goToPage: (pageName: string) => Chainable<Element>
      enterCiraInfo: (name: string, format: string, addr: string, user: string) => Chainable<Element>
      enterDomainInfo: (name: string, domain: string, file: Cypress.FileReference, pass: string) => Chainable<Element>
      enterWirelessInfo: (name: string, ssid: string, password: string, authenticationMethod: string, encryptionMethod: string) => Chainable<Element>
      enterIEEE8021xInfo: (profile: any) => Chainable<Element>
      enterProfileInfo: (name: string, activation: string, randAmt: boolean, randMebx: boolean, network: boolean, connection: string, connectionConfig: string, userConsent: string, iderEnabled: boolean, kvmEnabled: boolean, solEnabled: boolean, wifiConfigs?: Array<{ profileName: string, priority: number }>) => Chainable<Element>
      enterProfileInfoV2: (formData: any) => Chainable<Element>
      assertProfileInfo: (profile: any) => Chainable<Element>
      setAMTMEBXPasswords: (mode: string, amtPassword: string, mebxPassword: string) => Chainable<Element>
    }
  }
}

Cypress.Commands.add('matCheckboxSet', (selector: string, checked: boolean) => {
  const elementId = `mat-checkbox${selector}`
  cy.get(elementId).invoke('is', ':disabled').then(isDisabled => {
    if (!isDisabled) {
      // material checkbox input elements are hidden/covered so not 'checkable' without forcing
      if (checked) {
        cy.get(elementId).find('[type="checkbox"]').check({ force: true })
      } else {
        cy.get(elementId).find('[type="checkbox"]').uncheck({ force: true })
      }
    }
  })
})

Cypress.Commands.add('matCheckboxAssert', (selector: string, checked: boolean) => {
  cy.get(`mat-checkbox${selector}`).find('[type="checkbox"]').should(checked ? 'be.checked' : 'not.be.checked')
})

Cypress.Commands.add('matFormFieldAssertInvalid', (formControlName: string, expected: boolean) => {
  const expectedCondition = expected ? 'have.class' : 'not.have.class'
  cy.get(`[formcontrolname="${formControlName}"]`).parents('mat-form-field').should(expectedCondition, 'mat-form-field-invalid')
})

Cypress.Commands.add('matListAssert', (selector: string, value: string) => {
  cy.get(`mat-list${selector}`).get('mat-list-item').should('contain.text', value)
})

Cypress.Commands.add('matRadioButtonChoose', (selector: string, value: string) => {
  const elementId = `mat-radio-group${selector}`
  cy.get(elementId).invoke('is', ':disabled').then(isDisabled => {
    if (!isDisabled) {
      // these low level radio buttons are hidden so need to force
      cy.get(elementId).find(`[value="${value}"]`).click({ force: true })
    }
  })
})

Cypress.Commands.add('matRadioButtonAssert', (selector: string, value: string) => {
  // use 'include' rather than have as the styling
  // this does use a css class for the find, but not sure of a better way to find the radio button
  cy.get(`mat-radio-group${selector}`).find('.mat-radio-checked').find(':radio').should('have.attr', 'value', value)
})

Cypress.Commands.add('matSelectChoose', (selector: string, text: string) => {
  const elementId = `mat-select${selector}`
  cy.get(elementId).click().get('.mat-option-text').contains(text).click()
  cy.get(elementId).focus().type('{esc}')
  cy.get(elementId).should('have.text', text)
})

Cypress.Commands.add('matSelectAssert', (selector: string, text: string) => {
  const elementId = `mat-select${selector}`
  cy.get(elementId).should('have.text', text)
})

Cypress.Commands.add('matTextlikeInputType', (selector: string, value: string) => {
  cy.get(selector).invoke('is', ':disabled').then(isDisabled => {
    if (!isDisabled) {
      cy.get(selector).invoke('is', ':visible').then(isVisible => {
        if (isVisible) {
          cy.get(selector).clear().type(value).blur()
        }
      })
    }
  })
})

Cypress.Commands.add('matTextlikeInputAssert', (selector: string, value: string) => {
  cy.get(selector).should('have.value', value)
})

// -------------------- before / beforeEach ---------------------------

Cypress.Commands.add('setup', () => {
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })

  cy.myIntercept('POST', 'authorize', {
    statusCode: httpCodes.SUCCESS,
    body: { token: '' }
  }).as('login-request')

  cy.myIntercept('GET', 'api/v1/devices/stats', {
    statusCode: 200,
    body: stats.get.success.response
  }).as('stats-request')

  // Login
  cy.visit(Cypress.env('BASEURL'))
  const mpsUsername = Cypress.env('MPS_USERNAME')
  const mpsPassword = Cypress.env('MPS_PASSWORD')
  cy.login(mpsUsername, mpsPassword)
  cy.wait('@login-request')
    .its('response.statusCode')
    .should('eq', httpCodes.SUCCESS)
})

// ------------------- Enter info into a form -------------------------

Cypress.Commands.add('login', (user, pass) => {
  if (user !== 'EMPTY') {
    cy.get('[name=userId]').type(user)
  }
  if (pass !== 'EMPTY') {
    cy.get('[name=Password]').type(pass)
  }
  cy.get('[id=btnLogin]').get('[type=submit]').click()
})

Cypress.Commands.add('enterCiraInfo', (name, format, addr, user) => {
  cy.get('input').get('[name=configName]').type(name)
  if (format === 'FQDN') {
    cy.contains('FQDN').click()
  }
  cy.get('input').get('[name=mpsServerAddress]').type(addr)
  cy.get('input').get('[name=username]').clear().type(user)
})

Cypress.Commands.add('enterProfileInfo', (name, admin, randAmt, randMebx, dhcpEnabled, connection, connectionConfig, userConsent, iderEnabled, kvmEnabled, solEnabled, wifiConfigs) => {
  cy.get('[name=profileName]').then((x) => {
    if (!x.is(':disabled')) {
      cy.get('[name=profileName]').type(name)
    }
  })

  cy.get('mat-select[formcontrolname=activation]').click()

  if (admin === 'ccmactivate') {
    cy.get('mat-option').contains('Client Control Mode').click()
  } else {
    cy.get('mat-option').contains('Admin Control Mode').click()
  }

  if (!randAmt) {
    cy.get('[data-cy=genAmtPass]').click()
    cy.get('input').get('[formControlName=amtPassword]').type(Cypress.env('AMT_PASSWORD'))
    // cy.get('[data-cy=genStaticAmt').click()
  }
  if (admin === 'acmactivate') {
    if (!randMebx) {
      cy.get('[data-cy=genMebxPass]').find('input[type=checkbox]').then((x) => {
        if (x.is(':checked')) {
          cy.get('[data-cy=genMebxPass]').click()
        }

        cy.get('input').get('[formControlName=mebxPassword]').type(Cypress.env('MEBX_PASSWORD'))
      })
    }
  }
  cy.contains(connection).click()

  if (dhcpEnabled) {
    cy.contains('DHCP').click()
  } else {
    cy.contains('STATIC').click()
  }

  if (connection === 'CIRA (Cloud)') {
    cy.get('mat-select[formcontrolname=ciraConfigName]').click()
  } else if (connection === 'TLS (Enterprise)') {
    cy.get('mat-select[formcontrolname=tlsMode]').click()
  }

  cy.get('mat-option').contains(connectionConfig).click()

  if (wifiConfigs != null && wifiConfigs.length > 0) {
    wifiConfigs.forEach(wifiProfile => {
      cy.get('input[data-cy=wifiAutocomplete]').type(wifiProfile.profileName)
      cy.get('mat-option').contains(wifiProfile.profileName).click()
    })
  }
  // if (admin !== 'ccmactivate') {
  //   cy.get('mat-select[formcontrolname=userConsent').click()
  //   cy.contains(userConsent).click()
  // }
  let id = '[data-cy="redirect_ider"]'
  cy.get(id).as('checkbox').invoke('is', ':checked').then(isChecked => {
    if ((iderEnabled && !isChecked) || (isChecked && !iderEnabled)) {
      cy.get(id).click()
    }
  })
  id = '[data-cy="redirect_kvm"] '
  cy.get(id).as('checkbox').invoke('is', ':checked').then(isChecked => {
    if ((kvmEnabled && !isChecked) || (isChecked && !kvmEnabled)) {
      cy.get(id).click()
    }
  })
  id = '[data-cy="redirect_sol"]'
  cy.get(id).as('checkbox').invoke('is', ':checked').then(isChecked => {
    if ((solEnabled && !isChecked) || (isChecked && !solEnabled)) {
      cy.get(id).click()
    }
  })
})

Cypress.Commands.add('enterProfileInfoV2', (formData: any) => {
  if (formData.activation) {
    cy.matSelectChoose('[formControlName="activation"]', formData.activation)
  }
  if (formData.userConsent) {
    cy.matSelectAssert('[formControlName="userConsent"]', formData.userConsent)
  }

  cy.matCheckboxSet('[formControlName="iderEnabled"]', formData.iderEnabled)
  cy.matCheckboxSet('[formControlName="kvmEnabled"]', formData.kvmEnabled)
  cy.matCheckboxSet('[formControlName="solEnabled"]', formData.solEnabled)
  cy.matCheckboxSet('[formControlName="generateRandomPassword"]', formData.generateRandomPassword)
  if (!formData.generateRandomPassword) {
    cy.matTextlikeInputType('[formControlName="amtPassword"]', Cypress.env('AMT_PASSWORD'))
  }
  cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', formData.generateRandomMEBxPassword)
  if (!formData.generateRandomMEBxPassword) {
    cy.matTextlikeInputType('[formControlName="mebxPassword"]', Cypress.env('MEBX_PASSWORD'))
  }
  // selectors need string values so convert booleans
  cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', formData.dhcpEnabled ? 'true' : 'false')
  if (formData.ciraConfigName) {
    cy.matRadioButtonChoose('[formControlName="connectionMode"]', Constants.ConnectionModes.CIRA.value)
    cy.matSelectChoose('[formControlName="ciraConfigName"]', formData.ciraConfigName)
  } else if (formData.tlsMode) {
    cy.matRadioButtonChoose('[formControlName="connectionMode"]', Constants.ConnectionModes.TLS.value)
    cy.matSelectChoose('[formControlName="tlsMode"]', Constants.TlsModes.labelForValue(formData.tlsMode))
  }
  if (formData.wifiConfigs != null && formData.wifiConfigs.length > 0) {
    formData.wifiConfigs.forEach((wifiProfile: { profileName: string | number | RegExp }) => {
      cy.matTextlikeInputType('[data-cy=wifiAutocomplete]', wifiProfile.profileName as string)
      // cy.get('input[data-cy=wifiAutocomplete]').type(wifiProfile.profileName)
      cy.get('mat-option').contains(wifiProfile.profileName).click()
    })
  }
})

Cypress.Commands.add('assertProfileInfo', (profile: any) => {
  cy.matTextlikeInputAssert('[formControlName="profileName"]', profile.profileName)
  cy.matSelectAssert('[formControlName="activation"]', profile.activation)
  cy.matSelectAssert('[formControlName="userConsent"]', profile.userConsent)
  cy.matCheckboxAssert('[formControlName="iderEnabled"]', profile.iderEnabled)
  cy.matCheckboxAssert('[formControlName="kvmEnabled"]', profile.kvmEnabled)
  cy.matCheckboxAssert('[formControlName="solEnabled"]', profile.solEnabled)
  cy.matRadioButtonAssert('[formControlName="dhcpEnabled"]', profile.dhcpEnabled ? 'true' : 'false')
  if (profile.ciraConfigName) {
    cy.matRadioButtonAssert('[formControlName="connectionMode"]', Constants.ConnectionModes.CIRA.value)
    cy.matSelectAssert('[formControlName="ciraConfigName"]', profile.ciraConfigName)
  }
  if (profile.tlsMode) {
    cy.matRadioButtonAssert('[formControlName="connectionMode"]', Constants.ConnectionModes.TLS.value)
    cy.matSelectAssert('[formControlName="tlsMode"]', profile.tlsMode)
  }
  if (profile.wifiConfigs != null && profile.wifiConfigs.length > 0) {
    profile.wifiConfigs.forEach((wifiProfile: { profileName: string }) => {
      cy.matListAssert('[data-cy="wifiConfigs"]', wifiProfile.profileName)
    })
  }
})

Cypress.Commands.add('enterDomainInfo', (name, domain, file, pass) => {
  cy.get('input[name="name"]').type(name)
  cy.get('input[name="domainName"]').type(domain)
  cy.get('input[type="file"]').selectFile(file, { force: true }) // force true because the file selector is always hidden
  cy.get('input[name="provisioningCertPassword"]').type(pass)
})

Cypress.Commands.add('enterWirelessInfo', (name, userName, password, authMethod, encryptionMethod) => {
  cy.get('input[name="profileName"]').type(name)
  cy.get('input[name="ssid"]').type(userName)
  cy.get('mat-select[formControlName=authenticationMethod]').click().get('mat-option').contains(authMethod).click()
  cy.get('mat-select[formControlName=encryptionMethod]').click().get('mat-option').contains(encryptionMethod).click()
  cy.get('input[name="pskPassphrase"]').type(password)
})

Cypress.Commands.add('enterIEEE8021xInfo', (config: Config) => {
  cy.matRadioButtonChoose('[formControlName="wiredInterface"]', config.wiredInterface.toString())
  if (config.profileName != null) {
    cy.matTextlikeInputType('[formControlName="profileName"]', config.profileName)
  }
  if (config.authenticationProtocol != null) {
    cy.matSelectChoose('[formControlName="authenticationProtocol"]', AuthenticationProtocols.labelForValue(config.authenticationProtocol))
  }
  if (config.pxeTimeout != null) {
    cy.matTextlikeInputType('[formControlName="pxeTimeout"]', config.pxeTimeout.toString())
  }
})

// ------------------------- Common Navigation --------------------------

Cypress.Commands.add('goToPage', (pageName) => {
  cy.get('.mat-list-item').contains(pageName).click()
})

Cypress.Commands.add('setAMTMEBXPasswords', (mode, amtPassword, mebxPassword) => {
  // cy.get('[formControlName=generateRandomPassword]').click()
  cy.get('input').get('[formControlName=amtPassword]').type(amtPassword)
  if (mode === 'acmactivate') {
    // cy.get('[formControlName=generateRandomMEBxPassword]').click()
    cy.get('input').get('[formControlName=mebxPassword]').type(mebxPassword)
  }
})

// ------------------------------- Other --------------------------------

Cypress.Commands.add('myIntercept', (method, url, body) => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
    cy.intercept({
      method,
      url
    }, body)
  } else {
    cy.intercept({ method, url })
  }
})
