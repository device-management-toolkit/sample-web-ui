/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * DMT Test Environment Version Fetcher
 *
 * Fetches component versions and hardware info before any test spec runs.
 * Called from cypress.config.ts setupNodeEvents `before:run` event.
 * Writes results to cypress/reports/.test-environment.json for consumption
 * by the custom HTML reporter.
 *
 * ── Backend service versions ────────────────────────────────────────────────
 *   Backend API URLs are resolved in priority order:
 *   1. MPS_SERVER / RPS_SERVER env vars in cypress.env.json  (highest priority)
 *      CLOUD=false : MPS_SERVER = Console base URL
 *      CLOUD=true  : MPS_SERVER = MPS base URL, RPS_SERVER = RPS base URL
 *      Set these to avoid touching git-tracked Angular environment files.
 *   2. Angular environment source files (src/environments/):
 *      CLOUD=false → environment.enterprise.dev.ts → mpsServer (Console)
 *      CLOUD=true  → environment.ts               → mpsServer (MPS), rpsServer (RPS)
 *   3. Fallback localhost defaults (http://localhost:8181 or 3000/8081)
 *   CLOUD=false (Console Enterprise):
 *     console       (1) CONSOLE_VERSION env var
 *                   (2) GET {mpsServer}/version → .current
 *   CLOUD=true (MPS + RPS):
 *     mps           (1) MPS_VERSION env var
 *                   (2) GET {mpsServer}/api/v1/version → .serviceVersion
 *     rps           (1) RPS_VERSION env var
 *                   (2) GET {rpsServer}/api/v1/admin/version → .serviceVersion
 *
 * ── Other software component versions ──────────────────────────────────────
 *   All taken solely from user-specified env vars in cypress.env.json.
 *   Report order and components follow the key order in cypress.env.json exactly.
 *   Deployment-scoped keys are automatically hidden for the wrong deployment:
 *     Console-only: CONSOLE_VERSION, GO_WSMAN_MESSAGES_VERSION (hidden when CLOUD=true)
 *     Cloud-only:   MPS_VERSION, RPS_VERSION, MPS_ROUTER_VERSION, WSMAN_MESSAGES_VERSION (hidden when CLOUD=false)
 *   Any other *_VERSION key is always reported regardless of deployment type.
 *   Set to "SKIP" to hide a component from the report.
 *
 * ── AMT Firmware version ────────────────────────────────────────────────────
 *   Queried from Console or MPS devices API (deviceInfo.fwVersion).
 *   Only when ISOLATE=N. Uses MPS_SERVER (Console or MPS base URL).
 *   Authentication:
 *     CLOUD=false (Console): CONSOLE_USERNAME + CONSOLE_PASSWORD (falls back to MPS_USERNAME/PASSWORD)
 *     CLOUD=true  (MPS):     MPS_USERNAME + MPS_PASSWORD
 *   If Console auth is disabled (auth.disabled=true in config.yml), login is
 *   attempted but failure is tolerated and the devices API is tried without a token.
 *   Device selection: matches DEVICE env var (IP or hostname), or first device found.
 */

'use strict'

const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')

/** Sentinel value: set any component version env var to this to hide it from the report. */
const HIDE_MARKER = 'SKIP'

/**
 * Sentinel value: set an API-fetchable version key to this to explicitly request a live API
 * lookup. Equivalent to leaving the value empty, but preferred in CI because Cypress silently
 * discards CYPRESS_FOO= env vars with empty values — a non-empty sentinel survives intact.
 * Applies to: CONSOLE_VERSION, MPS_VERSION, RPS_VERSION.
 */
const AUTO = 'AUTO'

// ─── HTTP Helpers ────────────────────────────────────────────────────────────

function fetchJSON(url, timeoutMs = 5000, headers = {}) {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https:') ? https : http
      const req = protocol.get(url, { rejectUnauthorized: false, headers }, (res) => {
        let raw = ''
        res.on('data', (c) => {
          raw += c
        })
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300
          try {
            resolve({ ok, data: JSON.parse(raw), statusCode: res.statusCode })
          } catch {
            resolve({ ok: false, data: null, reason: 'invalid JSON response' })
          }
        })
      })
      req.setTimeout(timeoutMs, () => {
        req.destroy()
        resolve({ ok: false, data: null, reason: `timed out after ${timeoutMs}ms` })
      })
      req.on('error', (err) => {
        resolve({ ok: false, data: null, reason: err.message })
      })
    } catch (err) {
      resolve({ ok: false, data: null, reason: String(err) })
    }
  })
}

