/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { enableProdMode, importProvidersFrom } from '@angular/core'
import { environment } from './environments/environment'
import { AppComponent } from './app/app.component'
import { provideRouter } from '@angular/router'
import { provideAnimations } from '@angular/platform-browser/animations'
import { routes } from './app/routes'
import { bootstrapApplication } from '@angular/platform-browser'
import { MomentModule } from 'ngx-moment'
import { AuthorizeInterceptor } from './app/authorize.interceptor'
import { provideHttpClient, withInterceptors } from '@angular/common/http'

if (environment.production) {
  enableProdMode()
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(MomentModule),
    provideHttpClient(withInterceptors([AuthorizeInterceptor])),
    provideAnimations(),
    provideRouter(routes)
  ]
}).catch((err) => {
  console.error(err)
})
