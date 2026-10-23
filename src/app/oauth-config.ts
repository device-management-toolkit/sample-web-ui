/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AuthConfig } from 'angular-oauth2-oidc'

/**
 * Builds the config handed to OAuthService.configure(). The audience is
 * dropped while it is empty, or still the ##AUDIENCE## token because Console
 * or init.sh set none, so the IdP never receives it.
 */
export function oauthConfig(auth: AuthConfig): AuthConfig {
  const audience = (auth.customQueryParams as Record<string, unknown> | undefined)?.['audience']
  const isSet = typeof audience === 'string' && audience !== '' && !/^##.*##$/.test(audience)
  return isSet ? auth : { ...auth, customQueryParams: undefined }
}
