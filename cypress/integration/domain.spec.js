// //https://open-amt-cloud-toolkit.github.io/docs/1.1/General/createProfileACM/

// //Tests the creation of a profile
// const loginFixtures = require("../fixtures/accounts.json");
// const urlFixtures = require("../fixtures/urls.json");
// const domainFixtures = require("../fixtures/domain.json");
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

// describe("Test Domain Page", () => {
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

//       cy.intercept("GET", "domains", {
//         statusCode: apiResponses.domains.getAll.empty.code,
//         body: apiResponses.domains.getAll.empty.response,
//       }).as("get-domains");
//     } else {
//       cy.intercept("POST", "authorize").as("login-request");
//       cy.intercept("GET", "domains").as("get-domains");
//     }

//     //Login and navigate to profile page
//     cy.visit(baseUrl);
//     cy.login(loginFixtures.default.username, loginFixtures.default.password);
//     cy.wait("@login-request")
//       .its("response.statusCode")
//       .should("eq", apiResponses.login.success.code);

//     cy.get(".mat-list-item").contains("Domains").click();
//     cy.wait("@get-domains")
//       .its("response.statusCode")
//       .should("eq", apiResponses.domains.getAll.empty.code);
//   });

//   context("successful run", () => {
//     it("creates the default domain", () => {
//       //Stub the get and post requests
//       if (stubIt) {
//         cy.intercept("POST", "domains", {
//           statusCode: apiResponses.domains.create.success.code,
//           body: apiResponses.domains.create.success.response,
//         }).as("post-domain");

//         cy.intercept("GET", "domains", {
//           statusCode: apiResponses.domains.getAll.success.code,
//           body: apiResponses.domains.getAll.success.response,
//         }).as("get-domains");
//       } else {
//         cy.intercept("POST", "domains").as("post-domains");
//         cy.intercept("GET", "domains").as("get-domains");
//       }

//       //Fill out the profile
//       cy.get("button").contains("Add New").click();
//       //TODO: add file path and password once cypress-upload-file is added
//       //and a spoof pfx file is created
//       cy.enterDomainInfo(
//         domainFixtures.default.name,
//         domainFixtures.default.domain
//       );
//       //TODO: delete cancel and click save button once page can be filled out
//       cy.get("button").contains("CANCEL").click();

//       //Wait for requests to finish and check them their responses
//       //TODO: add this code back when page can be submitted
//       // cy.wait("@post-domain").then((req) => {
//       //   cy.wrap(req)
//       //     .its("response.statusCode")
//       //     .should("eq", apiResponses.domains.create.success.code);
//       // });

//       //TODO: check the response to make sure that it is correct
//       //this is currently difficult because of the format of the response
//       cy.wait("@get-domains")
//         .its("response.statusCode")
//         .should("eq", apiResponses.domains.getAll.success.code);

//       // //Check that the config was successful
//       cy.get("mat-cell").contains(domainFixtures.default.name);
//       cy.get("mat-cell").contains(domainFixtures.default.domain);
//     });

//     //The delete test relies on the create test above.
//     //This is bad style but these tests seems distict enough to
//     //warrant haveing seperate tests. Consider fixing this style
//     //issue if the tests become finicky or hard to understand
//     it("deletes the default domain", () => {
//       //Stub requests
//       if (stubIt) {
//         cy.intercept("DELETE", "domains", {
//           statusCode: apiResponses.domains.delete.success.code,
//           body: apiResponses.domains.delete.success.response,
//         }).as("delete-domain");

//         cy.intercept("GET", "domains", {
//           statusCode: apiResponses.domains.getAll.empty.code,
//           body: apiResponses.domains.getAll.empty.response,
//         }).as("get-domains");
//       } else {
//         cy.intercept("DELETE", "domains").as("post-domains");
//         cy.intercept("GET", "domains").as("get-domains");
//       }

//       //Delete Domain (but cancel)
//       cy.get("mat-cell").contains("delete").click();
//       cy.get("button").contains("No").click();

//       //Check that the domain was not deleted
//       cy.get("mat-cell").contains(domainFixtures.default.name);
//       cy.get("mat-cell").contains(domainFixtures.default.domain);

//       //Delete Domain
//       cy.get("mat-cell").contains("delete").click();
//       cy.get("button").contains("Yes").click();
//       cy.wait("@delete-domain");

//       //Check that the Domain was deleted properly
//       cy.contains(domainFixtures.default.name).should("not.exist");
//       cy.contains(domainFixtures.default.domain).should("not.exist");
//     });
//   });
// });
