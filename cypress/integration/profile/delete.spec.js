//Tests the creation of a profile
const profileFixtures = require("../../fixtures/profile.json")
const apiResponses = require("../../fixtures/apiResponses.json")

//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
  beforeEach("clear cache and login", () => {
    cy.setup()
  })

    it("deletes the default profile", () => {
      //Stub the requests
      cy.myIntercept("DELETE", /.*profiles.*/, {
        statusCode: apiResponses.profiles.delete.success.code,
      }).as("delete-profile")

      cy.myIntercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.success.code,
        body: apiResponses.profiles.getAll.success.response,
      }).as("get-profiles3")

      cy.goToPage("Profiles")
      cy.wait("@get-profiles3")

      //Delete profile (but cancel)
      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("No").click()

      //Check that the profile was not deleted
      cy.get("mat-cell").contains(profileFixtures.happyPath.name)
      cy.get("mat-cell").contains(profileFixtures.check.network.dhcp)
      cy.get("mat-cell").contains(profileFixtures.happyPath.ciraConfig)
      cy.get("mat-cell").contains(profileFixtures.check.mode.acm)

      //Change api response
      cy.myIntercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.empty.code,
        body: apiResponses.profiles.getAll.empty.response,
      }).as("get-profiles4")

      //Delete profile
      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("Yes").click()
      cy.wait("@delete-profile")
      cy.wait("@get-profiles4")

      //Check that the config was deleted properly
      cy.contains(profileFixtures.happyPath.name).should("not.exist")
    })
})
