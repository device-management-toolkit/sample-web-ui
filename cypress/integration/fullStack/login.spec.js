//Tests the login page with a multitude of fake accounts in 
//different combinations of invalid login info.
//Also tests things like canceling a login and logging out after the login

const loginFixtures = require('../../fixtures/accounts.json')
const urlFixtures = require('../../fixtures/urls.json')

describe('Load Site', () => {
  it('loads the login page properly', () => {
    //Make sure the test always starts at the login page
    //and is never able to autologin 
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    //Go to base site
    cy.visit(urlFixtures.base)

    //Make sure the login page was hit
    cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
  })
})

describe('Test login page', () => {

  before('Load Site', () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
    cy.visit(urlFixtures.base)
    cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
  })

  beforeEach('Clear inputs', () => {
    //Cannot simply clear inputs since the user's
    //login state cannot be guaranteed
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
    cy.reload()
  })

  context('Successful login', () => {
    it('logs in', () => {
      //Login
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)
      cy.get('.login-btn')
        .contains('Sign In')
        .click()

      //Check that the login was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.landing)
    })
  })

  context('Failed login', () => {
    it('no username / valid password', () => {
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)

      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('invalid username / valid password', () => {
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.wrong.username)
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)

      cy.get('.login-btn')
        .contains('Sign In')
        .click()

      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
      cy.get('.error-message')
        .should('be.visible')
    })

    it('valid username / no password', () => {
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)

      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('valid username / invalid password', () => {
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.wrong.password)

      cy.get('.login-btn')
        .contains('Sign In')
        .click()

      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
      cy.get('.error-message')
        .should('be.visible')
    })

    it('no username / invalid password', () => {
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.wrong.password)

      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('no username / no password', () => {
      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })
  })

  context('Canceled login', () => {
    it('cancels a valid login', () => {
      //Enter info and cancel
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)
        .should('have.value', loginFixtures.default.username)
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)
        .should('have.value', loginFixtures.default.password)
      cy.get('.login-btn')
        .contains('Cancel')
        .click()

      //Check that the cancel was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
      cy.get('.error-message')
        .should('have.length', 2)
      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('cancels a partial login (username only)', () => {
      //Enter info and cancel
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)
        .should('have.value', loginFixtures.default.username)
      cy.get('.login-btn')
        .contains('Cancel')
        .click()

      //Check that the cancel was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
      cy.get('.error-message')
        .should('have.length', 1)
      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('cancels a partial login (password only)', () => {
      //Enter info and cancel
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)
        .should('have.value', loginFixtures.default.password)
      cy.get('.login-btn')
        .contains('Cancel')
        .click()

      //Check that the cancel was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
      cy.get('.error-message')
        .should('have.length', 1)
      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })

    it('cancels an empty login', () => {
      cy.get('.login-btn')
        .contains('Cancel')
        .click()

      cy.get('.login-btn')
        .contains('Sign In')
        .parent()
        .should('have.attr', 'disabled')
    })
  })

  context('Logout', () => {
    it('logs in then out', () => {
      //Login
      cy.get('.login-input')
        .get('[id=userName]')
        .type(loginFixtures.default.username)
      cy.get('.login-input')
        .get('[id=password]')
        .type(loginFixtures.default.password)
      cy.get('.login-btn')
        .contains('Sign In')
        .click()

      //Check that the login was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.landing)

      // //Logout
      cy.get('.item-icon')
        .get('.profile')
        .click()
      cy.contains('Logout')
        .click()

      //Check that the logout was successful
      cy.url().should('eq', urlFixtures.base + urlFixtures.page.login)
    })
  })
})