function postJSON(url, body, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https:') ? https : http
      const payload = JSON.stringify(body)
      const u = new URL(url)
      const options = {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https:') ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        rejectUnauthorized: false
      }
      const req = protocol.request(options, (res) => {
        let raw = ''
        res.on('data', (c) => {
          raw += c
        })
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300
          try {
            resolve({ ok, data: JSON.parse(raw), statusCode: res.statusCode })
          } catch {
            resolve({ ok: false, data: null, reason: 'invalid JSON response' })
          }
        })
      })
      req.setTimeout(timeoutMs, () => {
        req.destroy()
        resolve({ ok: false, data: null, reason: `timed out after ${timeoutMs}ms` })
      })
      req.on('error', (err) => {
        resolve({ ok: false, data: null, reason: err.message })
      })
      req.write(payload)
      req.end()
    } catch (err) {
      resolve({ ok: false, data: null, reason: String(err) })
    }
  })
}

// ─── Angular Environment Reader ─────────────────────────────────────────────

/**
 * Resolves backend server URLs in priority order:
 *   1. MPS_SERVER / RPS_SERVER env vars  (highest priority, taken as-is)
 *      CLOUD=false: MPS_SERVER = Console base URL
 *      CLOUD=true:  MPS_SERVER = MPS base URL, RPS_SERVER = RPS base URL
 *   2. BASEURL env var (set automatically by CI workflows via CYPRESS_BASEURL):
 *      CLOUD=true  + non-localhost BASEURL → derives Kong paths:
 *        mpsServer = {BASEURL}/mps    e.g. https://host:8443/mps
 *        rpsServer = {BASEURL}/rps    e.g. https://host:8443/rps
 *      CLOUD=false + any BASEURL → Console URL used directly as mpsServer.
 *        Preserves the scheme from BASEURL (http/https) — critical for TLS hosts.
 *   3. Angular environment source files (src/environments/)
 *   4. Fallback localhost defaults (http://localhost:8181 or 3000/8081)
 */
function readAngularBackendUrls(isCloud, env) {
  const defaults = isCloud
    ? { mpsServer: 'http://localhost:3000', rpsServer: 'http://localhost:8081' }
    : { mpsServer: 'http://localhost:8181', rpsServer: 'http://localhost:8181' }

  // Priority 1: explicit env var overrides (empty string = not set)
  let mpsServer = (env && env.MPS_SERVER) || null
  let rpsServer = (env && env.RPS_SERVER) || null

  // Priority 2: derive from BASEURL.
  // CYPRESS_BASEURL is already set by all three CI workflows (setup/device-tests/teardown).
  // Trailing slash is stripped before appending the Kong path prefix.
  if (isCloud && (!mpsServer || !rpsServer)) {
    // Cloud: BASEURL is the Kong gateway — MPS/RPS sit at /mps and /rps sub-paths.
    // Skip when BASEURL is localhost (dev fallback — CI always has a real host here).
    const baseUrl = env && env.BASEURL ? String(env.BASEURL).replace(/\/$/, '') : ''
    if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      if (!mpsServer) mpsServer = `${baseUrl}/mps`
      if (!rpsServer) rpsServer = `${baseUrl}/rps`
    }
  } else if (!isCloud && !mpsServer) {
    // Console: BASEURL IS the Console backend URL — use it directly.
    // This propagates the correct scheme (https) from BASEURL to mpsServer,
    // avoiding the http://localhost:8181 Angular-file default that breaks TLS hosts.
    const baseUrl = env && env.BASEURL ? String(env.BASEURL).replace(/\/$/, '') : ''
    if (baseUrl) mpsServer = baseUrl
  }

  // Priority 3: read from Angular environment source files (only for URLs still missing)
  if (!mpsServer || !rpsServer) {
    try {
      const envFile = isCloud
        ? path.join(__dirname, '../../src/environments/environment.ts')
        : path.join(__dirname, '../../src/environments/environment.enterprise.dev.ts')
      const content = fs.readFileSync(envFile, 'utf8')
      const extract = (key) => {
        const m = content.match(new RegExp(key + '\\s*:\\s*[\'"`]([^\'"`]+)[\'"`]'))
        const val = m ? m[1] : null
        return val && !val.includes('##') ? val : null
      }
      if (!mpsServer) mpsServer = extract('mpsServer') || defaults.mpsServer
      if (!rpsServer) rpsServer = extract('rpsServer') || defaults.rpsServer
    } catch {
      if (!mpsServer) mpsServer = defaults.mpsServer
      if (!rpsServer) rpsServer = defaults.rpsServer
    }
  }

  return { mpsServer, rpsServer }
}

