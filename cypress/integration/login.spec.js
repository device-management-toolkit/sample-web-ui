//Tests the login page with a multitude of fake accounts in
//different combinations of invalid login info.
//Also tests things like canceling a login and logging out after the login

const loginFixtures = require("../fixtures/accounts.json");
const urlFixtures = require("../fixtures/urls.json");
const messageFixtures = require("../fixtures/messages.json");

//If isolated is set to true then cypress will stub api requests
const stubIt = Cypress.env("ISOLATED");

describe("Load Site", () => {
  it("loads the login page properly", () => {
    //Make sure the test always starts at the login page
    //and is never able to autologin
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    //Go to base site
    cy.visit(urlFixtures.base);

    //Make sure the login page was hit
    cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
  });
});

describe("Test login page", () => {
  beforeEach("(Re)Load Site", () => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit(urlFixtures.base);
    cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
  });

  context("Successful login", () => {
    it("logs in", () => {
      //Prepare to intercept login request
      if (stubIt) {
        cy.intercept("POST", "authorize", {
          statusCode: 200,
        }).as("login-request");
      } else {
        cy.intercept("POST", "authorize").as("login-request");
      }

      //Login
      cy.login(loginFixtures.default.username, loginFixtures.default.password);

      //Check that correct post request is made
      cy.wait("@login-request").then((req) => {
        cy.wrap(req).its("response.statusCode").should("eq", 200);
        cy.wrap(req)
          .its("request.body.username")
          .should("eq", loginFixtures.default.username);
        cy.wrap(req)
          .its("request.body.password")
          .should("eq", loginFixtures.default.password);
      });

      //Check that the login was successful
      cy.url().should("eq", urlFixtures.base);
    });
  });

  context("Failed login", () => {
    function prepareIntercepts() {
      if (stubIt) {
        cy.intercept("POST", "authorize", {
          statusCode: 403,
          body: "Incorrect Username and/or Password!",
        }).as("login-request");
      } else {
        cy.intercept("POST", "authorize").as("login-request");
      }
    }

    function checkFailState() {
      cy.wait("@login-request").then((req) => {
        cy.wrap(req).its("response.statusCode").should("eq", 403);
        cy.wrap(req)
          .its("response.body")
          .should("eq", "Incorrect Username and/or Password!");
      });
      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
      cy.contains("Error logging in").should("exist");
    }

    it("no username / valid password", () => {
      //Attempt to log in
      cy.login("EMPTY", loginFixtures.default.password);

      //Check that to log in fails as expected
      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
      cy.get(".mat-error").should("have.length", 1);
    });

    it("invalid username / valid password", () => {
      prepareIntercepts();
      cy.login(loginFixtures.wrong.username, loginFixtures.default.password);
      checkFailState();
    });

    it("valid username / no password", () => {
      cy.login(loginFixtures.default.username, "EMPTY");

      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
      cy.get(".mat-error").should("have.length", 1);
    });

    it("valid username / invalid password", () => {
      prepareIntercepts();
      cy.login(loginFixtures.default.username, loginFixtures.wrong.password);
      checkFailState();
    });

    it("no username / invalid password", () => {
      cy.login("EMPTY", loginFixtures.wrong.password);

      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
      cy.get(".mat-error").should("have.length", 1);
    });

    it("no username / no password", () => {
      cy.login("EMPTY", "EMPTY");

      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
      cy.get(".mat-error").should("have.length", 2);
    });
  });

  context("Forgot password", () => {
    it("commment on password recovery", () => {
      cy.log("Test will be implemented when functionality is added");
    });
  });

  context("Logout", () => {
    it("logs in then out", () => {
      //Prepare request intercepts
      if (stubIt) {
        cy.intercept("POST", "authorize", {
          statusCode: 200,
        }).as("login-request");

        cy.intercept("GET", "logout", {
          statusCode: 200,
        }).as("logout-request");
      } else {
        cy.intercept("POST", "authorize").as("login-request");
        cy.intercept("GET", "logout").as("logout-request");
      }

      //Login
      cy.login(loginFixtures.default.username, loginFixtures.default.password);
      cy.wait("@login-request");

      //Check that the login was successful
      cy.url().should("eq", urlFixtures.base);

      //Logout
      cy.contains("account_circle").click();
      cy.contains("Log out").click();

      //Check that the logout was successful
      cy.url().should("eq", urlFixtures.base + urlFixtures.page.login);
    });
  });
});
