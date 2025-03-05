/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { enableProdMode, inject, provideAppInitializer } from '@angular/core'
import { environment } from './environments/environment'
import { AppComponent } from './app/app.component'
import { provideRouter } from '@angular/router'
import { provideAnimations } from '@angular/platform-browser/animations'
import { routes } from './app/routes'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http'
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc'
import { AuthGuard } from './app/shared/auth-guard.service'
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { errorHandlingInterceptor } from './app/error-handling.interceptor'
import { authorizationInterceptor } from './app/authorize.interceptor'

if (environment.production) {
  enableProdMode()
}
const providers = [
  AuthGuard,
  provideAnimations(),
  provideRouter(routes)
]
if (environment.useOAuth) {
  providers.push(
    provideHttpClient(withInterceptors([errorHandlingInterceptor]), withInterceptorsFromDi()),
    provideOAuthClient(
      {
        resourceServer: {
          allowedUrls: [environment.mpsServer],
          sendAccessToken: true
        }
      },
      JwksValidationHandler
    ),
    provideAppInitializer(() => {
      const oauthService = inject(OAuthService)
      oauthService.configure(environment.auth)
      return oauthService.loadDiscoveryDocumentAndTryLogin()
    })
  )
} else {
  providers.push(provideHttpClient(withInterceptors([authorizationInterceptor, errorHandlingInterceptor])))
}
bootstrapApplication(AppComponent, {
  providers
})
  .then(() => {})
  .catch((err) => {
    console.error(err)
  })
