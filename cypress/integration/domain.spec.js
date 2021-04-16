//https://open-amt-cloud-toolkit.github.io/docs/1.1/General/createProfileACM/

//Tests the creation of a profile
const loginFixtures = require("../fixtures/accounts.json")
const urlFixtures = require("../fixtures/urls.json")
const domainFixtures = require("../fixtures/domain.json")
const apiResponses = require("../fixtures/apiResponses.json")
const baseUrl = Cypress.env("BASEURL")

//---------------------------- Test section ----------------------------

describe("Test Domain Page", () => {
  beforeEach("before", () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    cy.myIntercept("POST", "authorize", {
      statusCode: apiResponses.login.success.code,
      body: { token: "" },
    }).as("login-request")

    //Login and navigate to profile page
    cy.visit(baseUrl)
    cy.login(loginFixtures.default.username, loginFixtures.default.password)
    cy.wait("@login-request")
      .its("response.statusCode")
      .should("eq", apiResponses.login.success.code)
  })

  context("successful run", () => {
    it("creates the default domain", () => {
      //Stub the get and post requests
      cy.myIntercept("GET", "domains", {
        statusCode: apiResponses.domains.getAll.empty.code,
        body: apiResponses.domains.getAll.empty.response,
      }).as("get-domains")

      cy.myIntercept("POST", "domains", {
        statusCode: apiResponses.domains.create.success.code,
        body: apiResponses.domains.create.success.response,
      }).as("post-domain")

      cy.goToPage("Domains")
      cy.wait("@get-domains")

      //Fill out the profile
      cy.get("button").contains("Add New").click()

      //Change api response
      cy.myIntercept("GET", "domains", {
        statusCode: apiResponses.domains.getAll.success.code,
        body: apiResponses.domains.getAll.success.response,
      }).as("get-domains2")

      //TODO: add file path and password once cypress-upload-file is added
      //and a spoof pfx file is created
      cy.enterDomainInfo(
        domainFixtures.default.name,
        domainFixtures.default.domain
      )
      //TODO: delete cancel and click save button once page can be filled out
      cy.get("button").contains("CANCEL").click()

      //Wait for requests to finish and check them their responses
      //TODO: add this code back when page can be submitted
      // cy.wait("@post-domain").then((req) => {
      //   cy.wrap(req)
      //     .its("response.statusCode")
      //     .should("eq", apiResponses.domains.create.success.code)
      // })

      //TODO: check the response to make sure that it is correct
      //this is currently difficult because of the format of the response
      cy.wait("@get-domains2")
        .its("response.statusCode")
        .should("eq", apiResponses.domains.getAll.success.code)

      //Check that the config was successful
      cy.get("mat-cell").contains(domainFixtures.default.name)
      cy.get("mat-cell").contains(domainFixtures.default.domain)
    })

    it("deletes the default domain", () => {
      //Stub requests
      cy.myIntercept("DELETE", /.*domains.*/, {
        statusCode: apiResponses.domains.delete.success.code,
        body: apiResponses.domains.delete.success.response,
      }).as("delete-domain")

      cy.myIntercept("GET", "domains", {
        statusCode: apiResponses.domains.getAll.success.code,
        body: apiResponses.domains.getAll.success.response,
      }).as("get-domains3")

      cy.goToPage("Domains")
      cy.wait("@get-domains3")

      //Delete Domain (but cancel)
      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("No").click()

      //Check that the domain was not deleted
      cy.get("mat-cell").contains(domainFixtures.default.name)
      cy.get("mat-cell").contains(domainFixtures.default.domain)

      //Change api response
      cy.myIntercept("GET", "domains", {
        statusCode: apiResponses.domains.getAll.empty.code,
        body: apiResponses.domains.getAll.empty.response,
      }).as("get-domains4")

      //Delete Domain
      cy.get("mat-cell").contains("delete").click()
      cy.get("button").contains("Yes").click()
      cy.wait("@delete-domain")
      cy.wait("@get-domains4")

      //Check that the Domain was deleted properly
      cy.contains(domainFixtures.default.name).should("not.exist")
      cy.contains(domainFixtures.default.domain).should("not.exist")
    })
  })
})
