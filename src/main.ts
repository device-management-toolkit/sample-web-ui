/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { enableProdMode, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core'
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
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { firstValueFrom } from 'rxjs'
import { MatPaginatorIntl } from '@angular/material/paginator'
import { TranslatePaginatorIntl } from './assets/i18n/translate-paginator-intl'
import { availableLangs } from './constants'
import { getDirection } from './utils'

if (environment.production) {
  enableProdMode()
}

const providers = [
  AuthGuard,
  provideZonelessChangeDetection(),
  provideAnimations(),
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
