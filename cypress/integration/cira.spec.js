//Tests the creation of a cira-config

const loginFixtures = require("../fixtures/accounts.json");
const systemFixtures = require("../fixtures/system.json");
const urlFixtures = require("../fixtures/urls.json");
const ciraFixtures = require("../fixtures/cira.json");
const messageFixtures = require("../fixtures/stubResponses/Cira/messages.json");

//If isolated is set to true then cypress will stub api requests
const stubIt = Cypress.env("ISOLATED");

describe("Test CIRA Config Page", () => {
  //This "it" acts as a before to circumvent the
  //lack of overriding interceptors issue. This
  //should be changed after cypress fixes the problem.
  it("before", () => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    if (stubIt) {
      cy.intercept("POST", "authorize", {
        statusCode: 200,
      }).as("login-request");

      cy.intercept("GET", "ciraconfigs", {
        statusCode: 200,
        body: "[]",
      }).as("get-configs");
    } else {
      cy.intercept("POST", "authorize").as("login-request");
      cy.intercept("GET", "ciraconfigs").as("get-configs");
    }

    //Login and navigate to CIRA page
    cy.visit(urlFixtures.base);
    cy.login(loginFixtures.default.username, loginFixtures.default.password);
    cy.wait("@login-request").its("response.statusCode").should("eq", 200);

    cy.get(".mat-list-item").contains("CIRA Configs").click();
    cy.wait("@get-configs").its("response.statusCode").should("eq", 200);
  });

  context("successful run", () => {
    it("creates the default CIRA config", () => {
      //Stub the get and post requests
      if (stubIt) {
        cy.intercept("POST", "ciraconfigs", {
          statusCode: 201,
          fixture: "stubResponses/Cira/post-success.json",
        }).as("post-config");

        cy.intercept("GET", "ciraconfigs", {
          statusCode: 200,
          fixture: "stubResponses/Cira/one-default.json",
        }).as("get-configs");
      } else {
        cy.intercept("POST", "create").as("post-config");
        cy.intercept("GET", "ciraconfigs").as("get-configs");
      }

      cy.get("button").contains("Add New").click();

      //Fill out the config
      cy.get("input").get("[name=configName]").type(ciraFixtures.default.name);
      cy.get("input").get("[name=mpsServerAddress]").type(systemFixtures.ip);
      cy.get("input")
        .get("[name=username]")
        .type(loginFixtures.default.username);
      cy.get("input")
        .get("[name=password]")
        .type(loginFixtures.default.password);
      cy.get("button[type=submit]").focus().type("{enter}");

      //Leaving out the assertion section as there are some errors
      //running the sample-web-ui from a container and thus with github actions
    });

    //A run for testing the deletion exists but does not yet work with github actions
  });

  //More tests for the configs page are in the works but are not ready yet
});
