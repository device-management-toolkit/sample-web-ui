/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const assert = require('node:assert/strict')
const { before, test } = require('node:test')
const { execFile, spawn } = require('node:child_process')
const { promisify } = require('node:util')
const { randomUUID } = require('node:crypto')
const run = promisify(execFile)
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'node' } })
const { execTask, cancelExecTasks } = require('../support/exec-task.ts')
const image = process.env.CYPRESS_DOCKER_TEST_IMAGE || 'alpine:3.22'
const docker = async (...args) => (await run('docker', args, { timeout: 120000, windowsHide: true })).stdout.trim()

before(async () => {
  await docker('version', '--format', '{{.Server.Version}}')
  try {
    await docker('image', 'inspect', image)
  } catch {
    await docker('pull', image)
  }
})

const fixture = (t, script = 'sleep 60') => {
  const label = `cypress.cleanup.test=${randomUUID()}`
  const ids = () => docker('ps', '--all', '--quiet', '--filter', `label=${label}`)
  t.after(async () => {
    const remaining = await ids()
    if (remaining) await docker('rm', '--force', ...remaining.split(/\s+/))
  })
  return {
    command: `docker run --rm --label ${label} ${image} sh -c "${script}"`,
    ids,
    async waitRunning() {
      const deadline = Date.now() + 15000
      while (Date.now() < deadline) {
        if (await docker('ps', '--quiet', '--filter', `label=${label}`)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      throw new Error('The test container never started')
    }
  }
}

// Check real Docker exit codes and removal so daemon-owned containers cannot accumulate after normal commands.
test('Docker commands preserve nonzero exits and remove their containers', async (t) => {
  const f = fixture(t, 'printf expected; exit 7')
  const result = await execTask({ command: f.command, timeout: 15000 })
  assert.equal(result.code, 7)
  assert.equal(result.stdout, 'expected')
  assert.equal(await f.ids(), '')
})

// Verify daemon-side removal after timeout; killing a local Docker client alone cannot satisfy this test.
test('timeout removes a running Docker container before rejecting', async (t) => {
  const f = fixture(t)
  const result = execTask({ command: f.command, timeout: 5000 })
  const rejected = assert.rejects(result, /did not complete normally/)
  await f.waitRunning()
  await rejected
  assert.equal(await f.ids(), '')
})

// Stop containers that exceed the output limit so a failed log capture cannot leave RPC working on the device.
test('output overflow removes the Docker container', async (t) => {
  const f = fixture(t, 'sleep 2; yes')
  await assert.rejects(execTask({ command: f.command, timeout: 15000 }), /did not complete normally/)
  assert.equal(await f.ids(), '')
})

// Await cleanup on Cypress lifecycle cancellation before another spec can start an RPC command.
test('run cancellation removes the active Docker container', async (t) => {
  const f = fixture(t)
  const rejected = assert.rejects(execTask({ command: f.command, timeout: 30000 }), /did not complete normally/)
  await f.waitRunning()
  await cancelExecTasks()
  await rejected
  assert.equal(await f.ids(), '')
})

const startPlugin = (t, command) => {
  const source = `
    require('ts-node').register({transpileOnly:true,compilerOptions:{module:'CommonJS',moduleResolution:'node'}})
    const {execTask}=require('./cypress/support/exec-task.ts')
    process.on('message', message => { if(message === 'exit') process.exit(0) })
    execTask({command:process.argv[1],timeout:30000}).catch(()=>{})
  `
  const child = spawn(
    process.execPath,
    [
      '-e',
      source,
      command
    ],
    { stdio: [
        'ignore',
        'ignore',
        'inherit',
        'ipc'
      ], windowsHide: true }
  )
  t.after(() => {
    if (child.exitCode === null) child.kill()
  })
  const closed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', resolve)
  })
  return { child, closed }
}

// Cypress plugin IPC disconnection must clean the daemon-owned container even without a final task response.
test('plugin disconnection removes its running container', async (t) => {
  const f = fixture(t)
  const { child, closed } = startPlugin(t, f.command)
  await f.waitRunning()
  child.disconnect()
  await closed
  assert.equal(await f.ids(), '')
})

// A direct plugin exit needs synchronous cleanup because Node cannot await promises in its exit event.
test('direct plugin exit removes its running container', async (t) => {
  const f = fixture(t)
  const { child, closed } = startPlugin(t, f.command)
  await f.waitRunning()
  child.send('exit')
  await closed
  assert.equal(await f.ids(), '')
})

// Real POSIX Ctrl+C/SIGTERM delivery must clean containers despite detached local process groups.
for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} removes the plugin container`, { skip: process.platform === 'win32' }, async (t) => {
    const f = fixture(t)
    const { child, closed } = startPlugin(t, f.command)
    await f.waitRunning()
    child.kill(signal)
    await closed
    assert.equal(await f.ids(), '')
  })
}
