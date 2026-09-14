/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/// <reference types="node" />
import { execFile, execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { accessSync, constants, statSync } from 'node:fs'
import { delimiter, extname, join } from 'node:path'

export interface ExecResult {
  code: number
  stdout: string
  stderr: string
}

// RPC builders produce a single executable followed by arguments. Check its
// availability before the shell can turn a launch failure into an RPC exit code.
const executableAvailable = (command: string): boolean => {
  const match = command.match(/^\s*(?:"([^"]+)"|'([^']+)'|([^\s]+))/)
  const executable = match?.[1] ?? match?.[2] ?? match?.[3]
  if (!executable) return false
  const windows = process.platform === 'win32'
  const hasPath = executable.includes('/') || (windows && executable.includes('\\'))
  const directories = hasPath ? [''] : (process.env.PATH ?? '').split(delimiter)
  if (windows && !hasPath) directories.unshift('')
  const extensions = windows && !extname(executable) ? (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';') : ['']
  return directories.some((directory) =>
    extensions.some((extension) => {
      const candidate = join(directory.replace(/^"(.*)"$/, '$1'), executable + extension)
      try {
        accessSync(candidate, windows ? constants.F_OK : constants.X_OK)
        return statSync(candidate).isFile()
      } catch {
        return false
      }
    })
  )
}

const processes = new Set<number>()
const containers = new Set<string>()
const activeTasks = new Map<AbortController, Promise<ExecResult>>()
let cleanupFailed = false
let handlersInstalled = false

const removeContainer = (name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(
      'docker',
      [
        'rm',
        '--force',
        name
      ],
      { windowsHide: true, timeout: 10000 },
      (error, _stdout, stderr) => {
        if (error && !/No such container/i.test(stderr)) {
          cleanupFailed = true
          reject(
            new Error(
              'RPC container cleanup failed. Further RPC commands are blocked; check Docker and restart the run.'
            )
          )
        } else {
          containers.delete(name)
          resolve()
        }
      }
    )
  })

export const cancelExecTasks = async (): Promise<void> => {
  const tasks = [...activeTasks.entries()]
  for (const [controller] of tasks) controller.abort()
  await Promise.allSettled(tasks.map(([, task]) => task))
  if (cleanupFailed) throw new Error('RPC container cleanup failed. Check Docker before restarting the run.')
}

const installCleanupHandlers = (): void => {
  if (handlersInstalled) return
  handlersInstalled = true
  const shutdown = (code: number): void => {
    void cancelExecTasks().then(
      () => process.exit(code),
      () => process.exit(1)
    )
  }
  process.once('SIGINT', () => shutdown(130))
  process.once('SIGTERM', () => shutdown(143))
  process.once('disconnect', () => shutdown(1))
  // Cypress can exit its plugin process directly. Exit callbacks cannot await
  // promises, so use bounded synchronous cleanup as the final shutdown fallback.
  process.once('exit', () => {
    for (const pid of processes) {
      try {
        if (process.platform === 'win32') {
          execFileSync(
            'taskkill',
            [
              '/PID',
              String(pid),
              '/T',
              '/F'
            ],
            { windowsHide: true, timeout: 10000, stdio: 'ignore' }
          )
        } else process.kill(-pid, 'SIGKILL')
      } catch {
        /* The process may already have exited. */
      }
    }
    for (const name of containers) {
      try {
        execFileSync(
          'docker',
          [
            'rm',
            '--force',
            name
          ],
          { windowsHide: true, timeout: 10000, stdio: 'ignore' }
        )
      } catch {
        process.stderr.write('RPC container cleanup failed during shutdown. Check Docker before restarting the run.\n')
        process.exitCode = 1
      }
    }
  })
}

