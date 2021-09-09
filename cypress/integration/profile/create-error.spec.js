//Tests the creation of a profile
const urlFixtures = require("../../fixtures/urls.json")
const profileFixtures = require("../../fixtures/profile.json")
const apiResponses = require("../../fixtures/apiResponses.json")

//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
    beforeEach("clear cache and login", () => {
        cy.setup()
    })

    beforeEach("", () => {
      cy.myIntercept("GET", "ciraconfigs?$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
        body: apiResponses.ciraConfigs.getAll.forProfile.response,
      }).as("get-configs2")

      cy.myIntercept("GET", "profiles?$top=25&$skip=0&$count=true", {
        statusCode: apiResponses.profiles.getAll.empty.code,
        body: apiResponses.profiles.getAll.empty.response,
      }).as("get-profiles5")

      cy.myIntercept("GET", "wirelessconfigs?$count=true", {
        statusCode: apiResponses.wirelessConfigs.getAll.success.code,
        body: apiResponses.wirelessConfigs.getAll.success.response
      }).as("get-wireless2")
      
      cy.myIntercept("POST", "profiles", {
        statusCode: apiResponses.profiles.create.badRequest.code,
        body: apiResponses.profiles.create.badRequest.response,
      }).as("post-profile2")

      cy.goToPage("Profiles")
      cy.wait('@get-profiles5')

      cy.get("button").contains("Add New").click()
      cy.wait("@get-configs2")
        .its("response.statusCode")
        .should("be.oneOf", [200, 304])
      cy.wait("@get-wireless2")
    })

    it("invalid profile name", () => {
      cy.enterProfileInfo(
        profileFixtures.wrong.name,
        profileFixtures.happyPath.admin,
        true,
        true,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      )
    })

    afterEach("Check for error", () => {
        cy.get("button[type=submit]").click()

        //Wait for requests to finish and check their responses
        cy.wait("@post-profile2").then((req) => {
            cy.wrap(req)
            .its("response.statusCode")
            .should("eq", apiResponses.profiles.create.badRequest.code)
        })

        //Check that the profile creation failed
        cy.url().should(
            "eq",
            Cypress.env("BASEURL") +
            urlFixtures.page.profile +
            "/" +
            urlFixtures.extensions.creation
        )
    })
})
