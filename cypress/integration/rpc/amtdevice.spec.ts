describe('Successful execution of pre-provisioning on amtdevice', { execTimeout: 90000 }, () => {
  it('Control Mode is pre-provisioning with AMT info ALL', () => {
    cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest amtinfo', { failOnNonZeroExit: false }).then((result) => {
      cy.log(result.stderr)
      expect(result.stderr).to.contain('pre-provisioning state')
    })
  })

  it('Control Mode is pre-provisioning with Activate Device', { execTimeout: 90000 }, () => {
    cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest activate -u wss://cicdoact.eastus.azurecontainer.io:8443/activate -v -n --profile happyPath',{ failOnNonZeroExit: false }).then((result) => {
      // cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest version', { failOnNonZeroExit: false }).then((result) => {
      cy.log(result.stdout)
      console.log(result.stdout)
      expect(result.stderr).to.contain('pre-provisioning state')
    })
  })

  it('Control Mode is pre-provisioning with Deacivate Device', { execTimeout: 90000 }, () => {
    cy.exec('docker run --device=/dev/mei0 intel/oact-rpc-go:latest --url deactivate -u wss://cicdoact.eastus.azurecontainer.io:8443/activate -v -n -c "deactivate -f --password ${{ secrets.AMT_PASSWORD }}"', { failOnNonZeroExit: false }).then((result) => {
      cy.log(result.stdout)
      expect(result.stdout).to.contain('pre-provisioning state')
    })
  })
})