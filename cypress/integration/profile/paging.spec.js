//Tests the creation of a profile
const apiResponses = require("../../fixtures/apiResponses.json")
const profileFixtures = require("../../fixtures/profile.json")


//---------------------------- Test section ----------------------------

describe("Test Profile Page", () => {
    beforeEach("clear cache and login", () => {
        cy.setup()
    })

    it("pagination for next page", () => {

        cy.myIntercept("GET", "profiles?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles")

        cy.myIntercept("GET", "profiles?$top=5&$skip=5&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles2")
      
        cy.goToPage("Profiles")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)
        cy.wait("@get-profiles")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`6 – 10 of ${profileFixtures.totalCount}`)
    })

    it("pagination for previous page", () => {

        cy.myIntercept("GET", "profiles?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles3")

        cy.myIntercept("GET", "profiles?$top=5&$skip=5&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles4")
      
        cy.goToPage("Profiles")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)
        cy.wait("@get-profiles3")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`6 – 10 of ${profileFixtures.totalCount}`)
        cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)

    })

    it("pagination for last page", () => {

        cy.myIntercept("GET", "profiles?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles5")

        cy.myIntercept("GET", "profiles?$top=5&$skip=15&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles6")
      
        cy.goToPage("Profiles")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)
        cy.wait("@get-profiles5")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`16 – 20 of ${profileFixtures.totalCount}`)
    })

    it("pagination for first page", () => {

        cy.myIntercept("GET", "profiles?$top=5&$skip=0&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles5")

        cy.myIntercept("GET", "profiles?$top=5&$skip=15&$count=true", {
            statusCode: apiResponses.profiles.getAll.forPaging.code,
            body: apiResponses.profiles.getAll.forPaging.response,
        }).as("get-profiles6")
      
        cy.goToPage("Profiles")
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)
        cy.wait("@get-profiles5")

        cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`16 – 20 of ${profileFixtures.totalCount}`)
        cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click();
        cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 5 of ${profileFixtures.totalCount}`)
    })

})