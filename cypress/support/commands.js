//Add repeditive groups of functions here

const apiResponses = require("../fixtures/apiResponses.json")
const loginFixtures = require("../fixtures/accounts.json")

//-------------------- before / beforeEach ---------------------------

Cypress.Commands.add("setup", () => {
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })

  cy.myIntercept("POST", "authorize", {
    statusCode: apiResponses.login.success.code,
    body: { token: "" },
  }).as("login-request")

  cy.myIntercept("GET", "mps/api/v1/devices/stats", {
    statusCode: 200,
    body: {  },
  }).as("stats-request")

  //Login
  cy.visit(Cypress.env("BASEURL"))
  cy.login(loginFixtures.default.username, loginFixtures.default.password)
  cy.wait("@login-request")
    .its("response.statusCode")
    .should("eq", apiResponses.login.success.code)
  
})


//------------------- Enter info into a form -------------------------

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

    if (admin) {
      cy.get("input").get("[name=mebxPassword]").type(mebxPass);
    }
    
    cy.contains(network).click();
    cy.get("mat-select[formcontrolname=ciraConfigName]").click();
    cy.contains(cira).click();
  }
);

Cypress.Commands.add("enterDomainInfo", (name, domain, file, pass) => {
  cy.get('input[name="name"]').type(name)
  cy.get('input[name="domainName"]').type(domain)
  cy.get('input[type="file"]').attachFile(file)
  cy.get('input[name="provisioningCertPassword"]').type(pass)
});

Cypress.Commands.add("enterWirelessInfo", (name, ssid, password) => {
  cy.get('input[name="profileName"]').type(name)
  cy.get('input[name="ssid"]').type(ssid)
  cy.get('input[name="pskPassphrase"]').type(password)
  cy.get("mat-select[formcontrolname=authenticationMethod]").click().get("mat-option").contains("WPA PSK").click()
  cy.get("mat-select[formcontrolname=encryptionMethod]").click().get("mat-option").contains("TKIP").click()
})

//------------------------- Common Navigation --------------------------

Cypress.Commands.add("goToPage", (pageName) => {
  cy.get(".mat-list-item").contains(pageName).click();
});

//------------------------------- Other --------------------------------

Cypress.Commands.add("myIntercept", (method, url, body) => {
  if (Cypress.env("ISOLATE").charAt(0).toLowerCase() != "n") {
    cy.intercept(method, url, body);
  } else {
    cy.intercept(method, url);
  }
});

//------------------------------ Help --------------------------------

// https://on.cypress.io/custom-commands

// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
