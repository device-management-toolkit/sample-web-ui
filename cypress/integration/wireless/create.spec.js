const apiResponses = require('../../fixtures/apiResponses.json')
const wirlessFixtures = require('../../fixtures/wireless.json')

describe("create a wireless profile", () => {
    beforeEach("clear cache and login", () => {
        cy.setup()
    })

    it("creates a deafault profile", () => {
        cy.myIntercept("POST", "wirelessconfigs", {
            statusCode: apiResponses.wirelessConfigs.create.success.code,
            body: apiResponses.wirelessConfigs.create.success.response,
        }).as("post-wireless")

        cy.myIntercept("GET", "wirelessconfigs?$top=25&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.empty.code,
            body: apiResponses.wirelessConfigs.getAll.empty.response,
        }).as("get-wireless")

        cy.goToPage("Wireless")
        cy.wait("@get-wireless")

        //change api response
        cy.myIntercept("GET", "wirelessconfigs?$top=25&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.success.code,
            body: apiResponses.wirelessConfigs.getAll.success.response,
        }).as("get-wireless2")

        cy.get("button").contains("Add New").click()
        cy.enterWirelessInfo(
            wirlessFixtures.happyPath.profileName,
            wirlessFixtures.happyPath.ssid,
            Cypress.env("PSKPASSPHRASE")
        )
        cy.get("button[type=submit]").click()

        cy.wait("@post-wireless").then((req) => {
            cy.wrap(req)
              .its("response.statusCode")
              .should("eq", apiResponses.wirelessConfigs.create.success.code)
      
            //Check that the wireless config was successful
            cy.get("mat-cell").contains(wirlessFixtures.happyPath.profileName)
          })
    })
})