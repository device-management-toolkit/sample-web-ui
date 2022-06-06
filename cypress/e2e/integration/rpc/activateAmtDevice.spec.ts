/* eslint-disable no-template-curly-in-string */
describe('Activate', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    it('Should activate AMT device', { execTimeout: 240000 }, () => {
      cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest activate -u wss://${FQDN}/activate -v -n --profile ${profileName}', { failOnNonZeroExit: false }).then((result) => {
        expect(result.stderr).to.contain('Status: Client control mode')
        expect(result.stderr).to.contain('Network: Ethernet Configured.')
        expect(result.stderr).to.contain('CIRA: Configured')
      })
    })
  }
})
