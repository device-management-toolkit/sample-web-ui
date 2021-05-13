//Tests the login page with a multitude of fake accounts in
//different combinations of invalid login info.
//Also tests things like canceling a login and logging out after the login

const loginFixtures = require("../../fixtures/accounts.json")
const urlFixtures = require("../../fixtures/urls.json")
const apiResponses = require("../../fixtures/apiResponses.json")
//---------------------------- Test section ----------------------------

describe("Load Site", () => {
  it("loads the login page properly", () => {
    //Make sure the test always starts at the login page
    //and is never able to autologin
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    //Go to base site
    cy.visit(Cypress.env("BASEURL"))

    //Make sure the login page was hit
    cy.url().should("eq", Cypress.env("BASEURL") + urlFixtures.page.login)
  })
})

describe("Test login page", () => {
    it("logs in", () => {
      cy.myIntercept("POST", "authorize", {
          statusCode: apiResponses.login.success.code,
          body: { token: "" },
      }).as("login-request")

      //Login
      cy.login(loginFixtures.default.username, loginFixtures.default.password)
    })
})
