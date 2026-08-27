/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ---- Shared helpers --------------------------------------------------------

export interface AMTInfo {
  amt: string
  buildNumber: string
  controlMode?: string
  heciAvailable?: boolean
  dnsSuffix: string
  dnsSuffixOS: string
  hostnameOS: string
  ras: {
    networkStatus: string
    remoteStatus: string
    remoteTrigger: string
    mpsHostname: string
  }
  sku: string
  uuid: string
  wiredAdapter: {
    isEnable: boolean
    linkStatus: string
    dhcpEnabled: boolean
    dhcpMode: string
    ipAddress: string
    macAddress: string
  }
  wirelessAdapter: {
    isEnable: boolean
    linkStatus: string
    dhcpEnabled: boolean
    dhcpMode: string
    ipAddress: string
    macAddress: string
  }
}

export const execConfig: Cypress.ExecOptions = {
  log: true,
  failOnNonZeroExit: false,
  timeout: 240000
} as any

export const buildOutput = (result: { stdout?: string; stderr?: string }) => {
  const stdout = result.stdout ? result.stdout.trim() : ''
  const stderr = result.stderr ? result.stderr.trim() : ''
  const combined = [stdout, stderr].filter((value) => value.length > 0).join('\n')
  return { stdout, stderr, combined }
}

export const execWithRetry = (
  command: string,
  config: Cypress.ExecOptions,
  maxRetries = 5,
  retryInterval = 5000
): Cypress.Chainable<Cypress.Exec> => {
  const attemptExec = (attempt: number): Cypress.Chainable<Cypress.Exec> => {
    return cy.exec(command, config).then((result) => {
      const { combined } = buildOutput(result)

      if (combined.includes('interrupted system call') && attempt < maxRetries) {
        cy.log(`Retry attempt ${attempt + 1}/${maxRetries} after interrupted system call error`)
        cy.wait(retryInterval)
        return attemptExec(attempt + 1)
      }

      return cy.wrap(result)
    })
  }

  return attemptExec(1)
}

// AMT can be briefly unreachable right after a state change (e.g. deactivation
// restarts the ME), so amtinfo may return these transient errors.
const transientAmtErrorPattern = /empty response from AMT|AMT Unavailable|no such device/i

// Runs `rpc amtinfo` and selects the AMT payload from JSON output with log records.
export const getAmtInfo = (
  infoCommand: string,
  config: Cypress.ExecOptions = execConfig,
  maxRetries = 5,
  retryInterval = 5000
): Cypress.Chainable<AMTInfo> => {
  const attemptGetInfo = (attempt: number): Cypress.Chainable<AMTInfo> => {
    return cy.exec(infoCommand, config).then((result) => {
      const { stdout, stderr, combined } = buildOutput(result)
      return cy.log(combined).then(() => {
        const source = stdout.length > 0 ? stdout : stderr
        const jsonStart = source.indexOf('{')

        // rpc may emit JSON-formatted logs before the final amtinfo payload.
        const candidates: number[] = jsonStart < 0 ? [] : [jsonStart]
        let nextObjectStart = source.indexOf('\n{', jsonStart)
        while (jsonStart >= 0 && nextObjectStart >= 0) {
          candidates.push(nextObjectStart + 1)
          nextObjectStart = source.indexOf('\n{', nextObjectStart + 1)
        }

        // Prefer the final JSON object because it is the most recent response.
        for (const candidateStart of candidates.reverse()) {
          try {
            const parsed = JSON.parse(source.substring(candidateStart)) as Record<string, unknown>
            if ('amt' in parsed || 'AMT' in parsed || 'version' in parsed) {
              return parsed as unknown as AMTInfo
            }
          } catch {
            // Try the next JSON object when leading log records are present.
          }
        }

        // Retry when AMT is momentarily unavailable after a state change.
        if (transientAmtErrorPattern.test(combined) && attempt < maxRetries) {
          cy.log(`Retrying rpc amtinfo after transient AMT-unavailable error (${attempt}/${maxRetries})`)
          return cy.wait(retryInterval).then(() => attemptGetInfo(attempt + 1))
        }

        if (jsonStart < 0) {
          throw new Error(`rpc amtinfo did not return JSON. Output:\n${combined}`)
        }

        throw new Error(`rpc amtinfo did not contain an AMT version payload. Output:\n${combined}`)
      })
    })
  }

  return attemptGetInfo(1)
}

