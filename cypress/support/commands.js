// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })

//Enter info into a form
Cypress.Commands.add("login", (user, pass) => {
  if (user != "EMPTY") {
    cy.get("[name=userId]").type(user);
  }
  if (pass != "EMPTY") {
    cy.get("[name=Password]").type(pass);
  }
  cy.get("[id=btnLogin]").get("[type=submit]").click();
});

Cypress.Commands.add("enterCiraInfo", (name, format, addr, user, pass) => {
  cy.get("input").get("[name=configName]").type(name);
  if (format == "FQDN") {
    cy.contains("FQDN").click();
  }
  cy.get("input").get("[name=mpsServerAddress]").type(addr);
  cy.get("input").get("[name=username]").type(user);
  cy.get("input").get("[name=password]").type(pass);
});

Cypress.Commands.add(
  "enterProfileInfo",
  (name, admin, amtPass, mebxPass, network, cira) => {
    cy.get("input").get("[name=profileName]").type(name);
    if (!admin) {
      cy.get("mat-select[formcontrolname=activation").click();
      cy.contains("Client Control Mode").click();
    }
    cy.get("input").get("[name=amtPassword]").type(amtPass);
    cy.get("input").get("[name=mebxPassword]").type(mebxPass);
    cy.contains(network).click();
    cy.get("mat-select[formcontrolname=ciraConfigName]").click();
    cy.contains(cira).click();
  }
);

Cypress.Commands.add("enterDomainInfo", (name, domain, file, pass) => {
  cy.get("input[name=name]").type(name);
  cy.get("input[name=domainName]").type(domain);
});

// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
