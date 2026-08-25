/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ---- Shared helpers --------------------------------------------------------

export interface AMTInfo {
  amt: string
  buildNumber: string
  controlMode: string
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

// Runs `rpc amtinfo` and parses the JSON result. Tolerates leading log noise
// (e.g. logrus-formatted warnings) by locating the first '{' in the output.
export const getAmtInfo = (
  infoCommand: string,
  config: Cypress.ExecOptions = execConfig
): Cypress.Chainable<AMTInfo> => {
  return cy.exec(infoCommand, config).then((result) => {
    const { stdout, stderr, combined } = buildOutput(result)
    return cy.log(combined).then(() => {
      const source = stdout.length > 0 ? stdout : stderr
      const jsonStart = source.indexOf('{')
      if (jsonStart < 0) {
        throw new Error(`rpc amtinfo did not return JSON. Output:\n${combined}`)
      }
      const jsonOutput = source.substring(jsonStart)
      return JSON.parse(jsonOutput) as AMTInfo
    })
  })
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

      cy.log(`Retrying rpc amtinfo after response without controlMode (${attempt}/${maxRetries})`)
      return cy.wait(retryInterval).then(() => attemptGetInfo(attempt + 1))
    })
  }

  return attemptGetInfo(1)
}

// Extracts the major AMT version (e.g. "16.1.5" -> "16") from an AMTInfo object.
export const getAmtVersion = (amtInfo: AMTInfo): string => {
  const versions: string[] = amtInfo.amt.split('.')
  return versions.length > 1 ? versions[0] : '0'
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
  if (opts.isWin) {
    return `${winExe} ${args}`
  }
  const volumeFlag = opts.volumeMount ? ` -v ${opts.volumeMount}` : ''
  return `docker run --rm --network host --device=/dev/mei0${volumeFlag} ${opts.rpcDockerImage} ${args}`
}

export const buildInfoCommand = (opts: RpcCommandOptions): string => {
  const rpcVersion = Cypress.env('RPC_VERSION')
  const args = rpcVersion === 'v2' ? 'amtinfo -json' : 'amtinfo --json'
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

export const buildActivateCommand = (opts: ActivateCommandOptions): string => {
  const commonFlag = '-v --json'
  if (isCloud) {
    const flagPart = parseInt(opts.amtVersion) <= 18 ? ' --tls-tunnel' : ''
    const args = `activate -u wss://${opts.fqdn}/activate --profile ${opts.profileName} -n${flagPart} ${commonFlag}`
    return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  }

  const profileDir = opts.profileYamlFile
    ? opts.profileYamlFile.substring(0, opts.profileYamlFile.lastIndexOf('/'))
    : ''
  const profileFileName = opts.profileYamlFile
    ? opts.profileYamlFile.substring(opts.profileYamlFile.lastIndexOf('/') + 1)
    : ''
  const profilePath = opts.isWin ? opts.profileYamlFile : `/config/${profileFileName}`

  const rpcVersion = Cypress.env('RPC_VERSION')
  const amtVersionNum = parseInt(opts.amtVersion)

  if (rpcVersion === 'v2') {
    cy.task('log', `>>> RPC VERSION : v2`)
    cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
    cy.task('log', `>>> Auto-Add Device : false (v2 does not support auto-add)`)

    const skipFlag = amtVersionNum > 18 ? ' -skipamtcertcheck' : ''
    const v2Flag = '-v -json'  // v2 uses single-dash syntax
    const args = `activate -local -configv2 ${profilePath} -configencryptionkey "${opts.encryptionKey}"${skipFlag} ${v2Flag}`
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

  const authPart = isAutoAdd
    ? ` --auth-endpoint ${opts.authEndpoint} --auth-username ${opts.authUsername} --auth-password ${opts.authPassword}`
    : ''
  const skipCertPart = buildSkipCertPart(isAutoAdd, opts.amtVersion)

  const args = `activate --local --profile ${profilePath} --key ${opts.encryptionKey}${authPart}${skipCertPart} ${commonFlag}`
  return buildRpcCommand(
    { isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage, volumeMount: `${profileDir}:/config` },
    'rpc.exe',
    args
  )
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

export const buildDeactivateCommand = (opts: DeactivateCommandOptions): string => {
  const commonFlag = '-v -f --json'
  if (isCloud) {
    const args = `deactivate -u wss://${opts.fqdn}/activate -n --password ${opts.password} ${commonFlag}`
    return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  }

  const rpcVersion = Cypress.env('RPC_VERSION')
  const amtVersionNum = parseInt(opts.amtVersion)

  if (rpcVersion === 'v2') {
    cy.task('log', `>>> RPC VERSION : v2`)
    cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
    cy.task('log', `>>> Auto-Add Device : false (v2 does not support auto-add)`)

    const skipFlag = amtVersionNum > 18 ? ' -skipamtcertcheck' : ''
    const passPart = opts.isAdminControlModeProfile ? ` -password ${opts.password}` : ''
    const v2Flag = '-v -f -json'  // v2 uses single-dash syntax
    const args = `deactivate -local${skipFlag}${passPart} ${v2Flag}`
    return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  }

  // RPC v3: check if auto-add mode via explicit environment variable
  const isAutoAdd = Cypress.env('AUTO_ADD_DEVICE') === true || Cypress.env('AUTO_ADD_DEVICE') === 'true'

  cy.task('log', `>>> RPC VERSION : v3`)
  cy.task('log', `>>> AMT VERSION : ${opts.amtVersion}`)
  cy.task('log', `>>> Auto-Add Device : ${isAutoAdd}`)

  const authPart = isAutoAdd
    ? ` --auth-endpoint ${opts.authEndpoint} --auth-username ${opts.authUsername} --auth-password ${opts.authPassword}`
    : ''
  const skipCertPart = buildSkipCertPart(isAutoAdd, opts.amtVersion)

  const passPart = opts.isAdminControlModeProfile ? ` --password ${opts.password}` : ''
  const args = `deactivate --local${authPart}${skipCertPart}${passPart} ${commonFlag}`
  return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
}