export const getAmtInfoWithRetry = (
  infoCommand: string,
  config: Cypress.ExecOptions = execConfig,
  maxRetries = 3,
  retryInterval = 5000
): Cypress.Chainable<AMTInfo> => {
  const attemptGetInfo = (attempt: number): Cypress.Chainable<AMTInfo> => {
    return getAmtInfo(infoCommand, config).then((info) => {
      if (info.controlMode || attempt >= maxRetries) {
        return cy.wrap(info)
      }

      // AMT can answer before its control mode is populated after a state change.
      cy.log(`Retrying rpc amtinfo after response without controlMode (${attempt}/${maxRetries})`)
      return cy.wait(retryInterval).then(() => attemptGetInfo(attempt + 1))
    })
  }

  return attemptGetInfo(1)
}

// Extracts the major AMT version (e.g. "16.1.5" -> "16") from an AMTInfo object.
export const getAmtVersion = (amtInfo: AMTInfo): string => {
  const info = amtInfo as unknown as Record<string, unknown>
  const rawVersion = info?.amt ?? info?.AMT ?? info?.version

  if (typeof rawVersion !== 'string' || rawVersion.trim().length === 0) {
    return '0'
  }

  const versions: string[] = rawVersion.split('.')
  return versions.length > 0 && versions[0].length > 0 ? versions[0] : '0'
}

// rpc-go has reported the not-yet-activated control mode under different
// strings across versions/builds; treat either as "not activated".
export const notActivatedControlModes: string[] = ['pre-provisioning state', 'not activated']

// Builds the skip-cert flag part based on auto-add mode and AMT version
// Auto-add mode: use --skip-cert-check for all AMT versions
// Normal mode: use --skip-amt-cert-check only for AMT > 18
const buildSkipCertPart = (isAutoAdd: boolean, amtVersion: string): string => {
  if (isAutoAdd) {
    // For auto-add: always use --skip-cert-check, plus --skip-amt-cert-check for AMT > 18
    const amtCertFlag = parseInt(amtVersion) > 18 ? ' --skip-amt-cert-check' : ''
    return ` --skip-cert-check${amtCertFlag}`
  } else {
    return parseInt(amtVersion) > 18 ? ' --skip-amt-cert-check' : ''
  }
}

// ---- Computed environment flags -------------------------------------------

// Exported so sub-specs (and the builders below) can use it to pick the
// cloud vs. console command variant.
export const isCloud: boolean = Cypress.env('CLOUD') === 'true' || Cypress.env('CLOUD') === true

/**
 * Constructs the authorization endpoint URL for auto-add device mode from BASEURL.
 * Returns empty string if BASEURL is not available.
 *
 * @returns Authorization endpoint URL or empty string
 */
export const getAuthEndpoint = (): string => {
  const baseUrl = Cypress.env('BASEURL')
  if (baseUrl) {
    // BASEURL format: https://host:port/
    // Auth endpoint format: https://host:port/api/v1/authorize
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${normalizedBase}/api/v1/authorize`
  }

  return ''
}

// ---- Shared rpc-go command builders ---------------------------------------
//
// rpc-go v3 (Kong CLI) requires --long/-short flag syntax; bare single-dash
// long flags (e.g. -json, -configv2) are no longer accepted. Commands are run
// either via Docker (Linux/Mac) or directly via rpc.exe (Windows). Each builder
// uses `isCloud` to decide between the cloud (RPS/wss) and console (local
// profile) variant of the command.

export interface RpcCommandOptions {
  isWin: boolean
  rpcDockerImage: string
  volumeMount?: string
}

const buildRpcCommand = (opts: RpcCommandOptions, winExe: string, args: string): string => {
  const rpcBinary = Cypress.env('RPC_BINARY') as string | undefined

  if (opts.isWin) {
    return `${winExe} ${args}`
  }

  // Use a local rpc binary when explicitly provided for non-Windows runs.
  if (rpcBinary && rpcBinary.trim().length > 0) {
    return `${rpcBinary.trim()} ${args}`
  }

  const volumeFlag = opts.volumeMount ? ` -v ${opts.volumeMount}` : ''
  return `docker run --rm --network host --device=/dev/mei0${volumeFlag} ${opts.rpcDockerImage} ${args}`
}

export const buildInfoCommand = (opts: RpcCommandOptions): string => {
  const rpcVersion = getRpcMajorVersion()
  const args = rpcVersion === '2' ? 'amtinfo -json' : 'amtinfo --json'
  return buildRpcCommand(opts, 'rpc.exe', args)
}

export interface ActivateCommandOptions {
  isWin: boolean
  rpcDockerImage: string
  amtVersion: string
  // console-only
  profileYamlFile?: string
  encryptionKey?: string
  authEndpoint?: string
  authUsername?: string
  authPassword?: string
  // cloud-only
  fqdn?: string
  profileName?: string
}

export interface RpcExecResult {
  code: number
  stdout?: string
  stderr?: string
}

export interface ExecFallbackContext {
  command: string
  index: number
  commands: string[]
  result: RpcExecResult
  combinedOutput: string
}

export type ExecFallbackRetryPredicate = (context: ExecFallbackContext) => boolean

const getRpcMajorVersion = (): string => {
  const rpcVersion = String(Cypress.env('RPC_VERSION') ?? 'v3')
    .trim()
    .toLowerCase()
  return /^v?2(?:\.|$)/.test(rpcVersion) ? '2' : '3'
}

const uniqueCommands = (commands: string[]): string[] => {
  const seen: Record<string, boolean> = {}
  return commands.filter((command) => {
    if (seen[command]) {
      return false
    }
    seen[command] = true
    return true
  })
}

const buildCloudActivateCommandArgsCandidates = (opts: ActivateCommandOptions): string[] => {
  const rpcVersion = getRpcMajorVersion()
  // rpc v2 and v3 use different long-flag syntax for the profile argument.
  const profileFlag = rpcVersion === '2' ? `-profile=${opts.profileName}` : `--profile=${opts.profileName}`
  const modeArg = ' -n'
  const tlsTunnelFlag = rpcVersion === '2' ? ' -tls-tunnel' : ' --tls-tunnel'
  // AMT 18 and older accept both tunnel variants; newer AMT requires no tunnel flag.
  const tlsCandidates = parseInt(opts.amtVersion) <= 18 ? [tlsTunnelFlag, ''] : ['']

  const commands: string[] = []
  tlsCandidates.forEach((tlsArg) => {
    commands.push(`activate -u wss://${opts.fqdn}/activate ${profileFlag}${modeArg}${tlsArg}`)
  })

  return uniqueCommands(commands)
}

