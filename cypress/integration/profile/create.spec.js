//Tests the creation of a profile
const profileFixtures = require("../../fixtures/profile.json")
const apiResponses = require("../../fixtures/apiResponses.json")

//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
  beforeEach("clear cache and login", () => {
    cy.setup()
  })

    it("creates the default profile", () => {
      //Stub the get and post requests
      cy.myIntercept("GET", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
        body: apiResponses.ciraConfigs.getAll.forProfile.response,
      }).as("get-configs")

      cy.myIntercept("POST", "profiles", {
        statusCode: apiResponses.profiles.create.success.code,
        body: apiResponses.profiles.create.success.response,
      }).as("post-profile")

      cy.myIntercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.empty.code,
        body: apiResponses.profiles.getAll.empty.response,
      }).as("get-profiles")

      cy.goToPage("Profiles")
      cy.wait("@get-profiles")

      //change api response
      cy.myIntercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.success.code,
        body: apiResponses.profiles.getAll.success.response,
      }).as("get-profiles2")

      //Fill out the profile
      cy.get("button").contains("Add New").click()
      cy.wait("@get-configs")
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        Cypress.env("AMTPASSWORD"),
        Cypress.env("MEBXPASSWORD"),
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      )
      cy.get("button[type=submit]").click()

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.success.code)
      })

      //TODO: check the response to make sure that it is correct
      //this is currently difficult because of the format of the response
      cy.wait("@get-profiles2")
        .its("response.statusCode")
        .should("eq", apiResponses.profiles.getAll.success.code)

      //Check that the config was successful
      cy.get("mat-cell").contains(profileFixtures.happyPath.name)
      cy.get("mat-cell").contains(profileFixtures.check.network.dhcp)
      cy.get("mat-cell").contains(profileFixtures.happyPath.ciraConfig)
      cy.get("mat-cell").contains(profileFixtures.check.mode.ccm)
    })
})
