//Tests the creation of a cira-config

const apiResponses = require("../../fixtures/apiResponses.json")
const ciraFixtures = require("../../fixtures/cira.json")

//---------------------------- Test section ----------------------------

describe("Test CIRA Config Page", () => {
    beforeEach("Clear cache and login", () => {
        cy.setup()
    })

    it('pagination for next page', () => {

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=0&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs")

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=25&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs2")

    //Fill out the config
    cy.goToPage("CIRA Configs")
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)
    cy.wait('@get-configs')
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${ciraFixtures.totalCount}`)
   })

   it("paging for previous page", () => {

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=0&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs3")

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=50&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs4")

    //Fill out the config
    cy.goToPage("CIRA Configs")
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)
    cy.wait('@get-configs3')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click();
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${ciraFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click();
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)

   })

   it("paging for last page", () => {

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=0&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs5")

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=25&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs6")

     //Fill out the config
     cy.goToPage("CIRA Configs")
     cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)
     cy.wait('@get-configs5')

     cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
     cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${ciraFixtures.totalCount}`)

   })

   it("paging for first page", () => {

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=0&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs7")

    cy.myIntercept("GET", "ciraconfigs?$top=25&$skip=25&$count=true", {
        statusCode: apiResponses.ciraConfigs.getAll.forPaging.code,
        body: apiResponses.ciraConfigs.getAll.forPaging.response,
    }).as("get-configs8")

     //Fill out the config
     cy.goToPage("CIRA Configs")
     cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)
     cy.wait('@get-configs7')

     cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click();
     cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${ciraFixtures.totalCount}`)
     cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click();
     cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${ciraFixtures.totalCount}`)

   })

})

