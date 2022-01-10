describe('Successful execution of pre-provisioning on amtdevice', () => {
  it('Control Mode is pre-provisioning', () => {
    cy.exec('docker run intel/oact-rpc-go:latest amtinfo')
    .its('stdout')
    .should('contain','pre-provisioning state');
  });

});