export const buildCloudActivateCommandCandidates = (opts: ActivateCommandOptions): string[] => {
  const argsCandidates = buildCloudActivateCommandArgsCandidates(opts)
  return argsCandidates.map((args) =>
    buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  )
}

export const buildActivateCommand = (opts: ActivateCommandOptions): string => {
  if (isCloud) {
    return buildCloudActivateCommandCandidates(opts)[0]
  }

  const profileDir = opts.profileYamlFile
    ? opts.profileYamlFile.substring(0, opts.profileYamlFile.lastIndexOf('/'))
    : ''
  const profileFileName = opts.profileYamlFile
    ? opts.profileYamlFile.substring(opts.profileYamlFile.lastIndexOf('/') + 1)
    : ''
  const profilePath = opts.isWin ? opts.profileYamlFile : `/config/${profileFileName}`

  const rpcVersion = getRpcMajorVersion()
  const commonFlag = rpcVersion === '2' ? '-v -json' : '-v --json'
  const amtVersionNum = parseInt(opts.amtVersion)

  if (rpcVersion === '2') {
    cy.task('log', `>>> RPC VERSION : v2`)
    cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
    cy.task('log', `>>> Auto-Add Device : false (v2 does not support auto-add)`)

    const skipFlag = amtVersionNum > 18 ? ' -skipamtcertcheck' : ''
    const args = `activate -local -configv2 ${profilePath} -configencryptionkey "${opts.encryptionKey}"${skipFlag} ${commonFlag}`
    return buildRpcCommand(
      { isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage, volumeMount: `${profileDir}:/config` },
      'rpc.exe',
      args
    )
  }

  // RPC v3: check if auto-add mode via explicit environment variable
  const isAutoAdd = Cypress.env('AUTO_ADD_DEVICE') === true || Cypress.env('AUTO_ADD_DEVICE') === 'true'

  cy.task('log', `>>> RPC VERSION : v3`)
  cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
  cy.task('log', `>>> Auto-Add Device : ${isAutoAdd}`)

  if (isAutoAdd && (!opts.authEndpoint || !opts.authUsername || !opts.authPassword)) {
    throw new Error('AUTO_ADD_DEVICE requires authEndpoint/authUsername/authPassword')
  }

  const authPart = isAutoAdd
    ? ` --auth-endpoint "${opts.authEndpoint}" --auth-username "${opts.authUsername}" --auth-password "${opts.authPassword}"`
    : ''
  const skipCertPart = buildSkipCertPart(isAutoAdd, opts.amtVersion)

  const args = `activate --local --profile ${profilePath} --key ${opts.encryptionKey}${authPart}${skipCertPart} ${commonFlag}`
  return buildRpcCommand(
    { isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage, volumeMount: `${profileDir}:/config` },
    'rpc.exe',
    args
  )
}

