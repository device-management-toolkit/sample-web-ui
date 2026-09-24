/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const downloadRpc = {
  versions: {
    success: {
      response: [
        {
          version: 'v3.2.0',
          assets: [
            { name: 'rpc_windows_x64.exe', os: 'windows', arch: 'x64' },
            { name: 'rpc_linux_x64.tar.gz', os: 'linux', arch: 'x64' }
          ]
        },
        {
          version: 'v3.1.0',
          assets: [
            { name: 'rpc_linux_x64.tar.gz', os: 'linux', arch: 'x64' },
            { name: 'rpc_windows_x86.exe', os: 'windows', arch: 'x86' }
          ]
        }
      ]
    }
  },
  profiles: {
    success: {
      response: {
        data: [
          { profileName: 'ccmProfile', activation: 'ccmactivate' },
          { profileName: 'acmProfile', activation: 'acmactivate' }
        ],
        totalCount: 2
      }
    }
  },
  domains: {
    success: {
      response: {
        data: [{ profileName: 'corpDomain', domainSuffix: 'corp.example.com' }],
        totalCount: 1
      }
    }
  }
}

export { downloadRpc }
