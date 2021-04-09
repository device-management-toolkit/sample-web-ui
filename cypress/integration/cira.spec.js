// //Tests the creation of a cira-config

// const loginFixtures = require("../fixtures/accounts.json");
// const urlFixtures = require("../fixtures/urls.json");
// const ciraFixtures = require("../fixtures/cira.json");
// const apiResponses = require("../fixtures/apiResponses.json");

// //Default behavior (no input) is to stub responses
// //and use the base url saved in the url fixture
// const stubIt = Cypress.env("ISOLATED") != "n";
// const baseUrl =
//   Cypress.env("BASEURL") == "" ? urlFixtures.base : Cypress.env("BASEURL");

// describe("Test Information", () => {
//   it("display any important test info", () => {
//     stubIt ? cy.log("stubbing") : cy.log("end to end");
//   });
// });

// //---------------------------- Test section ----------------------------

// describe("Test CIRA Config Page", () => {
//   //This "it" acts as a before to circumvent the
//   //lack of overriding interceptors issue. This
//   //should be changed after cypress fixes the problem.
//   it("before", () => {
//     cy.window().then((win) => {
//       win.sessionStorage.clear();
//     });

//     if (stubIt) {
//       cy.intercept("POST", "authorize", {
//         statusCode: apiResponses.login.success.code,
//       }).as("login-request");

//       cy.intercept("GET", "ciraconfigs", {
//         statusCode: apiResponses.ciraConfigs.getAll.empty.code,
//         body: apiResponses.ciraConfigs.getAll.empty.response,
//       }).as("get-configs");
//     } else {
//       cy.intercept("POST", "authorize").as("login-request");
//       cy.intercept("GET", "ciraconfigs").as("get-configs");
//     }

//     //Login and navigate to CIRA page
//     cy.visit(baseUrl);
//     cy.login(loginFixtures.default.username, loginFixtures.default.password);
//     cy.wait("@login-request")
//       .its("response.statusCode")
//       .should("eq", apiResponses.login.success.code);

//     cy.get(".mat-list-item").contains("CIRA Configs").click();
//     cy.wait("@get-configs")
//       .its("response.statusCode")
//       .should("eq", apiResponses.ciraConfigs.getAll.empty.code);
//   });

//   context("successful run", () => {
//     it("creates the default CIRA config", () => {
//       //Stub the get and post requests
//       if (stubIt) {
//         cy.intercept("POST", /admin$/, {
//           statusCode: 200,
//           body: ciraFixtures.MpsCertificate,
//         }).as("certificate");

//         cy.intercept("POST", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.create.success.code,
//           body: apiResponses.ciraConfigs.create.success.response,
//         }).as("post-config");

//         cy.intercept("GET", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.getAll.success.code,
//           body: apiResponses.ciraConfigs.getAll.success.response,
//         }).as("get-configs");
//       } else {
//         cy.intercept("POST", /admin$/).as("certificate");
//         cy.intercept("POST", "ciraconfigs").as("post-config");
//         cy.intercept("GET", "ciraconfigs").as("get-configs");
//       }

//       //Fill out the config
//       cy.get("button").contains("Add New").click();
//       cy.enterCiraInfo(
//         ciraFixtures.default.name,
//         ciraFixtures.default.format,
//         ciraFixtures.default.addr,
//         ciraFixtures.default.username,
//         ciraFixtures.default.password
//       );
//       cy.get("button[type=submit]").click({ timeout: 50000 });

//       //Wait for requests to finish and check them their responses
//       cy.wait("@post-config").then((req) => {
//         cy.wrap(req)
//           .its("response.statusCode")
//           .should("eq", apiResponses.ciraConfigs.create.success.code);
//       });

//       //TODO: check the response to make sure that it is correct
//       //this is currently difficult because of the format of the response
//       cy.wait("@get-configs")
//         .its("response.statusCode")
//         .should("eq", apiResponses.ciraConfigs.getAll.success.code);

//       // //Check that the config was successful
//       cy.get("mat-cell").contains(ciraFixtures.default.name);
//       cy.get("mat-cell").contains(ciraFixtures.default.addr);
//       cy.get("mat-cell").contains(ciraFixtures.default.username);
//     });

//     //The delete test relies on the create test above.
//     //This is bad style but these tests seems distict enough to
//     //warrant haveing seperate tests. Consider fixing this style
//     //issue if the tests become finicky or hard to understand
//     it("deletes the default cira config", () => {
//       //Stub the requests
//       if (stubIt) {
//         cy.intercept("DELETE", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.delete.success.code,
//         }).as("delete-config");

//         cy.intercept("GET", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.getAll.empty.code,
//           body: apiResponses.ciraConfigs.getAll.empty.response,
//         }).as("get-configs");
//       } else {
//         cy.intercept("DELETE", "ciraconfigs").as("delete-config");
//         cy.intercept("GET", "ciraconfigs").as("get-configs");
//       }

