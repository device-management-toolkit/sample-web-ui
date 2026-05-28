# Download RPC — Design

**Date:** 2026-05-28
**Status:** Approved (design); pending implementation plan
**Repos affected:** `sample-web-ui` (Angular UI — primary), `console` (Go backend — companion contract)

## Summary

Add a new **"Download RPC"** feature to the reference UI. It presents a single page where a
user assembles an rpc-go run package: pick the rpc-go version, pick the target OS/architecture,
choose an authentication method, and choose the command to pre-fill (`activate` or `deactivate`).
A single call to the Console `POST /api/package` endpoint returns a zip containing the extracted
rpc-go binary plus a generated `config.yaml`. Console performs all GitHub/network/templating work
server-side to avoid CORS and to keep token/credential handling off the browser.

## Deployment-flavor constraint (important)

This feature depends on the Console backend (`POST /api/package`, `GET /api/package/rpc-versions`).
The **cloud flavor (standalone MPS+RPS, no Console)** has no such backend and therefore cannot pack
the zip, proxy GitHub, or mint tokens.

**Decision:** "Download RPC" is **enterprise-only**. The navbar item and route are gated on
`environment.cloud === false` (the inverse of how proxy-configs is gated on `cloudMode === true`).
In cloud builds the feature does not appear. This is an explicit, intentional one-sided feature, in
line with CLAUDE.md guidance to call this out rather than silently break a flavor.

## Scope

**In scope (v1):**
- Commands: `activate` and `deactivate` only.
- rpc-go version listing: v3 and above, including betas.
- OS/arch selection with browser-detected default.
- Auth: server-minted **token** (flag only) OR **username/password** (written to config).
- Single `POST /api/package` producing a downloadable zip (extracted binary + `config.yaml`).

**Deferred:**
- The `configure` command tree (amtpassword, mebx, amtfeatures, wired, wireless, tls, proxy,
  sync-clock, sync-hostname, wifisync).
- Local (on-box) deactivate. v1 deactivate is **remote only**.

## UI design (repo A: `sample-web-ui`)

### Route & navigation
- New nav item **"Download RPC"** in `core/navbar`, rendered only when `environment.cloud === false`.
- New route `download-rpc` behind `AuthGuard` in `src/app/routes.ts`.
- New feature folder `src/app/download-rpc/`:
  - `download-rpc.component.ts` / `.html` / `.scss` / `.spec.ts`
  - `download-rpc.service.ts` / `.spec.ts`
  - constants file if helpful (mode enums, asset-detection map).
- Standalone component, reactive forms, Angular Material, `@if`/`@for`, no semicolons / single
  quotes, SPDX Apache-2.0 Intel header on every file. Shape follows existing `*-detail` and
  `add-device-enterprise` components.
- i18n strings added to the translation files alongside the other features.

### Form (single page)
Top-level control: **Command** = `activate` | `deactivate`.

Always shown:
- **Version** — dropdown from `GET /api/package/rpc-versions` (Console-proxied; v3+ incl. beta;
  offline → Console local-directory scan). UI just renders whatever Console returns.
- **OS / Architecture** — dropdown sourced from the selected release's available assets; default
  pre-selected via best-effort browser detection (`navigator.userAgentData` high-entropy values /
  `navigator.platform`). User can override.
- **Auth method** — radio:
  - `Token` → no inputs; sends `{ mode: "token" }`. Console mints the JWT and fills `auth-token`,
    `auth-endpoint`, `devices-endpoint`.
  - `Username / Password` → two inputs; sends `{ mode: "userpass", username, password }`. Console
    writes `auth-username` / `auth-password` (plaintext) plus the endpoints.

Command-conditional:
- **activate**: **Profile** selector (required, from `ProfilesService`). When the selected
  profile's `activation` is **ACM**, a **Domain** selector appears and is required (from
  `DomainsService`). For **CCM** the domain selector is hidden and not required.
- **deactivate**: remote only — auth block applies; no profile/domain.

Submit button **Download**, disabled until the form is valid. On success the response blob is
saved via a browser download. Errors flow through the existing `error-handling.interceptor` and
`AuthService.onError` conventions (snackbar).

