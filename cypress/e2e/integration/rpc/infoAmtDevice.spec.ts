/* eslint-disable no-template-curly-in-string */
describe('AMT Info', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    it('Should be in pre-provisioning mode', () => {
      cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest amtinfo', { failOnNonZeroExit: false }).then((result) => {
        cy.log(result.stdout)
        cy.log(result.stderr)
        expect(result.stderr).to.contain('pre-provisioning state')
      })
    })
  }
})
