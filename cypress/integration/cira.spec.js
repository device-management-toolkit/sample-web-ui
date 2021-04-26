//Tests the creation of a cira-config

const loginFixtures = require("../fixtures/accounts.json")
const urlFixtures = require("../fixtures/urls.json")
const apiResponses = require("../fixtures/apiResponses.json")
const ciraFixtures = require("../fixtures/cira.json")
const baseUrl = Cypress.env("BASEURL")

//---------------------------- Test section ----------------------------

describe("Test CIRA Config Page", () => {
  beforeEach("Clear cache and login", () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    cy.myIntercept("POST", "authorize", {
      statusCode: apiResponses.login.success.code,
      body: { token: "" },
    }).as("login-request")

    //Login
    cy.visit(baseUrl)
    cy.login(loginFixtures.default.username, loginFixtures.default.password)
    cy.wait("@login-request")
      .its("response.statusCode")
      .should("eq", apiResponses.login.success.code)
  })

  context("successful run", () => {
    it("creates the default CIRA config", () => {
      //Stub the get and post requests
      cy.myIntercept("GET", "ciracert", {
        statusCode: 200,
        body: ciraFixtures.MpsCertificate,
      }).as("certificate")

      cy.myIntercept("POST", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.create.success.code,
        body: apiResponses.ciraConfigs.create.success.response,
      }).as("post-config")

      cy.myIntercept("GET", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.getAll.empty.code,
        body: apiResponses.ciraConfigs.getAll.empty.response,
      }).as("get-configs")

      //Fill out the config
      cy.goToPage("CIRA Configs")
      cy.wait('@get-configs')

      //change api response
      cy.myIntercept("GET", /.*ciraconfigs.*/, {
        statusCode: apiResponses.ciraConfigs.getAll.success.code,
        body: apiResponses.ciraConfigs.getAll.success.response,
      }).as("get-configs2")

      cy.get("button").contains("Add New").click()
      cy.enterCiraInfo(
        ciraFixtures.default.name,
        ciraFixtures.default.format,
        ciraFixtures.default.addr,
        Cypress.env("MPSUSERNAME"),
        Cypress.env("MPSPASSWORD")
      )
      cy.get("button[type=submit]").click({ timeout: 50000 })
      
      //Wait for requests to finish and check them their responses
      cy.wait("@post-config").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.ciraConfigs.create.success.code)
      })

      //TODO: check the response to make sure that it is correct
      //this is currently difficult because of the format of the response
      cy.wait("@get-configs2")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.getAll.success.code)

      // //Check that the config was successful
      cy.get("mat-cell").contains(ciraFixtures.default.name)
      cy.get("mat-cell").contains(ciraFixtures.default.addr)
      cy.get("mat-cell").contains(Cypress.env("MPSUSERNAME"))
    })

    it("deletes the default cira config", () => {

      cy.myIntercept("DELETE", /.*ciraconfigs.*/, {
        statusCode: apiResponses.ciraConfigs.delete.success.code
      }).as("delete-config")

      cy.myIntercept("GET", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.getAll.success.code,
        body: apiResponses.ciraConfigs.getAll.success.response,
      }).as("get-configs")

      //Delete CIRA Config (but cancel)
      cy.goToPage("CIRA Configs")
      cy.wait('@get-configs')

      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("No").click()

      //Check that the config was not deleted
      cy.get("mat-cell").contains(ciraFixtures.default.name)
      cy.get("mat-cell").contains(ciraFixtures.default.addr)
      cy.get("mat-cell").contains(Cypress.env("MPSUSERNAME"))

      //Change api response
      cy.myIntercept("GET", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.getAll.empty.code,
        body: apiResponses.ciraConfigs.getAll.empty.response,
      }).as("get-configs")

      //Delete CIRA Config
      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("Yes").click()
      cy.wait("@delete-config")

      //Check that the config was deleted properly
      cy.contains(ciraFixtures.default.name).should("not.exist")
    })
  })

  context("failed runs", () => {
    beforeEach("fills out the config", () => {
      cy.myIntercept("GET", "ciracert", {
        statusCode: 200,
        body: ciraFixtures.MpsCertificate,
      }).as("certificate1")

      cy.intercept("POST", "ciraconfigs", {
        statusCode: apiResponses.ciraConfigs.create.badRequest.code,
        body: apiResponses.ciraConfigs.create.badRequest.response,
      }).as("post-config1")

      cy.intercept("GET", "ciraconfigs", {
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
        Cypress.env("MPSUSERNAME"),
        Cypress.env("MPSPASSWORD")
      )
      cy.get("button[type=submit]").click({ timeout: 50000 })

      cy.wait('@certificate1')
      cy.wait("@post-config1")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.create.badRequest.code)
    })

    it("invalid username", () => {
      cy.enterCiraInfo(
        ciraFixtures.wrong.name,
        ciraFixtures.default.format,
        ciraFixtures.default.addr,
        ciraFixtures.wrong.username,
        Cypress.env("MPSPASSWORD")
      )
      cy.get("button[type=submit]").click()

      cy.wait('@certificate1')
      cy.wait("@post-config1").its("response.statusCode").should("eq", 400)
    })

    it("invalid password", () => {
      cy.enterCiraInfo(
        ciraFixtures.wrong.name,
        ciraFixtures.default.format,
        ciraFixtures.default.addr,
        Cypress.env("MPSUSERNAME"),
        ciraFixtures.wrong.password
      )
      cy.get("button[type=submit]").click()

      cy.wait('@certificate1')
      cy.wait("@post-config1").its("response.statusCode").should("eq", 400)
    })
  })
})