### Service & request contract
`DownloadRpcService` (mirrors existing services: `inject(HttpClient)`, `inject(AuthService)`,
`environment.rpsServer` base which resolves to `##CONSOLE_SERVER_API##` in enterprise):

- `getVersions(): Observable<RpcRelease[]>` → `GET {base}/api/package/rpc-versions`
- `buildPackage(req): Observable<Blob>` → `POST {base}/api/package` with `responseType: 'blob'`

Request body:
```json
{
  "command": "activate",
  "version": "v3.0.1",
  "os": "linux",
  "arch": "x86_64",
  "auth": { "mode": "token" },
  "profile": "myProfile",
  "domain": "my.domain.com"
}
```
- `auth.mode` is `"token"` or `"userpass"`; for `userpass`, include `username`/`password`.
- `profile` present only for `activate`; `domain` present only for `activate` + ACM.

`RpcRelease` shape (rendered by the version/asset dropdowns) is defined by Console's response;
at minimum: a version string/tag and a list of available assets each carrying an OS + arch the UI
can label and map to the request's `os`/`arch`.

## Console design (repo B: `console`) — companion contract

New `internal/controller/httpapi/v1` handler plus a usecase. Endpoints:

- `GET /api/package/rpc-versions`
  - Lists rpc-go GitHub releases filtered to v3+ (betas included).
  - On no internet: scans a configured local directory of pre-staged rpc-go release assets and
    returns those versions/assets instead.
  - Returns versions with their available OS/arch assets.

- `POST /api/package`
  - Resolves the requested `version` + `os`/`arch` to a release asset.
  - Downloads the asset (or reads it from the local directory), extracts the `rpc`/`rpc.exe`
    binary from the archive.
  - Generates the **full** `config.yaml` — all sections present as in the sample, but only the
    chosen command's fields populated. Fills server endpoints (`auth-endpoint`, `devices-endpoint`)
    from Console's own configuration. For `auth.mode = token`, mints a JWT and sets `auth-token`.
    For `userpass`, sets `auth-username`/`auth-password`. For `activate`, sets `activate.url` to the
    profile export URL (`.../api/v1/admin/profiles/export/<profile>[?domainName=<domain>]`). For
    `deactivate`, populates the remote deactivate fields + server-auth block.
  - Zips the extracted binary + `config.yaml` and returns `application/zip`.

(Exact handler wiring, usecase boundaries, and config templating live in the Console repo's own
spec/plan; this section is the contract the UI depends on.)

## Config.yaml field mapping (reference)

Based on `docs/rpc-config.sample.yml`. The generated file is the full template; only the rows below
are populated for v1.

| Form input | config.yaml field |
|---|---|
| Auth = token | `auth-token` (server-minted), `auth-endpoint`, `devices-endpoint` |
| Auth = userpass | `auth-username`, `auth-password`, `auth-endpoint`, `devices-endpoint` |
| Command = activate, Profile (+Domain if ACM) | `activate.url` = profile export URL with optional `domainName` |
| Command = deactivate (remote) | `deactivate.url` + server-auth block |

## Testing

- **UI (Karma/Jasmine):**
  - Component spec: command toggle, ACM→domain conditional (and CCM hides it), required-field
    validation, OS/arch default detection, blob download on success, error path.
  - Service spec: request URL/body shaping for both auth modes and both commands; `blob`
    response handling. Avoid deprecated `HttpTestingModule` / `RouterTestingModule`.
  - Navbar: item hidden when `environment.cloud === true`.
- **Console (Go):** handler/usecase unit tests with mocked GitHub API and filesystem (version
  listing, offline fallback, asset resolution, config templating, zip assembly). Defined in repo B.

## Open assumptions (flag if wrong)

1. Console fills `auth-endpoint` / `devices-endpoint` from its own config; the UI does not send them.
2. rpc-go release assets expose enough metadata for Console to return OS/arch labels the UI maps to
   `os`/`arch` request fields.
3. v1 deactivate is remote-only; local deactivate is deferred.
