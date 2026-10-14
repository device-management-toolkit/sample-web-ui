/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { enableProdMode, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core'
import { environment } from './environments/environment'
import { AppComponent } from './app/app.component'
import { provideRouter } from '@angular/router'
import { routes } from './app/routes'
import { bootstrapApplication } from '@angular/platform-browser'
import {
  HttpBackend,
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi
} from '@angular/common/http'
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc'
import { AuthGuard } from './app/shared/auth-guard.service'
import { AuthService } from './app/auth.service'
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { errorHandlingInterceptor } from './app/error-handling.interceptor'
import { authorizationInterceptor } from './app/authorize.interceptor'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { firstValueFrom, timeout } from 'rxjs'
import { catchError, map, of } from 'rxjs'
import { MatPaginatorIntl } from '@angular/material/paginator'
import { TranslatePaginatorIntl } from './assets/i18n/translate-paginator-intl'
import { availableLangs } from './constants'
import { getDirection } from './utils'
import { patchAmtIderLargeMediaSupport } from './app/shared/amt-ider-large-media'
import { ServerFeatures } from './models/models'

if (environment.production) {
  enableProdMode()
}

patchAmtIderLargeMediaSupport()

const providers = [
  AuthGuard,
  provideZonelessChangeDetection(),
  provideRouter(routes),
  provideTranslateService({
    loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
  }),
  { provide: MatPaginatorIntl, useClass: TranslatePaginatorIntl },
  provideAppInitializer(() => {
    const translate = inject(TranslateService)

    translate.setFallbackLang('en')

    return firstValueFrom(translate.use(getLangCode()))
  })
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
    )
  )
} else {
  providers.push(provideHttpClient(withInterceptors([authorizationInterceptor, errorHandlingInterceptor])))
}
providers.push(
  provideAppInitializer(() => {
    const authService = inject(AuthService)
    const oauthService = environment.useOAuth ? inject(OAuthService) : null
    const featureHttp = new HttpClient(inject(HttpBackend))
    const authDisabledRequest = environment.cloud
      ? of(false)
      : featureHttp
          .get<ServerFeatures>(`${environment.rpsServer}/api/v1/server/features`, { withCredentials: true })
          .pipe(
            map((features) => features.authDisabled === true),
            timeout({ first: 10_000 }),
            catchError(() => of(false))
          )

    return firstValueFrom(authDisabledRequest).then((authDisabled) => {
      authService.setAuthDisabled(authDisabled)

      if (oauthService != null && !authDisabled) {
        oauthService.configure(environment.auth)
        return oauthService.loadDiscoveryDocumentAndTryLogin()
      }

      return undefined
    })
  })
)
bootstrapApplication(AppComponent, {
  providers
}).catch((err) => {
  console.error(err)
})

function getLangCode() {
  const savedLang = localStorage.getItem('lang')
  const browserLang = navigator.language.split('-')[0] // e.g. "en-US" → "en"
  const langToUse = availableLangs.some((lang) => lang.code === browserLang) ? browserLang : 'en'
  const finalLang = savedLang || langToUse

  document.documentElement.setAttribute('dir', getDirection(finalLang))
  document.documentElement.setAttribute('lang', finalLang)

  return finalLang
}