// ─── Misc Helpers ────────────────────────────────────────────────────────────

/**
 * Authenticates against the DMT API and returns a JWT token, or null on failure.
 * @param {string} authorizeUrl  Full URL of the authorize endpoint.
 *   Console (direct): ${mpsServer}/api/v1/authorize
 *   Cloud (Kong):     ${mpsServer}/login/api/v1/authorize
 */
async function loginForToken(authorizeUrl, username, password) {
  try {
    const r = await postJSON(authorizeUrl, { username, password })
    return r.ok && r.data && r.data.token ? String(r.data.token) : null
  } catch {
    return null
  }
}

/**
 * Converts a numeric or string ProvisioningMode value to a human-readable label.
 *   1 → 'ACM (Admin Control Mode)'
 *   4 → 'CCM (Client Control Mode)'
 *   0 → 'pre-provisioning'
 *   other → null
 */
function parseProvisioningMode(mode) {
  const m = Number(mode)
  if (m === 1) return 'ACM (Admin Control Mode)'
  if (m === 4) return 'CCM (Client Control Mode)'
  if (m === 0) return 'pre-provisioning'
  return null
}

/**
 * Queries Console or MPS devices API for AMT firmware version and provisioning mode.
 * Matches DEVICE (IP/hostname) env var first; falls back to the first device found.
 * Returns { firmware, note, provisioningMode, provisioningModeNote }.
 *   Cloud (MPS):  firmware + provisioningMode from deviceInfo inline
 *   Console:      firmware + provisioningMode from /api/v1/amt/version/{guid}
 */
