# Cypress UI Validation Tool
Visit the [documentation for Cypress](https://docs.cypress.io/guides/overview/why-cypress) for an in-depth look of all cypress features

## How to use

### Locally
First spin up a local instance of the sample web ui using `npm run start`

> You may need to configure `open-amt-cloud-toolkit/docker-compose.yml` to prevent network errors

Once the server is up on `http://localhost:4200/`, open a new terminal and run `npm run cypress`. This will start the cypress testing gui.

<img src="https://user-images.githubusercontent.com/65725233/115896355-2e690a80-a410-11eb-8b3a-ce8958d31284.png" width="50%">

From here you can choose to run any of the test cases stored in the integration folder.

### Through GitHub Actions
In github click on the `Actions` tab and choose the `Cypress CI` workflow. Now simply click `Run workflow` and choose the branch you wish to test. This will spin up a container to run through all the UI tests in the integration folder sequentially and return a log reporting if the tests were successful or not. To change how this action is triggered or what it runs, go to `sample-web-ui/.github/workflows/cypress.yml`.

## Code Layout
The core groupings of code within this cypress project are tests, fixtures, commands and enviornment variables. 

### Tests
`sample-web-ui/cypress/integartion/*.spec.js`<br>
This is where all of the test cases are stored. Currently each page of the ui has its own test file, which goes through a happy path use case of that page.

### Fixtures
`sample-web-ui/cypress/fixtures/*.json`<br>
This is where data for filling out certain fields, verfiying urls and mocking api responses is stored.

### Commands
`sample-web-ui/cypress/support/commands.js`<br>
This is where new fuctions can be added to cypress to help reduce redundancy within test cases. See [documentation](https://docs.cypress.io/api/cypress-api/custom-commands) for more information on this feature.

### Environment Variables
`sample-web-ui/cypress.json`<br>
This is where important variables such as the base url of the server, passwords and whether cypress should mock api reponses are stored. You can add a new variable and call it in a test case with `Cypress.env("VARIABLE_NAME")`. If you wish to change an environment variable for a single instance of cypress, you can run `npm run cypress -- --env VAR_NAME=VALUE,VAR_NAME2=VALUE2` instead of the usual command. 