// Ordinary nonzero exits remain available for negative RPC assertions.
const runProcess = (command: string, timeout: number, signal: AbortSignal): Promise<ExecResult> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('RPC execution cancelled.'))
      return
    }
    if (!executableAvailable(command)) {
      // Commands and shell diagnostics can contain credentials; report neither.
      reject(new Error('RPC executable was not found or is not executable. Check its path and installation.'))
      return
    }
    const windows = process.platform === 'win32'
    // A separate POSIX process group lets us stop the shell and its descendants.
    // On Windows, taskkill /T traverses the process tree before killing the shell.
    const child = spawn(command, { shell: true, detached: !windows, windowsHide: true })
    if (child.pid !== undefined) processes.add(child.pid)
    const output = { stdout: [] as Buffer[], stderr: [] as Buffer[] }
    const sizes = { stdout: 0, stderr: 0 }
    let stopping = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const failure = (cleanupFailed = false): Error =>
      // Never include command text or child-process error messages in failures.
      new Error(
        `RPC process did not complete normally (timeout, signal, or execution failure; limit ${timeout}ms).${
          cleanupFailed ? ' Process-tree cleanup failed.' : ''
        }`
      )
    const stop = (): void => {
      if (stopping) return
      stopping = true
      clearTimeout(timer)
      const finish = (cleanupFailed = false): void => {
        signal.removeEventListener('abort', stop)
        if (!cleanupFailed && child.pid !== undefined) processes.delete(child.pid)
        child.stdout.destroy()
        child.stderr.destroy()
        reject(failure(cleanupFailed))
      }
      if (child.pid === undefined) {
        finish()
      } else if (windows) {
        execFile(
          'taskkill',
          [
            '/PID',
            String(child.pid),
            '/T',
            '/F'
          ],
          { windowsHide: true, timeout: 10000 },
          (error) => {
            finish(error != null)
          }
        )
      } else {
        try {
          process.kill(-child.pid, 'SIGKILL')
          finish()
        } catch (error) {
          finish((error as NodeJS.ErrnoException).code !== 'ESRCH')
        }
      }
    }
    child.stdin.end()
    for (const stream of ['stdout', 'stderr'] as const) {
      child[stream].on('data', (chunk: Buffer) => {
        if (stopping) return
        sizes[stream] += chunk.length
        if (sizes[stream] > 10 * 1024 * 1024) stop()
        else output[stream].push(chunk)
      })
    }
    child.on('error', stop)
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      if (stopping) return
      if (signal || code === null) {
        stop()
      } else {
        if (child.pid !== undefined) processes.delete(child.pid)
        resolve({
          code,
          stdout: Buffer.concat(output.stdout).toString(),
          stderr: Buffer.concat(output.stderr).toString()
        })
      }
    })
    signal.addEventListener('abort', stop, { once: true })
    child.once('close', () => signal.removeEventListener('abort', stop))
    if (timeout > 0) timer = setTimeout(stop, timeout)
  })

export const execTask = ({ command, timeout = 60000 }: { command: string; timeout?: number }): Promise<ExecResult> => {
  if (cleanupFailed)
    return Promise.reject(
      new Error('RPC commands are blocked after a container cleanup failure. Restart the run after checking Docker.')
    )
  installCleanupHandlers()
  const controller = new AbortController()
  const started = Date.now()
  const remaining = (): number => {
    if (timeout === 0) return 0
    const value = timeout - (Date.now() - started)
    if (value <= 0) throw new Error('RPC execution timed out before the command could start.')
    return value
  }
  const task = (async (): Promise<ExecResult> => {
    // This is the Docker command form emitted by the RPC builders. Create and
    // start separately: a cancelled create can at worst leave a stopped container,
    // never a late-starting provisioning process owned by the Docker daemon.
    const dockerRun = /^\s*docker\s+run\s+--rm\s+/
    if (!dockerRun.test(command)) return runProcess(command, remaining(), controller.signal)
    const name = `cypress-rpc-${randomUUID()}`
    containers.add(name)
    try {
      const created = await runProcess(
        command.replace(dockerRun, `docker create --name ${name} `),
        remaining(),
        controller.signal
      )
      if (created.code !== 0)
        throw new Error('RPC container could not be created. Check Docker and the image configuration.')
      return await runProcess(`docker start --attach ${name}`, remaining(), controller.signal)
    } finally {
      await removeContainer(name)
    }
  })()
  activeTasks.set(controller, task)
  return task.finally(() => activeTasks.delete(controller))
}