export const addArgsToCommandCandidates = (commands: string[], argsToAppend: string): string[] =>
  commands.map((command) => `${command} ${argsToAppend}`)

const isRpcCliCompatibilityError = (combinedOutput: string): boolean => {
  return /unknown flag|unknown shorthand flag|flag provided but not defined|invalid argument|unrecognized option/i.test(
    combinedOutput
  )
}

export const execWithCompatibilityFallback = (
  commands: string[],
  config: Cypress.ExecOptions,
  shouldRetry?: ExecFallbackRetryPredicate
): Cypress.Chainable<RpcExecResult> => {
  const attemptExec = (index: number): Cypress.Chainable<RpcExecResult> => {
    const command = commands[index]
    return execWithRetry(command, config).then((result) => {
      const execResult = result as unknown as RpcExecResult
      const { combined } = buildOutput(execResult)
      const fallbackContext: ExecFallbackContext = {
        command,
        index,
        commands,
        result: execResult,
        combinedOutput: combined
      }

      const shouldRetryCurrent =
        isRpcCliCompatibilityError(combined) || (shouldRetry != null && shouldRetry(fallbackContext))

      // Do not hide operation failures: retry only known CLI incompatibilities or caller-approved cases.
      if (execResult.code === 0 || index >= commands.length - 1 || !shouldRetryCurrent) {
        return cy.wrap(execResult)
      }

      cy.log(`Retrying with compatibility command variant ${index + 2}/${commands.length}`)
      return attemptExec(index + 1)
    })
  }

  return attemptExec(0)
}

export interface DeactivateCommandOptions {
  isWin: boolean
  rpcDockerImage: string
  password: string
  amtVersion: string
  // console-only
  isAdminControlModeProfile?: boolean
  authEndpoint?: string
  authUsername?: string
  authPassword?: string
  // cloud-only
  fqdn?: string
}

const buildCloudDeactivateCommandArgsCandidates = (opts: DeactivateCommandOptions): string[] => {
  const rpcVersion = getRpcMajorVersion()
  // rpc v2 keeps the legacy single-dash JSON flag for deactivate; the TLS tunnel flag is not required here.
  const jsonFlag = rpcVersion === '2' ? '-json' : '--json'
  const passwordFlag = rpcVersion === '2' ? '-password' : '--password'

  return [`deactivate -u wss://${opts.fqdn}/activate -n ${passwordFlag} ${opts.password} -v -f ${jsonFlag}`]
}

export const buildCloudDeactivateCommandCandidates = (opts: DeactivateCommandOptions): string[] => {
  return buildCloudDeactivateCommandArgsCandidates(opts).map((args) =>
    buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  )
}

export const buildDeactivateCommand = (opts: DeactivateCommandOptions): string => {
  const rpcVersion = getRpcMajorVersion()
  const commonFlag = rpcVersion === '2' ? '-v -f -json' : '-v -f --json'
  if (isCloud) {
    return buildCloudDeactivateCommandCandidates(opts)[0]
  }

  const amtVersionNum = parseInt(opts.amtVersion)

  if (rpcVersion === '2') {
    cy.task('log', `>>> RPC VERSION : v2`)
    cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
    cy.task('log', `>>> Auto-Add Device : false (v2 does not support auto-add)`)

    const skipFlag = amtVersionNum > 18 ? ' -skipamtcertcheck' : ''
    const passPart = opts.isAdminControlModeProfile ? ` -password ${opts.password}` : ''
    const args = `deactivate -local${skipFlag}${passPart} ${commonFlag}`
    return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  }

  // RPC v3: check if auto-add mode via explicit environment variable
  const isAutoAdd = Cypress.env('AUTO_ADD_DEVICE') === true || Cypress.env('AUTO_ADD_DEVICE') === 'true'

  cy.task('log', `>>> RPC VERSION : v3`)
  cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
  cy.task('log', `>>> Auto-Add Device : ${isAutoAdd}`)

  if (isAutoAdd && (!opts.authEndpoint || !opts.authUsername || !opts.authPassword)) {
    throw new Error('AUTO_ADD_DEVICE requires authEndpoint/authUsername/authPassword')
  }

  const authPart = isAutoAdd
    ? ` --auth-endpoint "${opts.authEndpoint}" --auth-username "${opts.authUsername}" --auth-password "${opts.authPassword}"`
    : ''
  const skipCertPart = buildSkipCertPart(isAutoAdd, opts.amtVersion)

  const passPart = opts.isAdminControlModeProfile ? ` --password ${opts.password}` : ''
  const args = `deactivate --local${authPart}${skipCertPart}${passPart} ${commonFlag}`
  return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
}
