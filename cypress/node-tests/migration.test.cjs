/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS', moduleResolution: 'node' }
})
const { execTask } = require('../support/exec-task.ts')
const { publicConfig } = require('../support/public-config.ts')
const { basicAuthRequest } = require('../support/basic-auth-request.ts')

const nodeCommand = (source) => `"${process.execPath}" -e "${source}"`

// Keep secrets out of browser configuration while preserving public overrides and their precedence.
test('only public legacy overrides are exposed and explicit expose values win', () => {
  const env = { BASEURL: 'legacy', ISOLATE: 'N', MPS_PASSWORD: 'private', FUTURE_TOKEN: 'private' }
  const expose = { BASEURL: 'explicit', CUSTOM_PUBLIC_FLAG: true }
  assert.deepEqual(publicConfig(env, expose), {
    BASEURL: 'explicit',
    ISOLATE: 'N',
    CUSTOM_PUBLIC_FLAG: true
  })
  assert.deepEqual(expose, { BASEURL: 'explicit', CUSTOM_PUBLIC_FLAG: true })
  assert.deepEqual(publicConfig({ API_URL: 'public', API_PASSWORD: 'private', BASEURL: 'unused' }, {}, ['API_URL']), {
    API_URL: 'public'
  })
})

// Preserve successful command output and exit codes so RPC tests can check the results.
test('successful commands preserve stdout and stderr', async () => {
  const source = "process.stdout.write('ok'); process.stderr.write('note')"
  for (const command of [nodeCommand(source), `node -e "${source}"`]) {
    assert.deepEqual(await execTask({ command }), {
      code: 0,
      stdout: 'ok',
      stderr: 'note'
    })
  }
})

// Return ordinary command failures so negative RPC tests can verify the expected error.
test('ordinary nonzero exits remain available to negative RPC assertions', async () => {
  for (const code of [
    1,
    7,
    127
  ]) {
    const result = await execTask({
      command: nodeCommand(`process.stdout.write('expected failure'); process.exit(${code})`)
    })
    assert.equal(result.code, code)
    assert.equal(result.stdout, 'expected failure')
  }
})

// Reject missing executables before the shell reports a normal exit, without leaking command arguments.
test('missing executables reject for PATH lookup and quoted paths', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpc-missing-test-'))
  try {
    for (const executable of ['codex_nonexistent_rpc_3554', `"${path.join(dir, 'missing rpc.exe')}"`]) {
      await assert.rejects(execTask({ command: `${executable} --password private-command-marker` }), (error) => {
        assert.match(error.message, /executable was not found or is not executable/)
        assert.equal(error.message.includes('private-command-marker'), false)
        assert.equal(error.message.includes(executable), false)
        return true
      })
    }
  } finally {
    fs.rmdirSync(dir)
  }
})

// Fail timed-out commands despite earlier output, without exposing command text that may contain passwords.
test('a timeout rejects even after expected output and does not disclose the command', async () => {
  await assert.rejects(
    execTask({
      command: nodeCommand("process.stdout.write('private-command-marker'); setTimeout(() => {}, 2000)"),
      timeout: 500
    }),
    (error) => {
      assert.match(error.message, /did not complete normally/)
      assert.equal(error.message.includes('private-command-marker'), false)
      return true
    }
  )
})

// Reject excessive output so a buffer failure cannot be mistaken for an expected RPC error.
test('output buffer exhaustion rejects instead of becoming a negative-test success', async () => {
  await assert.rejects(
    execTask({ command: nodeCommand("process.stdout.write('x'.repeat(11 * 1024 * 1024))") }),
    /did not complete normally/
  )
})

// Stop child and grandchild processes on timeout so RPC commands cannot keep working after the test fails.
test('timeout stops the child and grandchild before either can perform later work', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpc-tree-test-'))
  const script = path.join(dir, 'child.cjs')
  fs.writeFileSync(
    script,
    `
    const fs = require('node:fs'), path = require('node:path')
    const role = process.argv[2] || 'parent'
    fs.writeFileSync(path.join(__dirname, role + '.started'), '')
    if (role === 'parent') {
      require('node:child_process').spawn(process.execPath, [__filename, 'grandchild'], { stdio: 'inherit' })
    }
    setTimeout(() => fs.writeFileSync(path.join(__dirname, role + '.late'), ''), 3000)
  `
  )
  try {
    await assert.rejects(
      execTask({ command: `"${process.execPath}" "${script}"`, timeout: 1500 }),
      /did not complete normally/
    )
    await new Promise((resolve) => setTimeout(resolve, 3500))
    for (const role of ['parent', 'grandchild']) {
      assert.equal(fs.existsSync(path.join(dir, role + '.started')), true, role + ' must have started')
      assert.equal(fs.existsSync(path.join(dir, role + '.late')), false, role + ' must stop at timeout')
    }
  } finally {
    for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file))
    fs.rmdirSync(dir)
  }
})

// Accept numeric passwords and reject missing ones so authenticated requests handle configuration overrides correctly.
test('authenticated requests normalize numeric credentials and reject missing credentials', async (t) => {
  let credential
  let requests = 0
  global.cy = {
    env: (keys) => {
      assert.deepEqual(keys, ['API_PASSWORD'])
      return Promise.resolve({ API_PASSWORD: credential })
    },
    request: (options) => {
      requests++
      assert.equal(
        options.headers.Authorization,
        'Basic ' + Buffer.from('review-user:' + credential).toString('base64')
      )
      assert.equal(options.headers['Content-Type'], 'application/json')
      assert.equal(options.log, false)
      return Promise.resolve({ status: 200 })
    }
  }
  t.after(() => {
    delete global.cy
  })
  const options = { url: 'http://localhost/api', headers: { 'Content-Type': 'application/json' } }
  for (credential of [
    12345678,
    0,
    '00123456',
    'ordinary-password'
  ]) {
    assert.equal((await basicAuthRequest(options, 'review-user', 'API_PASSWORD')).status, 200)
  }
  for (credential of [
    undefined,
    null,
    ''
  ]) {
    await assert.rejects(basicAuthRequest(options, 'review-user', 'API_PASSWORD'), /API_PASSWORD must be configured/)
  }
  assert.equal(requests, 4)
})
