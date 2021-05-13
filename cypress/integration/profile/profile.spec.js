//Tests the creation of a profile
const loginFixtures = require("../../fixtures/accounts.json")
const urlFixtures = require("../../fixtures/urls.json")
const ciraFixtures = require("../../fixtures/cira.json")
const profileFixtures = require("../../fixtures/profile.json")
const apiResponses = require("../../fixtures/apiResponses.json")
const baseUrl = Cypress.env("BASEURL")

//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
  beforeEach("clear cache and login", () => {
    cy.setup()
  })

  context("successful run", () => {
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
      cy.get("mat-cell").contains(profileFixtures.check.mode.acm)
    })

    //The delete test relies on the create test above.
    //This is bad style but these tests seems distict enough to
    //warrant haveing seperate tests. Consider fixing this style
    //issue if the tests become finicky or hard to understand
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

  context("failed runs", () => {
    beforeEach("", () => {
      cy.myIntercept("GET", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
        body: apiResponses.ciraConfigs.getAll.forProfile.response,
      }).as("get-configs2")

      cy.myIntercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.empty.code,
        body: apiResponses.profiles.getAll.empty.response,
      }).as("get-profiles5")

      cy.myIntercept("POST", "profiles", {
        statusCode: apiResponses.profiles.create.badRequest.code,
        body: apiResponses.profiles.create.badRequest.response,
      }).as("post-profile2")

      cy.goToPage("Profiles")
      cy.wait('@get-profiles5')

      cy.get("button").contains("Add New").click()
      cy.wait("@get-configs2")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.getAll.forProfile.code)
    })

    it("invalid profile name", () => {
      
      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.wrong.name,
        profileFixtures.happyPath.admin,
        Cypress.env("AMTPASSWORD"),
        Cypress.env("MEBXPASSWORD"),
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      )
      cy.get("button[type=submit]").click()

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile2").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.badRequest.code)
      })

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      )
    })

    it("invalid amt password", () => {

      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        profileFixtures.wrong.amtPassword,
        Cypress.env("MEBXPASSWORD"),
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      )
      cy.get("button[type=submit]").click()

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile2")
        .its("response.statusCode")
        .should("eq", apiResponses.profiles.create.badRequest.code)

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      )
    })

    it("invalid mebx password", () => {

      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        Cypress.env("AMTPASSWORD"),
        profileFixtures.wrong.mebxPassword,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      )
      cy.get("button[type=submit]").click()

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile2").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.badRequest.code)
      })

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      )
    })
  })
})
