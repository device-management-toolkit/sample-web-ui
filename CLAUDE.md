# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular 21 single-page app — the reference UI for the Device Management Toolkit (Intel AMT / vPro). The same codebase serves two deployment targets:

- **Cloud / standalone MPS+RPS** (default build) — the UI talks directly to a separate MPS server (device interaction) and RPS server (provisioning profiles/configs), plus an optional Vault. This is the `environment.ts` flavor.
- **Console / enterprise** (`enterprise` build configuration) — the UI is bundled into the Console deployment and routes all backend calls through a single Console API gateway (`##CONSOLE_SERVER_API##` placeholder), with OAuth/OIDC enabled. This flavor is what ships in the Docker image and is reconfigured per deployment via `init.sh`.

There is no backend code in this repo.

## Common commands

```bash
npm start                       # ng serve on http://localhost:4200 (cloud/dev build)
npm run enterprise              # ng serve with the enterprise.dev environment
npm run build                   # ng build (dev, no optimization) → dist/samplewebui/browser/
npm run build-enterprise        # production-style build with token placeholders → ui/browser/
npm test                        # Karma + Jasmine, watch mode, Chrome
npm run test-ci                 # single-run, ChromeHeadlessCI, JUnit + coverage
npm run lint                    # ng lint (TS + HTML via angular-eslint)
npm run prettify                # write Prettier formatting across the repo
npm run cypress                 # open Cypress runner (interactive)
npm run cy-runner               # cypress run (headless)
```

Run a single Karma spec by appending a fdescribe/fit to the file, or by passing `--include` to `ng test` (e.g. `npm test -- --include='**/devices.component.spec.ts'`).
Run a single Cypress spec: `npx cypress run --spec "cypress/e2e/integration/<area>/<file>.cy.ts"`.
The `Makefile` (`make cy`, `make runner`, `make e2e-runner`) wraps Cypress with `ISOLATED` / `BASEURL` env vars used by the test suite to switch between mocked and live backends.

## Architecture

### Two build flavors via environment files
`angular.json` defines configurations `enterprise`, `enterprise-dev`, and `production`, each swapping `src/environments/environment.ts` with a sibling file:

- `environment.ts` (default/cloud dev) — points to `http://localhost:3000` (MPS) and `:8081` (RPS), `cloud: true`.
- `environment.enterprise.ts` — `cloud: false`, all backend URLs and OAuth fields are literal placeholder tokens (`##CONSOLE_SERVER_API##`, `##VAULT_SERVER##`, `##CLIENTID##`, etc.). `init.sh` runs at container start (`docker-entrypoint.d`) and `sed`-replaces these placeholders in the built JS using env vars (`RPS_SERVER`, `MPS_SERVER`, `VAULT_SERVER`, `AUTH_MODE_ENABLED`). This is how a single image is reconfigured per deployment — do not delete the `##...##` tokens from `environment.enterprise.ts`.
- `environment.enterprise.dev.ts` — same shape but with real dev-time URLs for local enterprise debugging.

When adding a new backend URL or auth setting, add it to *all four* environment files and (if it's a runtime knob in enterprise) extend `init.sh` to substitute it.

### App structure
Standalone-component app bootstrapped from `src/main.ts`; routes live in `src/app/routes.ts`. Top-level feature folders under `src/app/` mirror the route hierarchy: `devices`, `profiles`, `configs` (CIRA), `domains`, `wireless`, `ieee8021x`, `proxy-configs`, `dashboard`, `login`, `event-channel`. Each typically has a list component, a `*-detail` component for create/edit, and a service. The `core/` folder holds the chrome (navbar, toolbar, about); `shared/` holds the `AuthGuard`, dialogs (`are-you-sure`, `power-up-alert`, `random-pass-alert`, `static-cira-warning`), the `add-device` wizards (cloud and enterprise variants), pipes, and config helpers.

### Auth + HTTP plumbing
`AuthService` (`src/app/auth.service.ts`) and `AuthGuard` (`src/app/shared/auth-guard.service.ts`) gate every route except `/login`. Two HTTP interceptors are wired globally: `authorize.interceptor` (attaches credentials / bearer tokens) and `error-handling.interceptor`. OAuth/OIDC is via `angular-oauth2-oidc` — controlled by `environment.useOAuth`. The `enterprise` build is what flips OAuth on via the `##AUTH_MODE_ENABLED##` token.

### Tests
- Unit: Karma + Jasmine, every `*.spec.ts` next to its source. Coverage is on by default; HTML output lands in `coverage/samplewebui/`.
- E2E: Cypress under `cypress/e2e/integration/<feature>/`. Specs depend on `ISOLATED` (true → fixtures only) vs a live backend at `BASEURL`. JUnit XML reports land at the repo root.

## Conventions

- Angular 20+ idioms: standalone components, signals when applicable, reactive forms, control-flow syntax (`@if`/`@for`), prefer zoneless change detection.
- Use Angular Material components.
- No semicolons; single quotes in TypeScript (enforced by Prettier).
- Avoid deprecated test utilities (`HttpTestingModule`, `RouterTestingModule`) in new specs.
- After changes, verify the component and its template render/function correctly, run `npm run lint`, and ensure unit tests pass 100% before declaring done.

ESLint enforces selector prefixes: components `app-` (kebab-case element), directives `app` (camelCase attribute).

### Implementation guidelines
- Match the style of the surrounding code — new features and fixes should look like they belong with the existing code in that folder (file layout, naming, idioms, test shape).
- Prefer simplicity over complexity. Don't introduce abstractions, layers, or options that aren't earned by an actual requirement.
- Every change must work for **both deployment flavors** (cloud MPS+RPS and Console/enterprise). Before finishing, consider: does this rely on env values that only one flavor sets? Does it assume OAuth on/off? Does it touch a URL that comes from a `##...##` token? If a feature genuinely cannot be supported on one side, call that out explicitly rather than silently breaking it.

Every source file must carry the SPDX Apache-2.0 Intel copyright header — `eslint-plugin-license-header` checks this and `license-header.js` defines the template.

### Commits & PRs (`CONTRIBUTING.MD`)
Conventional Commits, with constrained scopes: `8021x`, `config`, `core`, `dashboard`, `deps`, `deps-dev`, `devices`, `docker`, `domains`, `gh-actions`, `login`, `profiles`, `wireless`, or no scope. The footer should reference a github issue: `Resolves: #1234`. Header lines ≤72 chars. PR titles follow the same format. Merge with rebase or squash to preserve linear history.

**Never commit or push automatically.** Make the requested edits and stop. Only run `git commit` or `git push` when the user explicitly asks for it in that message — a prior "commit it" does not authorize future commits.
