//Tests the creation of a wireless
const apiResponses = require("../../fixtures/apiResponses.json")
const wirelessFixtures = require("../../fixtures/wireless.json")


//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
    beforeEach("clear cache and login", () => {
        cy.setup()
    })

    it("pagination for next page", () => {

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless")

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=5&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless")
      
        cy.goToPage("Wireless")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)
        cy.wait("@get-wireless")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`6 – 10 of ${wirelessFixtures.totalCount}`)
    })

    it("pagination for previous page", () => {

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless3")

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=5&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless4")
      
        cy.goToPage("Wireless")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)
        cy.wait("@get-wireless3")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`6 – 10 of ${wirelessFixtures.totalCount}`)
        cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)

    })

    it("pagination for last page", () => {

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless5")

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=15&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless6")
      
        cy.goToPage("Wireless")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)
        cy.wait("@get-wireless5")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`16 – 20 of ${wirelessFixtures.totalCount}`)
    })

    it("pagination for first page", () => {

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless5")

        cy.myIntercept("GET", "wirelessconfigs?$top=5&$skip=15&$count=true", {
            statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
            body: apiResponses.wirelessConfigs.getAll.forPaging.response,
        }).as("get-wireless6")
      
        cy.goToPage("Wireless")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)
        cy.wait("@get-wireless5")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`16 – 20 of ${wirelessFixtures.totalCount}`)
        cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${wirelessFixtures.totalCount}`)
    })

})