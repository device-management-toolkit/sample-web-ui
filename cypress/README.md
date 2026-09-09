# Cypress UI Validation Tool

Visit the [documentation for Cypress](https://docs.cypress.io/guides/overview/why-cypress) for an in-depth look of all cypress features

## How to use

### Locally

First spin up a local instance of the sample web ui using `npm run start`

> You may need to configure `device-management-toolkit/docker-compose.yml` to prevent network errors

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
This is where new functions can be added to cypress to help reduce redundancy within test cases. See [documentation](https://docs.cypress.io/api/cypress-api/custom-commands) for more information on this feature.

### Environment Variables

Defaults live in the Cypress configuration files. Override them with `cypress.env.json`, `CYPRESS_*` environment variables, or `npm run cypress -- --env VAR_NAME=VALUE,VAR_NAME2=VALUE2`.

Read public configuration, such as `BASEURL` and `ISOLATE`, synchronously with `Cypress.expose('BASEURL')`. The shared `publicConfig()` helper copies only allowed keys from `env` into `expose`; explicit `--expose` values take precedence. Common public keys are listed in `cypress/support/public-config.ts`; a suite can supply its own allowlist in its configuration file. Unknown keys remain in `env`.

Read credentials inside a test, hook, or custom command with `cy.env()`:

```ts
cy.env(['MPS_PASSWORD']).then(({ MPS_PASSWORD }) => {
  cy.get('[name=Password]').type(MPS_PASSWORD, { log: false })
})
```

Keep credentials out of `expose`, global caches, and spec module scope. `cy.env()` logs only key names, but later commands and assertions can reveal values; disable logging on credential-bearing commands and compare secrets using boolean assertions. See the [Cypress environment-variable documentation](https://docs.cypress.io/api/commands/env).

RPC commands run through the Node `exec` task. Ordinary nonzero exits are returned for negative tests; timeouts, signals, and execution failures reject the task so they cannot pass as expected command failures.

Run the configuration and RPC process regression checks with `node --test cypress/node-tests/migration.test.cjs`.

Docker RPC commands use a uniquely named container and explicitly remove it before returning a result or failure. Timeouts, output limits, run cancellation, and plugin shutdown also trigger cleanup. A cleanup failure blocks further RPC commands in that run.

Run the container cleanup checks with `node --test --test-timeout=60000 cypress/node-tests/docker-cleanup.test.cjs`. These require a running Docker daemon and use an Alpine test container without device access. Set `CYPRESS_DOCKER_TEST_IMAGE` to use an existing compatible image.
