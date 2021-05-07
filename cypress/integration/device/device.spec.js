//Tests the creation of a profile
const loginFixtures = require("../../fixtures/accounts.json")
const urlFixtures = require("../../fixtures/urls.json")
const apiResponses = require("../../fixtures/apiResponses.json")
const baseUrl = Cypress.env("BASEURL")

//---------------------------- Test section ----------------------------

describe("Test Device Page", () => {
  beforeEach("", () => {
    cy.setup()
  })

  context("basic functionality check", () => {
    it("loads all the devices", () => {
      cy.myIntercept("GET", "devices", {
        statusCode: apiResponses.devices.getAll.success.code,
        body: apiResponses.devices.getAll.success.response,
      }).as("get-devices")

      cy.goToPage("Devices")
      cy.wait("@get-devices").its("response.statusCode").should("eq", 200)

      //TODO: add check that the devices loaded properly
    })
  })

  context("test filtering function", () => {
    it("filters for windows devices", () => {

      cy.myIntercept("GET", /tags$/, {
        statusCode: apiResponses.tags.getAll.success.code,
        body: apiResponses.tags.getAll.success.response,
      }).as("get-tags")

      cy.myIntercept("GET", /devices$/, {
        statusCode: apiResponses.devices.getAll.tags.code,
        body: apiResponses.devices.getAll.tags.response,
      }).as("get-devices2")

      cy.myIntercept("GET", "**/devices?tags=Windows", {
        statusCode: apiResponses.devices.getAll.windows.code,
        body: apiResponses.devices.getAll.windows.response,
      }).as("get-windows")

      cy.goToPage("Devices")
      cy.wait("@get-tags")
      cy.wait("@get-devices2")

      //Filter for Windows devices
      cy.contains("Filter Tags").click({ force: true })
      cy.contains(".mat-option-text", "Windows").click()

      //TODO: find a way to click off the tags table
      //TODO: find a good way to check if this test worked
    })
  })
})
