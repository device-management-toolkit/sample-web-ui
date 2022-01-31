/* eslint-disable no-template-curly-in-string */
describe('Deactivate', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    it('Should deactivate AMT device', { execTimeout: 90000 }, () => {
      cy.exec('docker run --device=/dev/mei0 vprodemo.azurecr.io/rpc-go:latest deactivate -u wss://${FQDN}/activate -v -n -f -json --password ${CYPRESS_AMTPASSWORD}', { failOnNonZeroExit: false }).then((result) => {
        expect(result.stderr).to.contain('Status: Deactivated')
      })
    })
  }
})
