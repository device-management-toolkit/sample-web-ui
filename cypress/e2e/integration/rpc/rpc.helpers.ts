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

// Runs `rpc amtinfo` and selects the AMT payload from JSON output with log records.
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

      // rpc may emit JSON-formatted logs before the final amtinfo payload.
      const candidates: number[] = [jsonStart]
      let nextObjectStart = source.indexOf('\n{', jsonStart)
      while (nextObjectStart >= 0) {
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

      throw new Error(`rpc amtinfo did not contain an AMT version payload. Output:\n${combined}`)
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
  const flagPart = parseInt(opts.amtVersion) <= 18 ? '' : ' --skip-amt-cert-check'
  const args = `activate --profile ${profilePath} --key ${opts.encryptionKey}${flagPart} -v --json`
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
  // cloud-only
  fqdn?: string
}

const buildCloudDeactivateCommandArgsCandidates = (opts: DeactivateCommandOptions): string[] => {
  const rpcVersion = getRpcMajorVersion()
  // rpc v2 keeps the legacy single-dash JSON flag for deactivate; the TLS tunnel flag is not required here.
  const jsonFlag = rpcVersion === '2' ? '-json' : '--json'

  return [`deactivate -u wss://${opts.fqdn}/activate -n --password ${opts.password} -v -f ${jsonFlag}`]
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

  const flagPart = parseInt(opts.amtVersion) <= 18 ? '' : ' --skip-amt-cert-check'
  const passPart = opts.isAdminControlModeProfile ? ` --password ${opts.password}` : ''
  const args = `deactivate --local${flagPart}${passPart} ${commonFlag}`
  return buildRpcCommand({ isWin: opts.isWin, rpcDockerImage: opts.rpcDockerImage }, 'rpc.exe', args)
}
