/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { domains } from 'cypress/e2e/fixtures/api/domain'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
    beforeEach('before', () => {
        cy.setup()
    })

    it('checks the expiration date ui functionality', () => {
        cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
            statusCode: httpCodes.SUCCESS,
            body: domains.getThree.success.response
        }).as('get-domains')

        cy.goToPage('Domains')
        cy.wait('@get-domains')

        for (let i = 0; i < 3; i++) {
            cy.get('mat-cell').contains(domains.getThree.success.response.data[i].profileName)
            cy.get('mat-cell').contains(domains.getThree.success.response.data[i].domainSuffix)
        }

        cy.get('simple-snack-bar').contains('expired').should('exist')
    })
})
