//Tests the creation of a profile
const loginFixtures = require("../fixtures/accounts.json");
const urlFixtures = require("../fixtures/urls.json");
const ciraFixtures = require("../fixtures/cira.json");
const profileFixtures = require("../fixtures/profile.json");
const apiResponses = require("../fixtures/apiResponses.json");

//Default behavior (no input) is to stub responses
//and use the base url saved in the url fixture
const stubIt = Cypress.env("ISOLATED") != "n";
const baseUrl =
  Cypress.env("BASEURL") == "" ? urlFixtures.base : Cypress.env("BASEURL");

describe("Test Information", () => {
  it("display any important test info", () => {
    stubIt ? cy.log("stubbing") : cy.log("end to end");
  });
});

//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
  //This "it" acts as a before to circumvent the
  //lack of overriding interceptors issue. This
  //should be changed after cypress fixes the problem.
  it("before", () => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    if (stubIt) {
      cy.intercept("POST", "authorize", {
        statusCode: apiResponses.login.success.code,
      }).as("login-request");

      cy.intercept("GET", "profiles", {
        statusCode: apiResponses.profiles.getAll.empty.code,
        body: apiResponses.profiles.getAll.empty.response,
      }).as("get-profiles");
    } else {
      cy.intercept("POST", "authorize").as("login-request");
      cy.intercept("GET", "profiles").as("get-profiles");
    }

    //Login and navigate to profile page
    cy.visit(baseUrl);
    cy.login(loginFixtures.default.username, loginFixtures.default.password);
    cy.wait("@login-request")
      .its("response.statusCode")
      .should("eq", apiResponses.login.success.code);

    cy.get(".mat-list-item").contains("Profiles").click();
    cy.wait("@get-profiles")
      .its("response.statusCode")
      .should("eq", apiResponses.profiles.getAll.empty.code);
  });

  context("successful run", () => {
    it("creates the default profile", () => {
      //Stub the get and post requests
      if (stubIt) {
        cy.intercept("GET", "ciraconfigs", {
          statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
          body: apiResponses.ciraConfigs.getAll.forProfile.response,
        }).as("get-configs");

        cy.intercept("POST", "profiles", {
          statusCode: apiResponses.profiles.create.success.code,
          body: apiResponses.profiles.create.success.response,
        }).as("post-profile");

        cy.intercept("GET", "profiles", {
          statusCode: apiResponses.profiles.getAll.success.code,
          body: apiResponses.profiles.getAll.success.response,
        }).as("get-profiles");
      } else {
        cy.intercept("GET", "ciraconfigs").as("get-configs");
        cy.intercept("POST", "profiles").as("post-profile");
        cy.intercept("GET", "profiles").as("get-profiles");
      }

      //Fill out the profile
      cy.get("button").contains("Add New").click();
      cy.wait("@get-configs");
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        profileFixtures.happyPath.amtPassword,
        profileFixtures.happyPath.mebxPassword,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      );
      cy.get("button[type=submit]").click();

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.success.code);
      });

      //TODO: check the response to make sure that it is correct
      //this is currently difficult because of the format of the response
      cy.wait("@get-profiles")
        .its("response.statusCode")
        .should("eq", apiResponses.profiles.getAll.success.code);

      //Check that the config was successful
      cy.get("mat-cell").contains(profileFixtures.happyPath.name);
      cy.get("mat-cell").contains(profileFixtures.check.network.dhcp);
      cy.get("mat-cell").contains(profileFixtures.happyPath.ciraConfig);
      cy.get("mat-cell").contains(profileFixtures.check.mode.acm);
    });

    //The delete test relies on the create test above.
    //This is bad style but these tests seems distict enough to
    //warrant haveing seperate tests. Consider fixing this style
    //issue if the tests become finicky or hard to understand
    it("deletes the default profile", () => {
      //Stub the requests
      if (stubIt) {
        cy.intercept("DELETE", "profiles", {
          statusCode: apiResponses.profiles.delete.success.code,
        }).as("delete-profile");

        cy.intercept("GET", "profiles", {
          statusCode: apiResponses.profiles.getAll.empty.code,
          body: apiResponses.profiles.getAll.empty.response,
        }).as("get-profiles");
      } else {
        cy.intercept("DELETE", "profiles").as("delete-profile");
        cy.intercept("GET", "profiles").as("get-profiles");
      }

      //Delete profile (but cancel)
      cy.get("mat-cell").contains("delete").click();
      cy.get("button").contains("No").click();

      //Check that the profile was not deleted
      cy.get("mat-cell").contains(profileFixtures.happyPath.name);
      cy.get("mat-cell").contains(profileFixtures.check.network.dhcp);
      cy.get("mat-cell").contains(profileFixtures.happyPath.ciraConfig);
      cy.get("mat-cell").contains(profileFixtures.check.mode.acm);

      //Delete profile
      cy.get("mat-cell").contains("delete").click();
      cy.get("button").contains("Yes").click();
      cy.wait("@delete-profile");

      //Check that the config was deleted properly
      cy.contains(profileFixtures.happyPath.name).should("not.exist");
    });
  });

  context("failed runs", () => {
    afterEach("cancel the config", () => {
      cy.get("button").contains("CANCEL").click({ timeout: 50000 });
    });

    it("invalid profile name", () => {
      if (stubIt) {
        cy.intercept("GET", "ciraconfigs", {
          statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
          body: apiResponses.ciraConfigs.getAll.forProfile.response,
        }).as("get-configs");

        cy.intercept("POST", "profiles", {
          statusCode: apiResponses.profiles.create.badRequest.code,
          body: apiResponses.profiles.create.badRequest.response,
        }).as("post-profile");
      } else {
        cy.intercept("GET", "ciraconfigs").as("get-configs");
        cy.intercept("POST", "profiles").as("post-profile");
      }

      cy.get("button").contains("Add New").click();
      cy.wait("@get-configs")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.getAll.forProfile.code);

      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.wrong.name,
        profileFixtures.happyPath.admin,
        profileFixtures.happyPath.amtPassword,
        profileFixtures.happyPath.mebxPassword,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      );
      cy.get("button[type=submit]").click();

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.badRequest.code);
      });

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      );
    });

    it("invalid amt password", () => {
      if (stubIt) {
        cy.intercept("GET", "ciraconfigs", {
          statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
          body: apiResponses.ciraConfigs.getAll.forProfile.response,
        }).as("get-configs");

        cy.intercept("POST", "profiles", {
          statusCode: apiResponses.profiles.create.badRequest.code,
          body: apiResponses.profiles.create.badRequest.response,
        }).as("post-profile");
      } else {
        cy.intercept("GET", "ciraconfigs").as("get-configs");
        cy.intercept("POST", "profiles").as("post-profile");
      }

      cy.get("button").contains("Add New").click();
      cy.wait("@get-configs")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.getAll.forProfile.code);

      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        profileFixtures.wrong.amtPassword,
        profileFixtures.happyPath.mebxPassword,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      );
      cy.get("button[type=submit]").click();

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile")
        .its("response.statusCode")
        .should("eq", apiResponses.profiles.create.badRequest.code);

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      );
    });

    it("invalid mebx password", () => {
      if (stubIt) {
        cy.intercept("GET", "ciraconfigs", {
          statusCode: apiResponses.ciraConfigs.getAll.forProfile.code,
          body: apiResponses.ciraConfigs.getAll.forProfile.response,
        }).as("get-configs");

        cy.intercept("POST", "profiles", {
          statusCode: apiResponses.profiles.create.badRequest.code,
          body: apiResponses.profiles.create.badRequest.response,
        }).as("post-profile");
      } else {
        cy.intercept("GET", "ciraconfigs").as("get-configs");
        cy.intercept("POST", "profiles").as("post-profile");
      }

      cy.get("button").contains("Add New").click();
      cy.wait("@get-configs")
        .its("response.statusCode")
        .should("eq", apiResponses.ciraConfigs.getAll.forProfile.code);

      //Fill out the profile
      cy.enterProfileInfo(
        profileFixtures.happyPath.name,
        profileFixtures.happyPath.admin,
        profileFixtures.happyPath.amtPassword,
        profileFixtures.wrong.mebxPassword,
        profileFixtures.happyPath.netConfig,
        profileFixtures.happyPath.ciraConfig
      );
      cy.get("button[type=submit]").click();

      //Wait for requests to finish and check them their responses
      cy.wait("@post-profile").then((req) => {
        cy.wrap(req)
          .its("response.statusCode")
          .should("eq", apiResponses.profiles.create.badRequest.code);
      });

      //Check that the profile creation failed
      cy.url().should(
        "eq",
        baseUrl +
          urlFixtures.page.profiles +
          "/" +
          urlFixtures.extensions.creation
      );
    });
  });
});
