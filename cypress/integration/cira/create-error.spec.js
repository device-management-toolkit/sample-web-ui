//Tests the creation of a cira-config

const apiResponses = require("../../fixtures/apiResponses.json")
const ciraFixtures = require("../../fixtures/cira.json")
const urlFixtures = require("../../fixtures/urls.json")

//---------------------------- Test section ----------------------------

describe("Test CIRA Config Page", () => {
    beforeEach("Clear cache and login", () => {
        cy.setup()
    })

    beforeEach("fills out the config", () => {
      cy.myIntercept("GET", "ciracert", {
        statusCode: 200,
        body: ciraFixtures.MpsCertificate,
      }).as("certificate1")

      cy.intercept("POST", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.create.badRequest.code,
        body: apiResponses.ciraConfigs.create.badRequest.response,
      }).as("post-config1")

      cy.intercept("GET", "ciraconfigs?$top=5&$skip=0&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.empty.code,
        body: apiResponses.ciraConfigs.getAll.empty.response,
      }).as("get-configs")
      
      cy.goToPage("CIRA Configs")
      cy.wait('@get-configs')

      cy.get("button").contains("Add New").click()
    })

    it("invalid config name", () => {
      cy.enterCiraInfo(
        ciraFixtures.wrong.name,
        ciraFixtures.default.format,
        ciraFixtures.default.addr,
        Cypress.env("MPSUSERNAME")
      )
    })

    it("invalid username", () => {
      cy.enterCiraInfo(
        ciraFixtures.wrong.name,
        ciraFixtures.default.format,
        ciraFixtures.default.addr,
        ciraFixtures.wrong.username
      )
    })

    afterEach("Check that the error occured", () => {
        cy.get("button[type=submit]").click()

        cy.wait('@certificate1')
        cy.wait("@post-config1").its("response.statusCode").should("eq", 400)

        let url = Cypress.env("BASEURL") + urlFixtures.page.cira + "/" + urlFixtures.extensions.creation
        cy.url().should('eq', url)
    })
})