//       //Delete CIRA Config (but cancel)
//       cy.get("mat-cell").contains("delete").click();
//       cy.get("button").contains("No").click();

//       //Check that the config was not deleted
//       cy.get("mat-cell").contains(ciraFixtures.default.name);
//       cy.get("mat-cell").contains(ciraFixtures.default.addr);
//       cy.get("mat-cell").contains(ciraFixtures.default.username);

//       //Delete CIRA Config
//       cy.get("mat-cell").contains("delete").click();
//       cy.get("button").contains("Yes").click();
//       cy.wait("@delete-config");

//       //Check that the config was deleted properly
//       cy.contains(ciraFixtures.default.name).should("not.exist");
//     });
//   });

//   context("failed runs", () => {
//     beforeEach("fills out the config", () => {
//       cy.get("button").contains("Add New").click();
//     });

//     afterEach("cancel the config", () => {
//       cy.get("button").contains("CANCEL").click({ timeout: 50000 });
//     });

//     it("invalid config name", () => {
//       if (stubIt) {
//         cy.intercept("POST", /admin$/, {
//           statusCode: 200,
//           body: ciraFixtures.MpsCertificate,
//         }).as("certificate");

//         cy.intercept("POST", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.create.badRequest.code,
//           body: apiResponses.ciraConfigs.create.badRequest.response,
//         }).as("post-config");

//         cy.intercept("GET", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.getAll.empty.code,
//           body: apiResponses.ciraConfigs.getAll.empty.response,
//         }).as("get-configs");
//       } else {
//         cy.intercept("POST", /admin$/).as("certificate");
//         cy.intercept("POST", "ciraconfigs").as("post-config");
//         cy.intercept("GET", "ciraconfigs").as("get-configs");
//       }

//       cy.enterCiraInfo(
//         ciraFixtures.wrong.name,
//         ciraFixtures.default.format,
//         ciraFixtures.default.addr,
//         ciraFixtures.default.username,
//         ciraFixtures.default.password
//       );
//       cy.get("button[type=submit]").click({ timeout: 50000 });

//       cy.wait("@post-config")
//         .its("response.statusCode")
//         .should("eq", apiResponses.ciraConfigs.create.badRequest.code);
//     });

//     it("invalid username", () => {
//       if (stubIt) {
//         cy.intercept("POST", /admin$/, {
//           statusCode: 200,
//           body: ciraFixtures.MpsCertificate,
//         }).as("certificate");

//         cy.intercept("POST", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.create.badRequest.code,
//           body: apiResponses.ciraConfigs.create.badRequest.response,
//         }).as("post-config");

//         cy.intercept("GET", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.getAll.empty.code,
//           body: apiResponses.ciraConfigs.getAll.empty.response,
//         }).as("get-configs");
//       } else {
//         cy.intercept("POST", /admin$/).as("certificate");
//         cy.intercept("POST", "ciraconfigs").as("post-config");
//         cy.intercept("GET", "ciraconfigs").as("get-configs");
//       }

//       cy.enterCiraInfo(
//         ciraFixtures.wrong.name,
//         ciraFixtures.default.format,
//         ciraFixtures.default.addr,
//         ciraFixtures.wrong.username,
//         ciraFixtures.default.password
//       );
//       cy.get("button[type=submit]").click();

//       cy.wait("@post-config").its("response.statusCode").should("eq", 400);
//     });

//     it("invalid password", () => {
//       if (stubIt) {
//         cy.intercept("POST", /admin$/, {
//           statusCode: 200,
//           body: ciraFixtures.MpsCertificate,
//         }).as("certificate");

//         cy.intercept("POST", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.create.badRequest.code,
//           body: apiResponses.ciraConfigs.create.badRequest.response,
//         }).as("post-config");

//         cy.intercept("GET", "ciraconfigs", {
//           statusCode: apiResponses.ciraConfigs.getAll.empty.code,
//           body: apiResponses.ciraConfigs.getAll.empty.response,
//         }).as("get-configs");
//       } else {
//         cy.intercept("POST", /admin$/).as("certificate");
//         cy.intercept("POST", "ciraconfigs").as("post-config");
//         cy.intercept("GET", "ciraconfigs").as("get-configs");
//       }

//       cy.enterCiraInfo(
//         ciraFixtures.wrong.name,
//         ciraFixtures.default.format,
//         ciraFixtures.default.addr,
//         ciraFixtures.default.username,
//         ciraFixtures.wrong.password
//       );
//       cy.get("button[type=submit]").click();

//       cy.wait("@post-config").its("response.statusCode").should("eq", 400);
//     });
//   });
// });