async function fetchAmtFirmwareFromAPI(env, isCloud, apiUrl) {
  // Use deployment-specific credentials:
  //   Cloud (MPS):    MPS_USERNAME / MPS_PASSWORD
  //   Console:        CONSOLE_USERNAME / CONSOLE_PASSWORD (falls back to MPS_USERNAME/PASSWORD)
  const username = isCloud ? env.MPS_USERNAME || '' : env.CONSOLE_USERNAME || env.MPS_USERNAME || ''
  const password = isCloud ? env.MPS_PASSWORD || '' : env.CONSOLE_PASSWORD || env.MPS_PASSWORD || ''
  const credsHint = isCloud ? 'MPS_USERNAME + MPS_PASSWORD' : 'CONSOLE_USERNAME + CONSOLE_PASSWORD'
  if (!username || !password) {
    const noCredsNote = `set ${credsHint} env vars for API lookup`
    return { firmware: null, note: noCredsNote, provisioningMode: null, provisioningModeNote: noCredsNote }
  }

  const baseUrl = apiUrl

  // Cloud deployment uses Kong: authorize endpoint is at /login/api/v1/authorize
  // Console (direct access): authorize endpoint is at /api/v1/authorize
  const authorizeUrl = isCloud ? `${baseUrl}/login/api/v1/authorize` : `${baseUrl}/api/v1/authorize`

  const token = await loginForToken(authorizeUrl, username, password)

  // Cloud: token is mandatory — fail fast if auth didn't succeed.
  // Console: when cfg.Disabled=true all /api/* routes bypass JWT, so we fall through
  // and try the devices endpoint without Authorization. If auth succeeded, use the token.
  if (!token && isCloud) {
    return {
      firmware: null,
      note: 'could not authenticate to MPS API',
      provisioningMode: null,
      provisioningModeNote: 'could not authenticate to MPS API'
    }
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  // Both Console and MPS use GET /api/v1/devices
  const devicesUrl = `${baseUrl}/api/v1/devices?$top=100&$skip=0&$count=true`

  const r = await fetchJSON(devicesUrl, 8000, authHeaders)
  if (!r.ok || !r.data) {
    const noDevNote = `could not fetch devices from ${isCloud ? 'MPS' : 'Console'} API`
    return { firmware: null, note: noDevNote, provisioningMode: null, provisioningModeNote: noDevNote }
  }

  // Response shape: { data: Device[], totalCount }
  const devices = Array.isArray(r.data) ? r.data : Array.isArray(r.data.data) ? r.data.data : []

  if (devices.length === 0)
    return {
      firmware: null,
      note: 'no devices found in API',
      provisioningMode: null,
      provisioningModeNote: 'no devices found in API'
    }

  const targetIp = env.DEVICE || null
  let device = null
  let matchNote = ''

  if (isCloud) {
    // MPS: devices have deviceInfo.ipAddress + deviceInfo.fwVersion inline.
    // Firmware is read from deviceInfo; ProvisioningMode requires a separate
    // /api/v1/amt/version/{guid} call — same endpoint the Web UI uses via
    // AMT_SetupAndConfigurationService.response.ProvisioningMode (1=ACM, 4=CCM).
    // deviceInfo.currentMode is a *different* field (host-based setup mode 0/1/2)
    // and must NOT be used for provisioning mode.
    if (targetIp) {
      device = devices.find((d) => d.deviceInfo && d.deviceInfo.ipAddress === targetIp)
      if (device) matchNote = `device IP ${targetIp}`
    }
    if (!device) {
      device = devices.find((d) => d.deviceInfo && d.deviceInfo.fwVersion)
      if (device) matchNote = device.hostname || device.guid || 'first device'
    }
    if (!device) {
      device = devices[0]
      matchNote = device.hostname || device.guid || 'first device'
    }

    const firmware =
      device && device.deviceInfo && device.deviceInfo.fwVersion ? String(device.deviceInfo.fwVersion) : null
    const firmwareNote = firmware ? `from MPS API (${matchNote})` : 'no device with fwVersion found in MPS API'

    // Fetch ProvisioningMode from AMT_SetupAndConfigurationService (same as Web UI)
    let pm = null
    let pmNote = 'no device GUID for provisioning mode lookup'
    if (device && device.guid) {
      const amtVerUrl = `${baseUrl}/api/v1/amt/version/${device.guid}`
      const vr = await fetchJSON(amtVerUrl, 8000, authHeaders)
      if (vr.ok && vr.data) {
        const pmRaw = vr.data.AMT_SetupAndConfigurationService?.response?.ProvisioningMode
        pm = pmRaw !== undefined ? parseProvisioningMode(pmRaw) : null
        pmNote = pm
          ? `from MPS API (${matchNote})`
          : pmRaw !== undefined
            ? `unrecognized ProvisioningMode value: ${pmRaw}`
            : 'ProvisioningMode not in response'
      } else {
        pmNote = `could not fetch AMT version for ${device.guid}`
      }
    }

    return { firmware, note: firmwareNote, provisioningMode: pm, provisioningModeNote: pmNote }
  } else {
    // Console: devices have hostname + guid; firmware requires a separate call
    if (targetIp) {
      device = devices.find((d) => d.hostname === targetIp)
      if (device) matchNote = `hostname ${targetIp}`
    }
    if (!device) {
      device = devices[0]
      matchNote = device.friendlyName || device.hostname || device.guid || 'first device'
    }
    if (!device || !device.guid)
      return {
        firmware: null,
        note: 'no device GUID available from Console API',
        provisioningMode: null,
        provisioningModeNote: 'no device GUID available'
      }

    const amtVerUrl = `${baseUrl}/api/v1/amt/version/${device.guid}`
    const vr = await fetchJSON(amtVerUrl, 8000, { Authorization: `Bearer ${token}` })
    if (!vr.ok || !vr.data)
      return {
        firmware: null,
        note: `could not fetch AMT version for ${device.guid}`,
        provisioningMode: null,
        provisioningModeNote: `could not fetch AMT version for ${device.guid}`
      }

    // Provisioning mode from AMT_SetupAndConfigurationService (same response as firmware)
    const pmRaw = vr.data.AMT_SetupAndConfigurationService?.response?.ProvisioningMode
    const pm = pmRaw !== undefined ? parseProvisioningMode(pmRaw) : null
    const pmNote = pm
      ? `from Console API (${matchNote})`
      : pmRaw !== undefined
        ? `unrecognized mode value: ${pmRaw}`
        : 'ProvisioningMode not in response'

    const responses = vr.data.CIM_SoftwareIdentity && vr.data.CIM_SoftwareIdentity.responses
    const amtEntry = Array.isArray(responses) && responses.find((e) => e.InstanceID === 'AMT')
    if (amtEntry && amtEntry.VersionString) {
      return {
        firmware: String(amtEntry.VersionString),
        note: `from Console API (${matchNote})`,
        provisioningMode: pm,
        provisioningModeNote: pmNote
      }
    }
    return {
      firmware: null,
      note: 'AMT version entry not found in Console API response',
      provisioningMode: pm,
      provisioningModeNote: pmNote
    }
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Fetches all relevant DMT component versions for the current test run.
 *
 * @param {Object} config  Cypress config object (from setupNodeEvents)
 * @returns {Promise<Object>} testEnvironment info object
 */
async function fetchVersionInfo(config) {
  const env = config.env || {}
  const isCloud = !!env.CLOUD
  const { mpsServer, rpsServer } = readAngularBackendUrls(isCloud, env)

  // Cloud deployments (e.g. behind Kong) require JWT on version endpoints.
  // Pre-login once and reuse the token for all API fetchers.
  const authorizeUrl = isCloud ? `${mpsServer}/login/api/v1/authorize` : `${mpsServer}/api/v1/authorize`
  const apiToken =
    isCloud && env.MPS_USERNAME && env.MPS_PASSWORD
      ? await loginForToken(authorizeUrl, env.MPS_USERNAME, env.MPS_PASSWORD)
      : null
  const authHeaders = apiToken ? { Authorization: `Bearer ${apiToken}` } : {}

  const result = {
    deploymentType: isCloud ? 'Cloud Deployment (MPS + RPS)' : 'Console Enterprise',
    isCloud,
    fetchedAt: new Date().toISOString(),
    components: []
  }

  /**
   * Appends a component entry.
   * If version === HIDE_MARKER the entry is skipped entirely (hidden from report).
   */
  // Read COMPONENT_COMMITS JSON — maps component name → short commit hash.
  // Schema: { "mps": "abc1234", "rpc-go": "def5678", ... }
  // Set CYPRESS_COMPONENT_COMMITS in cypress.env.json or as a CI env var.
  let commitMap = {}
  try {
    const ccRaw = env.COMPONENT_COMMITS
    if (ccRaw) commitMap = JSON.parse(String(ccRaw))
  } catch {
    /* ignore invalid JSON */
  }

  const add = (name, version, note = '') => {
    if (version === HIDE_MARKER) return // user opted to hide this component
    const entry = { name, version: version || 'N/A', note }
    if (commitMap[name]) entry.commit = String(commitMap[name]).slice(0, 8)
    result.components.push(entry)
  }

  // ── Component versions: fully dynamic, order follows cypress.env.json ───────
  //
  // Every *_VERSION key in cypress.env.json is reported in the order it appears.
  // Add, remove, or reorder keys in cypress.env.json — the report mirrors it.
  //
  // Deployment-scoped keys are automatically skipped for the wrong deployment type:
  //   Console-only: CONSOLE_VERSION, GO_WSMAN_MESSAGES_VERSION
  //   Cloud-only:   MPS_VERSION, RPS_VERSION, MPS_ROUTER_VERSION, WSMAN_MESSAGES_VERSION
  //
  // Three keys support live API fetching when the value is empty, undefined, or AUTO:
  //   CONSOLE_VERSION  → GET ${mpsServer}/version
  //   MPS_VERSION      → GET ${mpsServer}/api/v1/version
  //   RPS_VERSION      → GET ${rpsServer}/api/v1/admin/version
  // All other *_VERSION keys are env-var-only (set SKIP to hide).
  // In CI, prefer "AUTO" over "" — Cypress strips empty CYPRESS_* env vars.

  // Build the ordered key list from the original JSON input when available (CI),
  // otherwise fall back to Object.keys(env) (local cypress.env.json).
  //
  // Priority for the source JSON (all preserve user-specified insertion order):
  //   1. env.COMPONENT_VERSIONS — full JSON string set by set-component-versions
  //      action (CYPRESS_COMPONENT_VERSIONS) or restored by cypress.config.ts.
  //   2. component_versions.json on disk — written by the "Write component versions
  //      to file" step in each CI workflow. Guards against Cypress env-var
  //      alphabetisation in individual spec runs when COMPONENT_VERSIONS is absent.
  //   3. Object.keys(env) — insertion order: matches cypress.env.json locally;
  //      may be alphabetical in CI if neither source above is available.
  let cvJson = env.COMPONENT_VERSIONS
  if (!cvJson) {
    // Try reading component_versions.json from the working directory (same
    // location cypress.config.ts uses — project root of sample-web-ui).
    try {
      const cvFilePath = path.join(process.cwd(), 'component_versions.json')
      if (fs.existsSync(cvFilePath)) {
        cvJson = fs.readFileSync(cvFilePath, 'utf8')
      }
    } catch {
      /* ignore — fall through to Object.keys */
    }
  }
  let orderedVersionKeys
  if (cvJson) {
    try {
      const cvParsed = JSON.parse(String(cvJson))
      // Start with keys from the original JSON (preserves user-specified order).
      orderedVersionKeys = Object.keys(cvParsed).filter((k) => k.endsWith('_VERSION'))
      // Append any *_VERSION keys present in env but absent from the JSON (local extras).
      for (const k of Object.keys(env)) {
        if (k.endsWith('_VERSION') && !orderedVersionKeys.includes(k)) {
          orderedVersionKeys.push(k)
        }
      }
    } catch {
      orderedVersionKeys = Object.keys(env).filter((k) => k.endsWith('_VERSION'))
    }
  } else {
    orderedVersionKeys = Object.keys(env).filter((k) => k.endsWith('_VERSION'))
  }

  const consoleOnlyKeys = new Set(['CONSOLE_VERSION', 'GO_WSMAN_MESSAGES_VERSION'])
  const cloudOnlyKeys = new Set([
    'MPS_VERSION',
    'RPS_VERSION',
    'MPS_ROUTER_VERSION',
    'WSMAN_MESSAGES_VERSION'
  ])

  const apiFetchers = {
    async CONSOLE_VERSION() {
      const url = `${mpsServer}/version`
      const r = await fetchJSON(url)
      // Console returns HTTP 500 when GitHub latest-release fetch fails (rate limit / network),
      // but the body always includes { current: "..." } — use it regardless of status code.
      const ver = r.data && r.data.current ? String(r.data.current) : null
      return {
        ver,
        note: ver ? '' : `unreachable: ${url} (${r.reason || (r.statusCode ? `HTTP ${r.statusCode}` : 'no response')})`
      }
    },
    async MPS_VERSION() {
      const url = `${mpsServer}/api/v1/version`
      const r = await fetchJSON(url, 5000, authHeaders)
      return {
        ver: r.ok && r.data?.serviceVersion ? r.data.serviceVersion : null,
        note: r.ok ? '' : `unreachable: ${url} (${r.reason || 'no response'})`
      }
    },
    async RPS_VERSION() {
      const url = `${rpsServer}/api/v1/admin/version`
      const r = await fetchJSON(url, 5000, authHeaders)
      return {
        ver: r.ok && r.data?.serviceVersion ? r.data.serviceVersion : null,
        note: r.ok
          ? r.data?.protocolVersion
            ? `protocol: ${r.data.protocolVersion}`
            : ''
          : `unreachable: ${url} (${r.reason || 'no response'})`
      }
    }
  }

  for (const key of orderedVersionKeys) {
    if (consoleOnlyKeys.has(key) && isCloud) continue // console component — skip for cloud
    if (cloudOnlyKeys.has(key) && !isCloud) continue // cloud component   — skip for console
    const val = env[key]
    if (val === HIDE_MARKER) continue
    const name = key
      .replace(/_VERSION$/, '')
      .toLowerCase()
      .replace(/_/g, '-')
    const shouldFetch = !val || val === AUTO
    if (!shouldFetch) {
      add(name, val, `from ${key} env var`)
    } else if (apiFetchers[key]) {
      const { ver, note } = await apiFetchers[key]()
      add(name, ver, note)
    } else {
      add(name, null, `set ${key} env var`)
    }
  }

  // ── AMT firmware + provisioning mode: queried from Console / MPS devices API (non-isolated runs only) ───
  const isIsolated =
    String(env.ISOLATE || 'Y')
      .charAt(0)
      .toLowerCase() !== 'n'
  let amtFirmware = null
  let amtFirmwareNote = 'isolated run — set ISOLATE=N with a real AMT device to query firmware'
  let provisioningMode = null
  let provisioningModeNote = 'isolated run — set ISOLATE=N with a real AMT device to query provisioning mode'
  if (!isIsolated) {
    const res = await fetchAmtFirmwareFromAPI(env, isCloud, mpsServer)
    amtFirmware = res.firmware
    amtFirmwareNote = res.note
    provisioningMode = res.provisioningMode || null
    provisioningModeNote = res.provisioningModeNote || ''
  }

  result.infrastructure = {
    amtFirmware: amtFirmware || null,
    amtFirmwareNote,
    provisioningMode: provisioningMode || null,
    provisioningModeNote
  }

  return result
}

module.exports = { fetchVersionInfo, HIDE_MARKER, AUTO }
