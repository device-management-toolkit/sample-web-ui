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

// Extracts the major AMT version (e.g. "16.1.5" -> "16") from an AMTInfo object.
export const getAmtVersion = (amtInfo: AMTInfo): string => {
  const versions: string[] = amtInfo.amt.split('.')
  return versions.length > 1 ? versions[0] : '0'
}

// rpc-go has reported the not-yet-activated control mode under different
// strings across versions/builds; treat either as "not activated".
export const notActivatedControlModes: string[] = ['pre-provisioning state', 'not activated']

// ---- Computed environment flags -------------------------------------------

// Exported so sub-specs (and the builders below) can use it to pick the
// cloud vs. console command variant.
export const isCloud: boolean = Cypress.env('CLOUD') === 'true' || Cypress.env('CLOUD') === true

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

export const buildInfoCommand = (opts: RpcCommandOptions): string => buildRpcCommand(opts, 'rpc.exe', 'amtinfo --json')

export interface ActivateCommandOptions {
  isWin: boolean
  rpcDockerImage: string
  amtVersion: string
  // console-only
  profileYamlFile?: string
  encryptionKey?: string
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
  const flagPart = parseInt(opts.amtVersion) <= 18 ? '' : ' --skip-amt-cert-check'
  const args = `activate --profile ${profilePath} --key ${opts.encryptionKey}${flagPart} ${commonFlag}`
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
  // cloud-only
  fqdn?: string
}

export const buildDeactivateCommand = (opts: DeactivateCommandOptions): string => {
  const commonFlag = '-v -f --json'
  if (isCloud) {
    const flagPart = parseInt(opts.amtVersion) <= 18 ? ' --tls-tunnel' : ''
    const args = `deactivate -u wss://${opts.fqdn}/activate -n${flagPart} --password ${opts.password} ${commonFlag}`
    return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
  }

  const flagPart = parseInt(opts.amtVersion) <= 18 ? '' : ' --skip-amt-cert-check'
  const passPart = opts.isAdminControlModeProfile ? ` --password ${opts.password}` : ''
  const args = `deactivate --local${flagPart}${passPart} ${commonFlag}`
  return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
}