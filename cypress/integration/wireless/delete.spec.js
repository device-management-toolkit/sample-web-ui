const apiResponses = require('../../fixtures/apiResponses.json')
const wirlessFixtures = require('../../fixtures/wireless.json')

describe("test wireless profiles page", () => {
    beforeEach("clear cache and login", () => {
        cy.setup()
    })

    it("deletes the default profile", () => {
        cy.myIntercept("DELETE", /.*wirelessconfigs.*/, {
            statusCode: apiResponses.wirelessConfigs.delete.success.code,
        }).as("delete-profile")
        cy.myIntercept("GET", "wirelessconfigs", {
            statusCode: apiResponses.wirelessConfigs.getAll.success.code,
            body: apiResponses.wirelessConfigs.getAll.success.response,
        }).as("get-wireless")

        cy.goToPage("Wireless")
        cy.wait("@get-wireless")

        cy.get("mat-cell").contains("delete").click()
        cy.get("button").contains("No").click()

        cy.get("mat-cell").contains(wirlessFixtures.happyPath.profileName)
        cy.get("mat-cell").contains(wirlessFixtures.happyPath.authenticationMethod)
        cy.get("mat-cell").contains(wirlessFixtures.happyPath.encryptionMethod)
        cy.get("mat-cell").contains(wirlessFixtures.happyPath.ssid)

        cy.myIntercept("GET", "wirelessconfigs", {
            statusCode: apiResponses.wirelessConfigs.getAll.empty.code,
            body: apiResponses.wirelessConfigs.getAll.empty.response,
          }).as("get-wireless2")

          cy.get("mat-cell").contains("delete").click()
          cy.get("button").contains("Yes").click()
          cy.wait("@delete-profile")
          cy.wait("@get-wireless2")

          cy.contains(wirlessFixtures.happyPath.profileName).should("not.exist")
    })


})