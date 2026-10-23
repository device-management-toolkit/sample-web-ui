/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { describe, expect, it } from 'vitest'
import { oauthConfig } from './oauth-config'

describe('oauthConfig', () => {
  const base = { clientId: 'spa-client', issuer: 'https://idp.example.com', responseType: 'code' }

  it('keeps a configured audience', () => {
    const config = oauthConfig({ ...base, customQueryParams: { audience: 'https://api.example.com' } })

    expect(config.customQueryParams).toEqual({ audience: 'https://api.example.com' })
  })

  it('drops an audience placeholder that was never replaced', () => {
    const config = oauthConfig({ ...base, customQueryParams: { audience: '##AUDIENCE##' } })

    expect(config).toEqual(base)
  })

  it('drops an empty audience', () => {
    const config = oauthConfig({ ...base, customQueryParams: { audience: '' } })

    expect(config).toEqual(base)
  })

  it('returns a config without custom query parameters unchanged', () => {
    expect(oauthConfig(base)).toEqual(base)
  })

  it('does not modify the environment it was given', () => {
    const auth = { ...base, customQueryParams: { audience: '##AUDIENCE##' } }

    oauthConfig(auth)

    expect(auth.customQueryParams).toEqual({ audience: '##AUDIENCE##' })
  })
})
